"""
Module de traitement asynchrone des détections.
Responsabilité unique : Envoi des détections vers Celery
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class DetectionProcessor:
    """Gestionnaire d'envoi des détections vers les workers Celery."""

    def __init__(self, camera_id: str):
        """
        Initialise le processeur.

        Args:
            camera_id: Identifiant de la caméra
        """
        self.camera_id = camera_id

    def enqueue_detection(
        self,
        detection: Dict[str, Any],
        frame_b64: Optional[str] = None
    ) -> bool:
        """
        Envoie une détection à Celery pour traitement asynchrone.

        Args:
            detection: Dictionnaire de détection YOLO
            frame_b64: Frame encodée (si capture nécessaire)

        Returns:
            True si succès, False sinon
        """
        try:
            # Import lazy pour éviter circular dependencies
            from ai_engine.tasks import save_detection_task

            save_detection_task.delay(
                str(self.camera_id),
                detection['label'],
                detection['confidence'],
                detection['danger_level'],
                detection['bbox'],
                frame_b64
            )
            return True

        except Exception as e:
            logger.error(f"Erreur envoi tâche Celery pour caméra {self.camera_id}: {e}")
            return False
