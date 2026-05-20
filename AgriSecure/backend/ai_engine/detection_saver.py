"""
Module de sauvegarde des détections.
Responsabilité unique : Persistance en base de données
"""
import logging
from typing import Optional
from surveillance.models import Detection, Camera, Alert

logger = logging.getLogger(__name__)


class DetectionSaver:
    """Gestionnaire de sauvegarde des détections en base de données."""

    def save_detection(
        self,
        camera_id: str,
        label: str,
        confidence: float,
        danger_level: str,
        bbox: list,
        frame_url: Optional[str] = None
    ) -> Optional[Detection]:
        """
        Sauvegarde une détection en base de données.

        Args:
            camera_id: Identifiant UUID de la caméra
            label: Type d'objet détecté
            confidence: Score de confiance (0-1)
            danger_level: Niveau de dangerosité (HIGH/MEDIUM/LOW)
            bbox: Coordonnées [x1, y1, x2, y2]
            frame_url: URL de la capture d'écran (optionnel)

        Returns:
            Instance Detection créée ou None en cas d'erreur
        """
        try:
            # Récupération de la caméra
            camera = self._get_camera(camera_id)
            if not camera:
                return None

            # Création de la détection
            detection = Detection.objects.create(
                camera=camera,
                agent=camera.agent,
                label=label,
                confidence=confidence,
                danger_level=danger_level,
                bbox=bbox,
                frame_capture=frame_url,
                is_alert=(danger_level == 'HIGH')
            )

            logger.info(f"Détection {detection.id} sauvegardée ({label}, {danger_level})")
            return detection

        except Exception as e:
            logger.error(f"Erreur sauvegarde détection: {e}")
            return None

    def _get_camera(self, camera_id: str) -> Optional[Camera]:
        """
        Récupère une caméra depuis la base de données.

        Args:
            camera_id: Identifiant UUID de la caméra

        Returns:
            Instance Camera ou None si non trouvée
        """
        try:
            return Camera.objects.get(id=camera_id)
        except Camera.DoesNotExist:
            logger.error(f"Caméra {camera_id} non trouvée")
            return None

    def create_alert(self, detection: Detection, message: str) -> Optional[Alert]:
        """
        Crée une alerte liée à une détection.

        Args:
            detection: Instance de détection
            message: Message de l'alerte

        Returns:
            Instance Alert créée ou None en cas d'erreur
        """
        try:
            alert = Alert.objects.create(
                detection=detection,
                message=message
            )
            logger.info(f"Alerte {alert.id} créée pour détection {detection.id}")
            return alert

        except Exception as e:
            logger.error(f"Erreur création alerte: {e}")
            return None
