"""
Module de gestion de l'encodage des frames.
Responsabilité unique : Conversion numpy array -> JPEG Base64
"""
import cv2
import base64
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


def encode_frame_to_base64(frame) -> Optional[str]:
    """
    Encode une frame numpy en JPEG Base64.

    Args:
        frame: Numpy array (H, W, C) de la frame

    Returns:
        String Base64 ou None en cas d'erreur
    """
    try:
        success, buffer = cv2.imencode('.jpg', frame)
        if not success:
            logger.error("Échec encodage JPEG")
            return None

        return base64.b64encode(buffer).decode('utf-8')
    except cv2.error as e:
        logger.error(f"Erreur OpenCV lors de l'encodage: {e}")
        return None
    except Exception as e:
        logger.error(f"Erreur inattendue lors de l'encodage: {e}")
        return None


def prepare_frame_for_transmission(frame_b64: str) -> str:
    """
    Prépare la frame encodée pour transmission WebSocket.

    Args:
        frame_b64: String Base64 de la frame

    Returns:
        Data URI complète (data:image/jpeg;base64,...)
    """
    return f"data:image/jpeg;base64,{frame_b64}"
