import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket pour les notifications temps réel."""

    async def connect(self):
        user = self.scope.get('user')
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.group_name = f"notifications_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Envoyer le nombre de notifications non lues à la connexion
        unread = await self._count_unread(user)
        await self.send(text_data=json.dumps({'type': 'unread_count', 'count': unread}))
        logger.debug("NotificationConsumer connected for user %s", user.id)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('command') == 'get_unread':
            user = self.scope['user']
            count = await self._count_unread(user)
            await self.send(text_data=json.dumps({'type': 'unread_count', 'count': count}))

    async def notification_message(self, event):
        """Recevoir du channel layer et transmettre au client."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification'],
        }))

    @database_sync_to_async
    def _count_unread(self, user):
        from .models import Notification
        return Notification.objects.filter(user=user, is_read=False).count()
