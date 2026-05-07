import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import datetime

logger = logging.getLogger(__name__)

def send_alert_via_websocket(camera_id, alert_message, level='HIGH'):
    """
    Envoie une notification d'alerte via WebSocket avec gestion d'erreurs robuste.
    
    Args:
        camera_id (str): UUID de la caméra
        alert_message (str): Message d'alerte
        level (str): Niveau d'alerte (HIGH, MEDIUM, LOW)
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            f'camera_{camera_id}',
            {
                'type': 'camera_alert',
                'message': alert_message,
                'level': level,
                'timestamp': datetime.now().isoformat()
            }
        )
        
        logger.info(f"Alerte WebSocket envoyée pour caméra {camera_id} [{level}]: {alert_message}")
        
    except Exception as e:
        logger.error(f"Erreur envoi alerte WebSocket pour caméra {camera_id}: {e}")
        # Ne pas lever l'exception pour ne pas bloquer le processus principal

def send_system_notification(user_id, message, notification_type='info'):
    """
    Envoie une notification système à un utilisateur spécifique.
    
    Args:
        user_id (str): UUID de l'utilisateur
        message (str): Message de notification
        notification_type (str): Type de notification (info, warning, error)
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            f'user_{user_id}',
            {
                'type': 'system_notification',
                'message': message,
                'notification_type': notification_type,
                'timestamp': datetime.now().isoformat()
            }
        )
        
        logger.info(f"Notification système envoyée à l'utilisateur {user_id}: {message}")
        
    except Exception as e:
        logger.error(f"Erreur envoi notification système à l'utilisateur {user_id}: {e}")

def broadcast_system_message(message, message_type='system'):
    """
    Diffuse un message système à tous les clients connectés.
    
    Args:
        message (str): Message à diffuser
        message_type (str): Type de message (system, maintenance, alert)
    """
    try:
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_send)(
            'broadcast',
            {
                'type': 'broadcast_message',
                'message': message,
                'message_type': message_type,
                'timestamp': datetime.now().isoformat()
            }
        )
        
        logger.info(f"Message broadcast envoyé [{message_type}]: {message}")
        
    except Exception as e:
        logger.error(f"Erreur envoi broadcast message: {e}")
