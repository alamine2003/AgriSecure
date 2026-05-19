import base64
import io
import logging
import os
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.utils import timezone
from minio import Minio
import redis
from surveillance.models import Detection, Camera, Alert
from notifications.channels import send_alert_via_websocket

logger = logging.getLogger(__name__)

try:
    from core.custom_metrics import detections_total, alerts_sent_total
except Exception:
    detections_total = None
    alerts_sent_total = None

# Pool de connexions Redis — réutilisé entre les appels Celery
_redis_pool = None


def _get_redis_client():
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool(
            host=os.getenv("REDIS_HOST", "redis"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            password=os.getenv("REDIS_PASSWORD") or None,
            socket_connect_timeout=1,
            socket_timeout=1,
            max_connections=10,
        )
    return redis.Redis(connection_pool=_redis_pool)


@shared_task(time_limit=120, soft_time_limit=100)
def save_detection_task(camera_id, label, confidence, danger_level, bbox, frame_b64=None):
    """
    Sauvegarde une détection en base et crée une alerte si nécessaire.
    """
    try:
        camera = Camera.objects.get(id=camera_id)

        detection = Detection.objects.create(
            camera=camera,
            agent=camera.agent,
            label=label,
            confidence=confidence,
            danger_level=danger_level,
            bbox=bbox,
            is_alert=(danger_level == 'HIGH')
        )

        if detections_total:
            detections_total.labels(danger_level=danger_level, species=label).inc()

        if frame_b64:
            uploaded = _upload_frame_to_minio(camera_id, detection.id, frame_b64)
            if uploaded:
                detection.frame_capture = f"/api/v1/surveillance/detections/{detection.id}/capture/"
                detection.save(update_fields=["frame_capture"])

        if danger_level == 'HIGH':
            if _should_send_alert(camera_id, label):
                message = f"ALERTE CRITIQUE : {label} détecté sur {camera.name}!"
                alert = Alert.objects.create(detection=detection, message=message)
                # Pré-peupler les relations en mémoire — évite les requêtes N+1 dans notify_agent_alert
                alert.detection = detection
                alert.detection.camera = camera
                send_alert_via_websocket(camera_id, message)
                if alerts_sent_total:
                    alerts_sent_total.labels(channel='websocket').inc()
                try:
                    from notifications.services import notify_agent_alert
                    notify_agent_alert(camera.agent, alert)
                    if alerts_sent_total:
                        alerts_sent_total.labels(channel='in_app').inc()
                except Exception as exc:
                    logger.error("Notification agent échouée: %s", exc)

    except SoftTimeLimitExceeded:
        logger.error("Tâche save_detection_task interrompue (soft time limit) pour caméra %s", camera_id)
    except Camera.DoesNotExist:
        logger.error("Caméra %s non trouvée lors de la sauvegarde", camera_id)
    except Exception as e:
        logger.error("Erreur sauvegarde détection caméra %s: %s", camera_id, e)


def _should_send_alert(camera_id, label):
    cooldown = int(os.getenv("ALERT_COOLDOWN_SECONDS", "15"))
    try:
        r = _get_redis_client()
        key = f"alert:{camera_id}:{label}"
        created = r.set(key, timezone.now().isoformat(), nx=True, ex=cooldown)
        return bool(created)
    except Exception as exc:
        logger.warning("Redis indisponible pour cooldown, alerte autorisée: %s", exc)
        return True


def _upload_frame_to_minio(camera_id, detection_id, frame_b64):
    endpoint = os.getenv("MINIO_ENDPOINT")
    access_key = os.getenv("MINIO_ACCESS_KEY", os.getenv("MINIO_ROOT_USER"))
    secret_key = os.getenv("MINIO_SECRET_KEY", os.getenv("MINIO_ROOT_PASSWORD"))
    bucket = os.getenv("MINIO_BUCKET_DETECTIONS", "detections")

    if not endpoint or not access_key or not secret_key:
        logger.warning("Configuration MinIO manquante, upload ignoré")
        return None

    secure = endpoint.startswith("https://")
    endpoint_clean = endpoint.replace("https://", "").replace("http://", "")

    client = Minio(endpoint_clean, access_key=access_key, secret_key=secret_key, secure=secure)

    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
    except Exception as exc:
        logger.warning("Vérification/création bucket MinIO échouée: %s", exc)

    try:
        # Retirer le préfixe data URI si présent
        b64_data = frame_b64
        if ',' in b64_data:
            b64_data = b64_data.split(',', 1)[1]
        raw = base64.b64decode(b64_data)
        object_name = f"detections/{camera_id}/{detection_id}.jpg"
        client.put_object(
            bucket,
            object_name,
            io.BytesIO(raw),
            length=len(raw),
            content_type="image/jpeg",
        )
        return True
    except Exception as e:
        logger.error("MinIO upload failed: %s", e)
        return None
