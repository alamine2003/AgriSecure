"""
Module de diffusion WebSocket.
Responsabilité unique : Envoi de messages via Django Channels
"""
import logging
from datetime import datetime
from typing import List, Dict, Any
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


class WebSocketBroadcaster:
    """Gestionnaire de diffusion de messages WebSocket."""

    def __init__(self, camera_id: str):
        """
        Initialise le broadcaster.

        Args:
            camera_id: Identifiant de la caméra
        """
        self.camera_id = camera_id
        self.group_name = f'camera_{camera_id}'
        self.channel_layer = get_channel_layer()

    def broadcast_frame(self, frame_b64: str, detections: List[Dict[str, Any]]) -> bool:
        """
        Diffuse une frame avec détections aux clients connectés.

        Args:
            frame_b64: Frame encodée en Base64 (avec data URI)
            detections: Liste des détections YOLO

        Returns:
            True si succès, False sinon
        """
        if not self.channel_layer:
            logger.error("Channel layer non disponible")
            return False

        try:
            async_to_sync(self.channel_layer.group_send)(
                self.group_name,
                {
                    'type': 'camera_frame',
                    'frame_b64': frame_b64,
                    'detections': detections,
                    'timestamp': datetime.now().isoformat()
                }
            )
            return True

        except Exception as e:
            logger.error(f"Erreur diffusion WebSocket caméra {self.camera_id}: {e}")
            return False

    def broadcast_alert(self, message: str, level: str = 'HIGH') -> bool:
        """
        Diffuse une alerte critique aux clients.

        Args:
            message: Texte de l'alerte
            level: Niveau de gravité

        Returns:
            True si succès, False sinon
        """
        if not self.channel_layer:
            logger.error("Channel layer non disponible")
            return False

        try:
            async_to_sync(self.channel_layer.group_send)(
                self.group_name,
                {
                    'type': 'camera_alert',
                    'message': message,
                    'level': level
                }
            )
            return True

        except Exception as e:
            logger.error(f"Erreur envoi alerte WebSocket caméra {self.camera_id}: {e}")
            return False
