import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .stream_manager import StreamManager

logger = logging.getLogger(__name__)

try:
    from core.custom_metrics import websocket_connections_active
except Exception:
    websocket_connections_active = None

@database_sync_to_async
def _get_camera_for_user(camera_id, user):
    from surveillance.models import Camera
    camera = Camera.objects.get(id=camera_id)
    if user.role == 'maintenancier' or user.is_superuser:
        return camera
    if camera.agent_id != user.id:
        raise PermissionError("forbidden")
    return camera

class CameraConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.room_group_name = f'camera_{self.camera_id}'

        user = self.scope.get('user')
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        try:
            self.camera = await _get_camera_for_user(self.camera_id, user)
        except PermissionError:
            await self.close(code=4403)
            return
        except Exception:
            await self.close(code=4404)
            return
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        # Renvoyer le subprotocol au client (obligatoire si le token a été envoyé via subprotocol)
        subprotocols = self.scope.get('subprotocols', [])
        await self.accept(subprotocol=subprotocols[0] if subprotocols else None)
        if websocket_connections_active:
            websocket_connections_active.inc()
        logger.info(f"Client connecté au flux caméra {self.camera_id}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if websocket_connections_active:
            websocket_connections_active.dec()
        logger.info(f"Client déconnecté du flux caméra {self.camera_id}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            logger.warning("Message WebSocket non-JSON reçu sur caméra %s", self.camera_id)
            return
        command = data.get('command')

        manager = StreamManager()
        if command == 'start_stream':
            camera_index = getattr(self, "camera", None).camera_index if getattr(self, "camera", None) else 0
            manager.start_camera(self.camera_id, camera_index)
        elif command == 'stop_stream':
            manager.stop_camera(self.camera_id)

    async def camera_frame(self, event):
        """Reçoit la frame du thread de capture et l'envoie au frontend"""
        await self.send(text_data=json.dumps({
            'type': 'camera_frame',
            'frame_b64': event['frame_b64'],
            'detections': event['detections'],
            'timestamp': event['timestamp']
        }))

    async def camera_alert(self, event):
        """Envoie une alerte critique au frontend"""
        await self.send(text_data=json.dumps({
            'type': 'camera_alert',
            'message': event['message'],
            'level': event.get('level', 'HIGH')
        }))
