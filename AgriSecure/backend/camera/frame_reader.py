"""
Module de lecture des frames depuis une caméra.
Responsabilité unique : Acquisition des frames via OpenCV
"""
import cv2
import logging
from typing import Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)


class FrameReader:
    """Gestionnaire de lecture de frames depuis une caméra physique."""

    def __init__(self, camera_index: int = 0):
        """
        Initialise le lecteur de frames.

        Args:
            camera_index: Index de la caméra (0 pour caméra par défaut)
        """
        self.camera_index = camera_index
        self.cap = None
        self.consecutive_failures = 0
        self.max_failures = 5

    def open_camera(self) -> bool:
        """
        Ouvre la connexion à la caméra.

        Returns:
            True si succès, False sinon
        """
        try:
            self.cap = cv2.VideoCapture(self.camera_index)

            if not self.cap.isOpened():
                logger.error(f"Impossible d'ouvrir la caméra {self.camera_index}")
                return False

            logger.info(f"Caméra {self.camera_index} ouverte avec succès")
            return True

        except Exception as e:
            logger.error(f"Erreur ouverture caméra {self.camera_index}: {e}")
            return False

    def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Lit une frame depuis la caméra.

        Returns:
            Tuple (success, frame) où:
                - success: True si lecture OK
                - frame: Numpy array ou None
        """
        if self.cap is None:
            logger.error("Caméra non initialisée")
            return False, None

        try:
            ret, frame = self.cap.read()

            if not ret:
                self.consecutive_failures += 1
                logger.warning(
                    f"Échec lecture frame ({self.consecutive_failures}/{self.max_failures})"
                )
                return False, None

            # Reset compteur sur succès
            self.consecutive_failures = 0
            return True, frame

        except cv2.error as e:
            logger.error(f"Erreur OpenCV lors de la lecture: {e}")
            self.consecutive_failures += 1
            return False, None

    def has_too_many_failures(self) -> bool:
        """
        Vérifie si le seuil d'échecs consécutifs est atteint.

        Returns:
            True si trop d'échecs, False sinon
        """
        return self.consecutive_failures >= self.max_failures

    def release(self):
        """Libère les ressources de la caméra."""
        if self.cap is not None:
            try:
                self.cap.release()
                logger.info(f"Caméra {self.camera_index} libérée")
            except Exception as e:
                logger.error(f"Erreur libération caméra {self.camera_index}: {e}")
            finally:
                self.cap = None
