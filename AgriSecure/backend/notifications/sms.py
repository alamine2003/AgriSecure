import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms(phone_number, message):
    """Envoyer un SMS. Utilise Africa's Talking si configuré, sinon simulation."""
    phone = _normalize_phone(phone_number)
    if not phone:
        logger.warning("Numéro de téléphone invalide: %s", phone_number)
        return False

    if getattr(settings, 'AFRICASTALKING_USERNAME', None):
        return _send_via_africastalking(phone, message)

    # Mode simulation (développement)
    logger.info("SMS [SIMULATION] vers %s: %s", phone, message)
    return True


def _normalize_phone(phone):
    """Normaliser au format international Sénégal (+221XXXXXXXXX)."""
    if not phone:
        return None

    phone = phone.replace(' ', '').replace('-', '').replace('.', '')

    if phone.startswith('00221'):
        phone = '+221' + phone[5:]
    elif phone.startswith('0') and len(phone) == 10:
        phone = '+221' + phone[1:]
    elif len(phone) == 9 and phone[0] in ('7', '3'):
        phone = '+221' + phone
    elif not phone.startswith('+'):
        phone = '+221' + phone

    return phone if len(phone) >= 12 else None


def _send_via_africastalking(phone, message):
    try:
        import africastalking

        africastalking.initialize(
            settings.AFRICASTALKING_USERNAME,
            settings.AFRICASTALKING_API_KEY,
        )
        sms = africastalking.SMS
        sender = getattr(settings, 'AFRICASTALKING_SENDER_ID', None)
        response = sms.send(message, [phone], sender)

        recipients = response.get('SMSMessageData', {}).get('Recipients', [])
        if recipients and recipients[0].get('status') == 'Success':
            logger.info("SMS envoyé à %s", phone)
            return True

        logger.warning("SMS échoué pour %s: %s", phone, response)
        return False

    except ImportError:
        logger.warning("Package 'africastalking' non installé — SMS non envoyé.")
        return False
    except Exception as exc:
        logger.error("Erreur Africa's Talking: %s", exc)
        return False
