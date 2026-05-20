import cv2
import base64
import queue
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
        self.width = int(os.getenv('CAMERA_WIDTH', 1280))
        self.height = int(os.getenv('CAMERA_HEIGHT', 720))
        self.stream_width = int(os.getenv('STREAM_WIDTH', 640))
        self.stream_height = int(os.getenv('STREAM_HEIGHT', 480))
        self.jpeg_quality = int(os.getenv('CAMERA_JPEG_QUALITY', 80))
        self._detect_interval = float(os.getenv('YOLO_DETECT_INTERVAL_SECONDS', 2.0))
        self.running = False
        self.channel_layer = get_channel_layer()
        self.detector = YOLODetector()
        self._yolo_queue: queue.Queue = queue.Queue(maxsize=2)
        self._last_detections: list = []
        # Thread YOLO séparé — ne bloque pas la capture
        self._yolo_thread = threading.Thread(target=self._yolo_worker, daemon=True)
        # Thread d'envoi séparé — async_to_sync ne bloque plus le thread de capture
        self._send_queue: queue.Queue = queue.Queue(maxsize=2)
        self._send_thread = threading.Thread(target=self._send_worker, daemon=True)

    def _send_worker(self):
        """Envoie les frames à Redis/WebSocket sans bloquer la capture."""
        while self.running:
            try:
                msg = self._send_queue.get(timeout=1.0)
                async_to_sync(self.channel_layer.group_send)(
                    f'camera_{self.camera_id}', msg
                )
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Erreur envoi WebSocket caméra {self.camera_id}: {e}")

    def _yolo_worker(self):
        """Thread dédié à l'inférence YOLO — ne bloque plus la capture."""
        last_detect_time = 0.0
        confirm_delay = float(os.getenv('YOLO_CONFIRM_DELAY_SECONDS', '1.5'))
        pending: dict = {}

        while self.running:
            try:
                frame = self._yolo_queue.get(timeout=1.0)

                now = time.time()
                if now - last_detect_time < self._detect_interval:
                    continue
                last_detect_time = now

                detections = self.detector.analyze(frame)

                # Mise à l'échelle des bboxes (1280×720 → taille stream)
                sx = self.stream_width / self.width
                sy = self.stream_height / self.height
                scaled = []
                for d in detections:
                    sd = d.copy()
                    x1, y1, x2, y2 = d['bbox']
                    sd['bbox'] = [x1 * sx, y1 * sy, x2 * sx, y2 * sy]
                    scaled.append(sd)
                self._last_detections = scaled

                current_labels = {
                    d['label'] for d in detections
                    if d['danger_level'] in ('HIGH', 'MEDIUM')
                }
                pending = {lbl: t for lbl, t in pending.items() if lbl in current_labels}

                for d in detections:
                    if d['danger_level'] not in ('HIGH', 'MEDIUM'):
                        continue
                    label = d['label']
                    if label not in pending:
                        pending[label] = now
                        logger.debug(f"Détection en attente : {label} (caméra {self.camera_id})")
                    elif now - pending[label] >= confirm_delay:
                        # Remettre le timestamp AVANT la tâche pour éviter les doublons
                        pending[label] = now
                        logger.info(f"Détection confirmée après {confirm_delay}s : {label} (caméra {self.camera_id})")
                        # Encoder la frame pleine résolution pour MinIO
                        frame_b64 = None
                        try:
                            _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                            frame_b64 = base64.b64encode(buf).decode('utf-8')
                        except cv2.error as enc_err:
                            logger.warning(f"Encodage frame MinIO échoué caméra {self.camera_id}: {enc_err}")
                        try:
                            save_detection_task.delay(
                                str(self.camera_id),
                                d['label'],
                                d['confidence'],
                                d['danger_level'],
                                d['bbox'],
                                frame_b64,
                            )
                        except Exception as e:
                            logger.error(f"Erreur Celery caméra {self.camera_id}: {e}")

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Erreur thread YOLO caméra {self.camera_id}: {e}")

    def run(self):
        self.running = True
        self._yolo_thread.start()
        self._send_thread.start()
        logger.info(f"Démarrage capture caméra {self.camera_id} (index {self.camera_index})")

        cap = None
        try:
            cap = cv2.VideoCapture(self.camera_index)
            if not cap.isOpened():
                raise CameraInitializationError(f"Impossible d'ouvrir la caméra {self.camera_index}")

            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            cap.set(cv2.CAP_PROP_FPS, self.fps)

            wait_time = 1.0 / self.fps
            consecutive_read_failures = 0
            max_read_failures = 5

            while self.running:
                start_time = time.time()

                try:
                    ret, frame = cap.read()
                    if not ret:
                        consecutive_read_failures += 1
                        logger.warning(f"Échec lecture frame {self.camera_id} ({consecutive_read_failures}/{max_read_failures})")
                        if consecutive_read_failures >= max_read_failures:
                            raise CameraStreamError(f"Trop d'échecs consécutifs caméra {self.camera_id}")
                        continue
                    consecutive_read_failures = 0
                except cv2.error as e:
                    raise CameraStreamError(f"Erreur OpenCV caméra {self.camera_id}: {e}")

                # Frame pleine résolution → YOLO (non bloquant)
                try:
                    self._yolo_queue.put_nowait(frame.copy())
                except queue.Full:
                    pass

                # Frame réduite → stream WebSocket
                try:
                    stream_frame = cv2.resize(frame, (self.stream_width, self.stream_height))
                    _, buffer = cv2.imencode('.jpg', stream_frame, [cv2.IMWRITE_JPEG_QUALITY, self.jpeg_quality])
                    frame_b64 = base64.b64encode(buffer).decode('utf-8')
                except cv2.error as e:
                    logger.error(f"Erreur encodage caméra {self.camera_id}: {e}")
                    continue

                # Envoi non bloquant : le _send_thread fait l'appel Redis
                try:
                    self._send_queue.put_nowait({
                        'type': 'camera_frame',
                        'frame_b64': f"data:image/jpeg;base64,{frame_b64}",
                        'detections': self._last_detections,
                        'timestamp': datetime.now().isoformat()
                    })
                except queue.Full:
                    pass  # On drops les frames si le sender est saturé

                elapsed = time.time() - start_time
                if elapsed < wait_time:
                    time.sleep(wait_time - elapsed)

        except CameraInitializationError as e:
            logger.error(f"Erreur initialisation caméra {self.camera_id}: {e}")
        except CameraStreamError as e:
            logger.error(f"Erreur flux caméra {self.camera_id}: {e}")
        except Exception as e:
            logger.error(f"Erreur critique caméra {self.camera_id}: {e}")
        finally:
            if cap is not None:
                try:
                    cap.release()
                    logger.info(f"Caméra {self.camera_index} libérée")
                except Exception as e:
                    logger.error(f"Erreur libération caméra {self.camera_index}: {e}")
            self.running = False
            logger.info(f"Capture arrêtée caméra {self.camera_id}")

    def stop(self):
        self.running = False
