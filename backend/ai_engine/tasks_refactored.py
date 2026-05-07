"""
Module des tâches Celery.
Responsabilité unique : Orchestration du traitement asynchrone des détections

Architecture Clean Code:
    - Chaque fonction a une responsabilité unique
    - Délégation aux modules spécialisés (SRP)
    - Pas de logique métier dans les tasks (orchestration uniquement)
"""
import logging
from celery import shared_task
from typing import Optional

from .detection_saver import DetectionSaver
from .minio_uploader import MinIOUploader
from .alert_cooldown import AlertCooldownManager
from .alert_notifier import AlertNotifier

logger = logging.getLogger(__name__)


@shared_task
def save_detection_task(
    camera_id: str,
    label: str,
    confidence: float,
    danger_level: str,
    bbox: list,
    frame_b64: Optional[str] = None
):
    """
    Tâche asynchrone de sauvegarde d'une détection.

    Architecture:
        1. Upload frame sur MinIO (si fournie)
        2. Sauvegarde détection en PostgreSQL
        3. Vérification cooldown (si HIGH)
        4. Création alerte + notification (si applicable)

    Args:
        camera_id: Identifiant UUID de la caméra
        label: Type d'objet détecté (person, cow, etc.)
        confidence: Score de confiance YOLO (0-1)
        danger_level: Niveau de dangerosité (HIGH/MEDIUM/LOW)
        bbox: Bounding box [x1, y1, x2, y2]
        frame_b64: Frame encodée Base64 (optionnel, uniquement pour HIGH)
    """
    logger.info(f"Traitement détection: {label} ({danger_level}) - caméra {camera_id}")

    # Étape 1: Upload frame si fournie
    frame_url = _upload_frame_if_provided(camera_id, frame_b64)

    # Étape 2: Sauvegarde détection en base
    detection = _save_detection_to_database(
        camera_id, label, confidence, danger_level, bbox, frame_url
    )

    if not detection:
        logger.error("Échec sauvegarde détection, arrêt du traitement")
        return

    # Étape 3: Traitement des alertes critiques (HIGH uniquement)
    if danger_level == 'HIGH':
        _process_critical_alert(camera_id, label, detection)


def _upload_frame_if_provided(camera_id: str, frame_b64: Optional[str]) -> Optional[str]:
    """
    Upload la frame sur MinIO si fournie.

    Args:
        camera_id: Identifiant de la caméra
        frame_b64: Frame encodée Base64

    Returns:
        URL de la frame ou None
    """
    if not frame_b64:
        return None

    uploader = MinIOUploader()
    # Génération ID temporaire pour le nom de fichier
    # L'ID réel de la détection sera utilisé après sauvegarde DB
    from uuid import uuid4
    temp_detection_id = str(uuid4())

    object_path = uploader.upload_detection_frame(camera_id, temp_detection_id, frame_b64)

    if object_path:
        return uploader.get_object_url(object_path)

    return None


def _save_detection_to_database(
    camera_id: str,
    label: str,
    confidence: float,
    danger_level: str,
    bbox: list,
    frame_url: Optional[str]
):
    """
    Sauvegarde la détection en base de données.

    Args:
        camera_id: Identifiant de la caméra
        label: Type d'objet détecté
        confidence: Score de confiance
        danger_level: Niveau de dangerosité
        bbox: Bounding box
        frame_url: URL de la capture

    Returns:
        Instance Detection ou None
    """
    saver = DetectionSaver()
    return saver.save_detection(
        camera_id, label, confidence, danger_level, bbox, frame_url
    )


def _process_critical_alert(camera_id: str, label: str, detection):
    """
    Traite une alerte critique (niveau HIGH).

    Architecture:
        1. Vérification cooldown anti-spam
        2. Création alerte en base
        3. Notification multi-canal

    Args:
        camera_id: Identifiant de la caméra
        label: Type d'objet détecté
        detection: Instance Detection sauvegardée
    """
    # Étape 1: Vérification cooldown
    cooldown_manager = AlertCooldownManager()

    if not cooldown_manager.should_send_alert(camera_id, label):
        logger.info(f"Alerte {label} ignorée (cooldown actif)")
        return

    # Étape 2: Création alerte en base
    message = _build_alert_message(label, detection.camera.name)
    saver = DetectionSaver()
    alert = saver.create_alert(detection, message)

    if not alert:
        logger.error("Échec création alerte")
        return

    # Étape 3: Notification
    _send_alert_notifications(camera_id, message, detection.agent)


def _build_alert_message(label: str, camera_name: str) -> str:
    """
    Construit le message d'alerte.

    Args:
        label: Type d'objet détecté
        camera_name: Nom de la caméra

    Returns:
        Message formaté
    """
    label_fr = {
        'person': 'Intrusion humaine',
        'cow': 'Bœuf',
        'goat': 'Chèvre',
        'horse': 'Cheval',
        'sheep': 'Mouton'
    }.get(label, label.capitalize())

    return f"ALERTE CRITIQUE : {label_fr} détecté sur {camera_name} !"


def _send_alert_notifications(camera_id: str, message: str, agent):
    """
    Envoie les notifications d'alerte via tous les canaux disponibles.

    Args:
        camera_id: Identifiant de la caméra
        message: Message de l'alerte
        agent: Instance User (agent propriétaire)
    """
    notifier = AlertNotifier()

    # Canal 1: WebSocket (temps réel)
    notifier.notify_via_websocket(camera_id, message)

    # Canal 2: Email (si configuré)
    if agent.email:
        notifier.notify_via_email(agent.email, message)

    # Canal 3: SMS (si configuré et numéro disponible)
    if agent.phone:
        notifier.notify_via_sms(agent.phone, message)


# Tâches additionnelles pour maintenance

@shared_task
def cleanup_old_detections():
    """
    Tâche de nettoyage des anciennes détections (>30 jours).

    Planification: Celery Beat (quotidien, 03:00 AM)
    """
    from datetime import timedelta
    from django.utils import timezone
    from surveillance.models import Detection

    threshold = timezone.now() - timedelta(days=30)

    deleted_count, _ = Detection.objects.filter(
        detected_at__lt=threshold,
        danger_level='LOW'  # Garder HIGH/MEDIUM plus longtemps
    ).delete()

    logger.info(f"Nettoyage: {deleted_count} détections LOW supprimées")


@shared_task
def generate_daily_report(agent_id: str):
    """
    Génère un rapport quotidien pour un agent.

    Args:
        agent_id: Identifiant UUID de l'agent

    Planification: Celery Beat (quotidien, 08:00 AM)
    """
    # TODO: Implémenter génération rapport PDF
    logger.info(f"Génération rapport quotidien pour agent {agent_id}")
