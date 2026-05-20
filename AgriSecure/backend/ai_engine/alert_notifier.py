"""
Module de notification d'alertes.
Responsabilité unique : Envoi de notifications multi-canal
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class AlertNotifier:
    """Gestionnaire de notifications d'alertes (WebSocket, Email, SMS)."""

    def notify_via_websocket(self, camera_id: str, message: str) -> bool:
        """
        Envoie une notification d'alerte via WebSocket.

        Args:
            camera_id: Identifiant de la caméra
            message: Texte de l'alerte

        Returns:
            True si succès, False sinon
        """
        try:
            # Import lazy pour éviter circular dependencies
            from notifications.channels import send_alert_via_websocket

            send_alert_via_websocket(camera_id, message)
            logger.info(f"Alerte WebSocket envoyée pour caméra {camera_id}")
            return True

        except Exception as e:
            logger.error(f"Erreur envoi alerte WebSocket: {e}")
            return False

    def notify_via_email(self, user_email: str, message: str) -> bool:
        """
        Envoie une notification d'alerte par email.

        Args:
            user_email: Email du destinataire
            message: Texte de l'alerte

        Returns:
            True si succès, False sinon
        """
        # TODO: Implémenter quand service email configuré
        logger.info(f"[EMAIL] Alerte à {user_email}: {message}")
        return True

    def notify_via_sms(self, phone_number: str, message: str) -> bool:
        """
        Envoie une notification d'alerte par SMS.

        Args:
            phone_number: Numéro de téléphone du destinataire
            message: Texte de l'alerte

        Returns:
            True si succès, False sinon
        """
        # TODO: Implémenter quand service SMS configuré (Twilio)
        logger.info(f"[SMS] Alerte à {phone_number}: {message}")
        return True
