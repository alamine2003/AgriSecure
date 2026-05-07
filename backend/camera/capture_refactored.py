"""
Module principal de capture vidéo.
Responsabilité unique : Orchestration du pipeline de capture
Architecture Clean Code : Chaque opération déléguée à un module spécialisé
"""
import time
import threading
import os
import logging
from typing import Optional

from ai_engine.detector import YOLODetector
from .frame_reader import FrameReader
from .frame_encoder import encode_frame_to_base64, prepare_frame_for_transmission
from .detection_filter import filter_critical_detections, should_capture_frame
from .websocket_broadcaster import WebSocketBroadcaster
from .detection_processor import DetectionProcessor

logger = logging.getLogger(__name__)


class CameraCapture(threading.Thread):
    """
    Thread de capture vidéo avec analyse IA temps réel.

    Architecture:
        1. FrameReader: Acquisition frames
        2. YOLODetector: Analyse IA
        3. FrameEncoder: Encodage JPEG Base64
        4. DetectionFilter: Filtrage détections critiques
        5. WebSocketBroadcaster: Diffusion temps réel
        6. DetectionProcessor: Sauvegarde asynchrone (Celery)
    """

    def __init__(self, camera_id: str, camera_index: int = 0):
        """
        Initialise le thread de capture.

        Args:
            camera_id: Identifiant UUID de la caméra
            camera_index: Index OpenCV de la caméra physique
        """
        super().__init__()
        self.camera_id = camera_id
        self.camera_index = camera_index
        self.fps = int(os.getenv('CAMERA_FPS', 15))
        self.running = False

        # Initialisation des modules spécialisés
        self.frame_reader = FrameReader(camera_index)
        self.detector = YOLODetector()
        self.broadcaster = WebSocketBroadcaster(camera_id)
        self.processor = DetectionProcessor(camera_id)

    def run(self):
        """Point d'entrée du thread. Orchestre le pipeline complet."""
        self.running = True
        logger.info(f"Démarrage capture caméra {self.camera_id} (index {self.camera_index})")

        # Étape 1: Ouverture caméra
        if not self._initialize_camera():
            self.running = False
            return

        # Étape 2: Boucle principale de capture
        try:
            self._capture_loop()
        except Exception as e:
            logger.error(f"Erreur critique dans la boucle de capture: {e}")
        finally:
            self._cleanup()

    def _initialize_camera(self) -> bool:
        """
        Initialise la connexion à la caméra.

        Returns:
            True si succès, False sinon
        """
        if not self.frame_reader.open_camera():
            logger.error(f"Échec initialisation caméra {self.camera_id}")
            return False
        return True

    def _capture_loop(self):
        """Boucle principale de capture et traitement."""
        wait_time = 1.0 / self.fps

        while self.running:
            start_time = time.time()

            # Étape 1: Lecture frame
            frame = self._read_next_frame()
            if frame is None:
                if self.frame_reader.has_too_many_failures():
                    logger.error(f"Trop d'échecs consécutifs, arrêt caméra {self.camera_id}")
                    break
                continue

            # Étape 2: Analyse IA
            detections = self._analyze_frame(frame)

            # Étape 3: Encodage frame
            frame_b64 = encode_frame_to_base64(frame)
            if frame_b64 is None:
                continue

            # Étape 4: Traitement détections critiques
            self._process_critical_detections(detections, frame_b64)

            # Étape 5: Diffusion WebSocket
            frame_data_uri = prepare_frame_for_transmission(frame_b64)
            self.broadcaster.broadcast_frame(frame_data_uri, detections)

            # Étape 6: Régulation FPS
            self._throttle_fps(start_time, wait_time)

    def _read_next_frame(self) -> Optional[any]:
        """
        Lit la prochaine frame depuis la caméra.

        Returns:
            Numpy array de la frame ou None en cas d'erreur
        """
        success, frame = self.frame_reader.read_frame()
        return frame if success else None

    def _analyze_frame(self, frame) -> list:
        """
        Analyse une frame avec YOLO.

        Args:
            frame: Numpy array de la frame

        Returns:
            Liste des détections (peut être vide en cas d'erreur)
        """
        try:
            return self.detector.analyze(frame)
        except Exception as e:
            logger.error(f"Erreur analyse IA caméra {self.camera_id}: {e}")
            return []

    def _process_critical_detections(self, detections: list, frame_b64: str):
        """
        Traite les détections critiques (HIGH/MEDIUM) pour sauvegarde.

        Args:
            detections: Liste complète des détections
            frame_b64: Frame encodée en Base64
        """
        critical_detections = filter_critical_detections(detections)

        for detection in critical_detections:
            # Capture frame uniquement pour niveau HIGH
            frame_to_save = frame_b64 if should_capture_frame(detection) else None

            # Envoi vers Celery pour traitement asynchrone
            self.processor.enqueue_detection(detection, frame_to_save)

    def _throttle_fps(self, start_time: float, wait_time: float):
        """
        Limite la cadence de capture au FPS configuré.

        Args:
            start_time: Timestamp début du cycle
            wait_time: Temps d'attente cible entre frames
        """
        elapsed = time.time() - start_time
        if elapsed < wait_time:
            time.sleep(wait_time - elapsed)

    def _cleanup(self):
        """Libère les ressources et ferme les connexions."""
        self.frame_reader.release()
        self.running = False
        logger.info(f"Capture arrêtée pour caméra {self.camera_id}")

    def stop(self):
        """Arrête le thread de capture (appelé depuis l'extérieur)."""
        self.running = False
