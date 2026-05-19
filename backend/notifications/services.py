import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


def create_notification(user, title, message, notification_type='INFO', priority='MEDIUM',
                        content_type=None, object_id=None, metadata=None):
    """Créer une notification in-app et pousser via WebSocket"""
    from .models import Notification, NotificationChannel

    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        content_type=content_type,
        object_id=object_id,
        metadata=metadata or {},
    )

    _push_websocket(notification)

    channels = NotificationChannel.objects.filter(user=user, is_enabled=True)
    for channel in channels:
        if channel.channel_type == 'EMAIL':
            _send_email(notification, channel)
        elif channel.channel_type == 'SMS':
            _send_sms(notification, channel)

    return notification


def notify_agent_alert(agent, alert):
    """Notifier un agent d'une nouvelle alerte de détection"""
    label = alert.detection.label if alert.detection else 'Intrusion'
    camera_name = alert.detection.camera.name if alert.detection else 'inconnue'
    camera_id = str(alert.detection.camera.id) if alert.detection else None
    return create_notification(
        user=agent,
        title=f"Alerte critique : {label}",
        message=f"Intrusion détectée sur la caméra « {camera_name} » — {alert.message}",
        notification_type='ALERT',
        priority='URGENT',
        content_type='alert',
        object_id=str(alert.id),
        metadata={'camera_id': camera_id, 'label': label},
    )


def notify_registration_approved(agent):
    return create_notification(
        user=agent,
        title="Inscription approuvée",
        message="Votre demande d'inscription a été approuvée. Vous pouvez maintenant vous connecter.",
        notification_type='SUCCESS',
        priority='HIGH',
    )


def notify_registration_rejected(agent, reason=None):
    msg = "Votre demande d'inscription a été rejetée."
    if reason:
        msg += f" Motif : {reason}"
    return create_notification(
        user=agent,
        title="Inscription refusée",
        message=msg,
        notification_type='ERROR',
        priority='HIGH',
    )


def notify_appointment_scheduled(agent, appointment):
    date_str = appointment.scheduled_at.strftime('%d/%m/%Y à %H:%M') if appointment.scheduled_at else "date à confirmer"
    return create_notification(
        user=agent,
        title="Rendez-vous d'installation planifié",
        message=f"Un technicien interviendra le {date_str} à {appointment.locality}.",
        notification_type='INFO',
        priority='MEDIUM',
        content_type='appointment',
        object_id=str(appointment.id),
    )


def broadcast_notification(users, title, message, notification_type='INFO', priority='MEDIUM'):
    """Envoyer une notification à plusieurs utilisateurs"""
    notifications = []
    for user in users:
        n = create_notification(user, title, message, notification_type, priority)
        notifications.append(n)
    return notifications


# ── Canaux internes ─────────────────────────────────────────────────────────

def _push_websocket(notification):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        group_name = f"notifications_{notification.user.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_message',
                'notification': {
                    'id': str(notification.id),
                    'title': notification.title,
                    'message': notification.message,
                    'notification_type': notification.notification_type,
                    'priority': notification.priority,
                    'created_at': notification.created_at.isoformat(),
                },
            },
        )
    except Exception as exc:
        logger.debug("WebSocket push non disponible: %s", exc)


def _send_email(notification, channel):
    try:
        from django.core.mail import send_mail
        from django.conf import settings

        email = channel.configuration.get('email') or notification.user.email
        if not email:
            return

        send_mail(
            subject=f"[AgriWatch] {notification.title}",
            message=notification.message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@agriwatch.sn'),
            recipient_list=[email],
            fail_silently=False,
        )
        notification.mark_as_sent()
    except Exception as exc:
        logger.error("Envoi email échoué: %s", exc)


def _send_sms(notification, channel):
    try:
        from .sms import send_sms

        phone = channel.configuration.get('phone') or getattr(notification.user, 'phone', None)
        if not phone:
            return

        text = f"AgriWatch: {notification.title} — {notification.message[:100]}"
        if send_sms(phone, text):
            notification.mark_as_sent()
    except Exception as exc:
        logger.error("Envoi SMS échoué: %s", exc)
