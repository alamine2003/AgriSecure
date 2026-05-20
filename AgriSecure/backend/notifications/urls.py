from django.urls import path, include
from core.router import SafeFormatSuffixRouter
from .views import (
    NotificationViewSet, NotificationTemplateViewSet, 
    NotificationChannelViewSet, AdminNotificationViewSet
)

router = SafeFormatSuffixRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'templates', NotificationTemplateViewSet, basename='notification-templates')
router.register(r'channels', NotificationChannelViewSet, basename='notification-channels')
router.register(r'admin', AdminNotificationViewSet, basename='admin-notifications')

urlpatterns = [
    path('', include(router.urls)),
]
