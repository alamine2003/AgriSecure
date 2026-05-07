"""
Module de gestion du cooldown des alertes.
Responsabilité unique : Anti-spam via Redis
"""
import os
import logging
import redis
from typing import Optional
from django.utils import timezone

logger = logging.getLogger(__name__)


class AlertCooldownManager:
    """Gestionnaire de cooldown pour éviter le spam d'alertes."""

    def __init__(self):
        """Initialise le gestionnaire avec connexion Redis."""
        self.cooldown_seconds = int(os.getenv("ALERT_COOLDOWN_SECONDS", "15"))
        self.redis_client = self._connect_redis()

    def _connect_redis(self) -> Optional[redis.Redis]:
        """
        Établit la connexion Redis.

        Returns:
            Client Redis ou None en cas d'échec
        """
        try:
            client = redis.Redis(
                host=os.getenv("REDIS_HOST", "redis"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                password=os.getenv("REDIS_PASSWORD") or None,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            client.ping()
            return client
        except Exception as e:
            logger.warning(f"Impossible de se connecter à Redis pour cooldown: {e}")
            return None

    def should_send_alert(self, camera_id: str, label: str) -> bool:
        """
        Détermine si une alerte peut être envoyée (cooldown expiré).

        Args:
            camera_id: Identifiant de la caméra
            label: Type d'objet détecté (person, cow, etc.)

        Returns:
            True si alerte autorisée, False si cooldown actif
        """
        if not self.redis_client:
            # Pas de Redis = pas de cooldown = toujours autoriser
            return True

        try:
            key = self._build_cooldown_key(camera_id, label)
            # SET NX (Not eXists) = crée la clé uniquement si elle n'existe pas
            created = self.redis_client.set(
                key,
                timezone.now().isoformat(),
                nx=True,
                ex=self.cooldown_seconds
            )
            return bool(created)

        except Exception as e:
            logger.error(f"Erreur vérification cooldown: {e}")
            # En cas d'erreur, autoriser l'alerte (fail-open)
            return True

    def _build_cooldown_key(self, camera_id: str, label: str) -> str:
        """
        Construit la clé Redis pour le cooldown.

        Args:
            camera_id: Identifiant de la caméra
            label: Type d'objet détecté

        Returns:
            Clé Redis formatée
        """
        return f"alert:{camera_id}:{label}"

    def reset_cooldown(self, camera_id: str, label: str) -> bool:
        """
        Réinitialise manuellement le cooldown (tests ou admin).

        Args:
            camera_id: Identifiant de la caméra
            label: Type d'objet détecté

        Returns:
            True si succès, False sinon
        """
        if not self.redis_client:
            return False

        try:
            key = self._build_cooldown_key(camera_id, label)
            self.redis_client.delete(key)
            logger.info(f"Cooldown réinitialisé pour {key}")
            return True
        except Exception as e:
            logger.error(f"Erreur reset cooldown: {e}")
            return False
