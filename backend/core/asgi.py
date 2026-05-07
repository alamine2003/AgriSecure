import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', os.getenv('DJANGO_SETTINGS_MODULE', 'core.settings.dev'))
django.setup()

from camera.consumer import CameraConsumer
from core.ws_jwt_middleware import JwtAuthMiddleware

# Routeurs WebSocket
websocket_urlpatterns = [
    path('ws/surveillance/<uuid:camera_id>/', CameraConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JwtAuthMiddleware(URLRouter(websocket_urlpatterns)),
})
