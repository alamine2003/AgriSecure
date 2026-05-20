from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_critical_alert_email(to_email, camera_name, detection_label):
    """
    Envoie un email d'alerte critique.
    """
    subject = f"ALERTE CRITIQUE : Intrusion détectée sur {camera_name}"
    message = f"Une intrusion de type '{detection_label}' a été détectée sur la caméra '{camera_name}'. Veuillez vérifier le flux en direct."
    
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [to_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Échec de l'envoi de l'email d'alerte: {e}")
