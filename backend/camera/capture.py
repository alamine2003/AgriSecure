import cv2
import base64
import time
import threading
import os
import logging
from datetime import datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from ai_engine.detector import YOLODetector
from ai_engine.tasks import save_detection_task
from core.exceptions import (
    CameraInitializationError, 
    CameraStreamError, 
    CameraNotFoundError,
    AIEngineException
)

logger = logging.getLogger(__name__)

class CameraCapture(threading.Thread):
    def __init__(self, camera_id, camera_index=0):
        super().__init__()
        self.camera_id = camera_id
        self.camera_index = camera_index
        self.fps = int(os.getenv('CAMERA_FPS', 15))
        self.running = False
        self.channel_layer = get_channel_layer()
        self.detector = YOLODetector()

    def run(self):
        self.running = True
        logger.info(f"Démarrage de la capture pour la caméra {self.camera_id} (index {self.camera_index})")
        
        cap = None
        try:
            # Tentative d'ouverture de la caméra
            cap = cv2.VideoCapture(self.camera_index)
            
            if not cap.isOpened():
                raise CameraInitializationError(f"Impossible d'ouvrir la caméra {self.camera_index}")

            wait_time = 1.0 / self.fps
            consecutive_read_failures = 0
            max_read_failures = 5

            while self.running:
                start_time = time.time()
                
                try:
                    ret, frame = cap.read()
                    
                    if not ret:
                        consecutive_read_failures += 1
                        logger.warning(f"Échec de lecture frame caméra {self.camera_id} ({consecutive_read_failures}/{max_read_failures})")
                        
                        if consecutive_read_failures >= max_read_failures:
                            raise CameraStreamError(f"Trop d'échecs de lecture consécutifs pour caméra {self.camera_id}")
                        continue
                    
                    consecutive_read_failures = 0  # Reset counter on successful read
                    
                except cv2.error as e:
                    raise CameraStreamError(f"Erreur OpenCV lors de la lecture caméra {self.camera_id}: {e}")
                
                # Analyse IA avec gestion d'erreurs spécifique
                try:
                    detections = self.detector.analyze(frame)
                except Exception as e:
                    logger.error(f"Erreur lors de l'analyse IA pour caméra {self.camera_id}: {e}")
                    detections = []  # Continuer sans détections plutôt que de planter

                try:
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_b64 = base64.b64encode(buffer).decode('utf-8')
                except cv2.error as e:
                    logger.error(f"Erreur encodage frame caméra {self.camera_id}: {e}")
                    continue  # Passer à la frame suivante
                
                # Envoi des détections critiques à Celery pour sauvegarde/alerte
                try:
                    for d in detections:
                        if d['danger_level'] in ['HIGH', 'MEDIUM']:
                            save_detection_task.delay(
                                str(self.camera_id), 
                                d['label'], 
                                d['confidence'], 
                                d['danger_level'], 
                                d['bbox'],
                                frame_b64 if d['danger_level'] == 'HIGH' else None
                            )
                except Exception as e:
                    logger.error(f"Erreur envoi tâche Celery pour caméra {self.camera_id}: {e}")

                # Diffusion via Channels
                try:
                    async_to_sync(self.channel_layer.group_send)(
                        f'camera_{self.camera_id}',
                        {
                            'type': 'camera_frame',
                            'frame_b64': f"data:image/jpeg;base64,{frame_b64}",
                            'detections': detections,
                            'timestamp': datetime.now().isoformat()
                        }
                    )
                except Exception as e:
                    logger.error(f"Erreur diffusion WebSocket pour caméra {self.camera_id}: {e}")

                # Limitation FPS
                elapsed = time.time() - start_time
                if elapsed < wait_time:
                    time.sleep(wait_time - elapsed)

        except CameraInitializationError as e:
            logger.error(f"Erreur initialisation caméra {self.camera_id}: {e}")
        except CameraStreamError as e:
            logger.error(f"Erreur flux caméra {self.camera_id}: {e}")
        except Exception as e:
            logger.error(f"Erreur critique inattendue dans la capture caméra {self.camera_id}: {e}")
        finally:
            # Nettoyage garanti des ressources
            if cap is not None:
                try:
                    cap.release()
                    logger.info(f"Ressource caméra {self.camera_index} libérée")
                except Exception as e:
                    logger.error(f"Erreur lors de la libération de la caméra {self.camera_index}: {e}")
            
            self.running = False
            logger.info(f"Capture arrêtée pour la caméra {self.camera_id}")

    def stop(self):
        self.running = False
