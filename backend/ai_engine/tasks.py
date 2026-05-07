import base64
import io
import logging
import os
from celery import shared_task
from django.utils import timezone
from minio import Minio
import redis
from surveillance.models import Detection, Camera, Alert
from notifications.channels import send_alert_via_websocket

logger = logging.getLogger(__name__)

@shared_task
def save_detection_task(camera_id, label, confidence, danger_level, bbox, frame_b64=None):
    """
    Sauvegarde une détection en base et crée une alerte si nécessaire.
    """
    try:
        camera = Camera.objects.get(id=camera_id)
        
        # Création de la détection
        detection = Detection.objects.create(
            camera=camera,
            agent=camera.agent,
            label=label,
            confidence=confidence,
            danger_level=danger_level,
            bbox=bbox,
            is_alert=(danger_level == 'HIGH')
        )

        if frame_b64:
            uploaded = _upload_frame_to_minio(camera_id, detection.id, frame_b64)
            if uploaded:
                detection.frame_capture = f"/api/v1/surveillance/detections/{detection.id}/capture/"
                detection.save(update_fields=["frame_capture"])
        
        # Si danger ÉLEVÉ, créer une alerte et notifier via WebSocket
        if danger_level == 'HIGH':
            if _should_send_alert(camera_id, label):
                message = f"ALERTE CRITIQUE : {label} détecté sur {camera.name}!"
                Alert.objects.create(
                    detection=detection,
                    message=message
                )
                send_alert_via_websocket(camera_id, message)
            
            # TODO: Envoi email ici si configuré
            
    except Camera.DoesNotExist:
        logger.error(f"Caméra {camera_id} non trouvée lors de la sauvegarde")
    except Exception as e:
        logger.error(f"Erreur sauvegarde détection: {e}")


def _should_send_alert(camera_id, label):
    cooldown = int(os.getenv("ALERT_COOLDOWN_SECONDS", "15"))
    try:
        r = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            password=os.getenv("REDIS_PASSWORD") or None,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        key = f"alert:{camera_id}:{label}"
        created = r.set(key, timezone.now().isoformat(), nx=True, ex=cooldown)
        return bool(created)
    except Exception:
        return True


def _upload_frame_to_minio(camera_id, detection_id, frame_b64):
    # Configuration unifiée MinIO
    endpoint = os.getenv("MINIO_ENDPOINT")
    access_key = os.getenv("MINIO_ACCESS_KEY", os.getenv("MINIO_ROOT_USER"))
    secret_key = os.getenv("MINIO_SECRET_KEY", os.getenv("MINIO_ROOT_PASSWORD"))
    bucket = os.getenv("MINIO_BUCKET_DETECTIONS", "detections")
    
    if not endpoint or not access_key or not secret_key:
        logger.warning("Configuration MinIO manquante, upload ignoré")
        return None

    # Nettoyage de l'URL endpoint
    secure = endpoint.startswith("https://")
    endpoint_clean = endpoint.replace("https://", "").replace("http://", "")

    client = Minio(endpoint_clean, access_key=access_key, secret_key=secret_key, secure=secure)

    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
    except Exception:
        pass

    try:
        raw = base64.b64decode(frame_b64)
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
        logger.error(f"MinIO upload failed: {e}")
        return None
