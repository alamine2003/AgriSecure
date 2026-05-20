"""
Module d'upload vers MinIO.
Responsabilité unique : Stockage des captures d'écran
"""
import os
import io
import base64
import logging
from typing import Optional
from minio import Minio

logger = logging.getLogger(__name__)


class MinIOUploader:
    """Gestionnaire d'upload des frames vers MinIO (stockage S3-compatible)."""

    def __init__(self):
        """Initialise le client MinIO avec configuration depuis env."""
        self.endpoint = os.getenv("MINIO_ENDPOINT")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", os.getenv("MINIO_ROOT_USER"))
        self.secret_key = os.getenv("MINIO_SECRET_KEY", os.getenv("MINIO_ROOT_PASSWORD"))
        self.bucket = os.getenv("MINIO_BUCKET_DETECTIONS", "detections")
        self.client = None

        if self._is_configured():
            self.client = self._initialize_client()

    def _is_configured(self) -> bool:
        """
        Vérifie si MinIO est configuré.

        Returns:
            True si toutes les variables d'environnement sont présentes
        """
        if not all([self.endpoint, self.access_key, self.secret_key]):
            logger.warning("Configuration MinIO incomplète, uploads désactivés")
            return False
        return True

    def _initialize_client(self) -> Optional[Minio]:
        """
        Initialise le client MinIO.

        Returns:
            Client MinIO ou None en cas d'erreur
        """
        try:
            # Nettoyage de l'endpoint
            secure = self.endpoint.startswith("https://")
            endpoint_clean = self.endpoint.replace("https://", "").replace("http://", "")

            client = Minio(
                endpoint_clean,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=secure
            )

            # Création du bucket si nécessaire
            self._ensure_bucket_exists(client)

            logger.info(f"Client MinIO initialisé (bucket: {self.bucket})")
            return client

        except Exception as e:
            logger.error(f"Erreur initialisation MinIO: {e}")
            return None

    def _ensure_bucket_exists(self, client: Minio):
        """
        Crée le bucket s'il n'existe pas.

        Args:
            client: Instance du client MinIO
        """
        try:
            if not client.bucket_exists(self.bucket):
                client.make_bucket(self.bucket)
                logger.info(f"Bucket '{self.bucket}' créé")
        except Exception as e:
            logger.warning(f"Impossible de créer le bucket '{self.bucket}': {e}")

    def upload_detection_frame(
        self,
        camera_id: str,
        detection_id: str,
        frame_b64: str
    ) -> Optional[str]:
        """
        Upload une frame de détection sur MinIO.

        Args:
            camera_id: Identifiant de la caméra
            detection_id: Identifiant UUID de la détection
            frame_b64: Frame encodée en Base64

        Returns:
            Chemin de l'objet uploadé ou None en cas d'erreur
        """
        if not self.client:
            logger.warning("Client MinIO non disponible, upload ignoré")
            return None

        try:
            # Décodage Base64
            raw_bytes = base64.b64decode(frame_b64)

            # Construction du chemin
            object_name = f"detections/{camera_id}/{detection_id}.jpg"

            # Upload
            self.client.put_object(
                self.bucket,
                object_name,
                io.BytesIO(raw_bytes),
                length=len(raw_bytes),
                content_type="image/jpeg",
            )

            logger.info(f"Frame uploadée: {object_name}")
            return object_name

        except Exception as e:
            logger.error(f"Erreur upload MinIO: {e}")
            return None

    def get_object_url(self, object_name: str) -> str:
        """
        Génère l'URL d'accès à un objet.

        Args:
            object_name: Chemin de l'objet dans MinIO

        Returns:
            URL complète de l'objet
        """
        return f"/api/v1/surveillance/detections/{object_name.split('/')[-1].replace('.jpg', '')}/capture/"
