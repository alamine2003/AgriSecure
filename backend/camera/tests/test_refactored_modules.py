"""
Tests unitaires des modules refactorés.
Démonstration : 90% des tests s'exécutent SANS Docker/Redis/PostgreSQL

Principe : Chaque module est testable indépendamment grâce à la séparation des responsabilités.
"""
import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4


# ============================================================================
# Tests FrameReader (OpenCV)
# ============================================================================

class TestFrameReader:
    """Tests du module d'acquisition de frames."""

    @patch('cv2.VideoCapture')
    def test_open_camera_success(self, mock_video_capture):
        """Test d'ouverture réussie de la caméra."""
        from camera.frame_reader import FrameReader

        # Mock : caméra s'ouvre correctement
        mock_cap = Mock()
        mock_cap.isOpened.return_value = True
        mock_video_capture.return_value = mock_cap

        reader = FrameReader(camera_index=0)
        result = reader.open_camera()

        assert result is True
        mock_video_capture.assert_called_once_with(0)

    @patch('cv2.VideoCapture')
    def test_open_camera_failure(self, mock_video_capture):
        """Test d'échec d'ouverture (caméra inexistante)."""
        from camera.frame_reader import FrameReader

        # Mock : caméra ne s'ouvre pas
        mock_cap = Mock()
        mock_cap.isOpened.return_value = False
        mock_video_capture.return_value = mock_cap

        reader = FrameReader(camera_index=99)
        result = reader.open_camera()

        assert result is False

    @patch('cv2.VideoCapture')
    def test_read_frame_success(self, mock_video_capture):
        """Test de lecture réussie d'une frame."""
        from camera.frame_reader import FrameReader

        # Mock : lecture frame réussie
        mock_cap = Mock()
        mock_cap.isOpened.return_value = True
        fake_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        mock_cap.read.return_value = (True, fake_frame)
        mock_video_capture.return_value = mock_cap

        reader = FrameReader(camera_index=0)
        reader.open_camera()
        success, frame = reader.read_frame()

        assert success is True
        assert frame is not None
        assert frame.shape == (480, 640, 3)

    @patch('cv2.VideoCapture')
    def test_read_frame_failure_tracking(self, mock_video_capture):
        """Test du compteur d'échecs consécutifs."""
        from camera.frame_reader import FrameReader

        # Mock : lecture échoue à chaque fois
        mock_cap = Mock()
        mock_cap.isOpened.return_value = True
        mock_cap.read.return_value = (False, None)
        mock_video_capture.return_value = mock_cap

        reader = FrameReader(camera_index=0)
        reader.open_camera()

        # Simuler 5 échecs consécutifs
        for _ in range(5):
            success, frame = reader.read_frame()
            assert success is False
            assert frame is None

        # Vérifier que le seuil est atteint
        assert reader.has_too_many_failures() is True

    @patch('cv2.VideoCapture')
    def test_release_camera(self, mock_video_capture):
        """Test de libération des ressources."""
        from camera.frame_reader import FrameReader

        mock_cap = Mock()
        mock_cap.isOpened.return_value = True
        mock_video_capture.return_value = mock_cap

        reader = FrameReader(camera_index=0)
        reader.open_camera()
        reader.release()

        mock_cap.release.assert_called_once()


# ============================================================================
# Tests FrameEncoder (JPEG + Base64)
# ============================================================================

class TestFrameEncoder:
    """Tests du module d'encodage de frames."""

    @patch('cv2.imencode')
    def test_encode_frame_to_base64_success(self, mock_imencode):
        """Test d'encodage réussi."""
        from camera.frame_encoder import encode_frame_to_base64

        # Mock : encodage JPEG réussi
        fake_buffer = np.array([0xFF, 0xD8, 0xFF])  # Magic bytes JPEG
        mock_imencode.return_value = (True, fake_buffer)

        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = encode_frame_to_base64(frame)

        assert result is not None
        assert isinstance(result, str)
        mock_imencode.assert_called_once()

    @patch('cv2.imencode')
    def test_encode_frame_to_base64_failure(self, mock_imencode):
        """Test d'échec d'encodage."""
        from camera.frame_encoder import encode_frame_to_base64

        # Mock : encodage échoue
        mock_imencode.return_value = (False, None)

        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = encode_frame_to_base64(frame)

        assert result is None

    def test_prepare_frame_for_transmission(self):
        """Test de préparation Data URI."""
        from camera.frame_encoder import prepare_frame_for_transmission

        result = prepare_frame_for_transmission("abc123xyz")

        assert result == "data:image/jpeg;base64,abc123xyz"
        assert result.startswith("data:image/jpeg;base64,")


# ============================================================================
# Tests DetectionFilter (Logique Métier)
# ============================================================================

class TestDetectionFilter:
    """Tests du module de filtrage des détections."""

    def test_filter_critical_detections(self):
        """Test du filtrage HIGH/MEDIUM uniquement."""
        from camera.detection_filter import filter_critical_detections

        detections = [
            {'label': 'person', 'danger_level': 'HIGH', 'confidence': 0.9},
            {'label': 'bird', 'danger_level': 'LOW', 'confidence': 0.8},
            {'label': 'cow', 'danger_level': 'MEDIUM', 'confidence': 0.85},
            {'label': 'cat', 'danger_level': 'LOW', 'confidence': 0.75},
        ]

        result = filter_critical_detections(detections)

        assert len(result) == 2
        assert all(d['danger_level'] in ['HIGH', 'MEDIUM'] for d in result)
        assert result[0]['label'] == 'person'
        assert result[1]['label'] == 'cow'

    def test_filter_critical_detections_empty(self):
        """Test avec aucune détection critique."""
        from camera.detection_filter import filter_critical_detections

        detections = [
            {'label': 'bird', 'danger_level': 'LOW'},
            {'label': 'cat', 'danger_level': 'LOW'},
        ]

        result = filter_critical_detections(detections)

        assert len(result) == 0

    def test_should_capture_frame_high(self):
        """Test : capture nécessaire pour HIGH."""
        from camera.detection_filter import should_capture_frame

        detection = {'danger_level': 'HIGH'}
        assert should_capture_frame(detection) is True

    def test_should_capture_frame_medium(self):
        """Test : pas de capture pour MEDIUM."""
        from camera.detection_filter import should_capture_frame

        detection = {'danger_level': 'MEDIUM'}
        assert should_capture_frame(detection) is False

    def test_should_capture_frame_low(self):
        """Test : pas de capture pour LOW."""
        from camera.detection_filter import should_capture_frame

        detection = {'danger_level': 'LOW'}
        assert should_capture_frame(detection) is False


# ============================================================================
# Tests WebSocketBroadcaster (Django Channels)
# ============================================================================

class TestWebSocketBroadcaster:
    """Tests du module de diffusion WebSocket."""

    @patch('channels.layers.get_channel_layer')
    @patch('asgiref.sync.async_to_sync')
    def test_broadcast_frame_success(self, mock_async_to_sync, mock_get_channel_layer):
        """Test de diffusion réussie d'une frame."""
        from camera.websocket_broadcaster import WebSocketBroadcaster

        # Mock channel layer
        mock_channel_layer = Mock()
        mock_get_channel_layer.return_value = mock_channel_layer
        mock_async_to_sync.return_value = Mock()

        camera_id = str(uuid4())
        broadcaster = WebSocketBroadcaster(camera_id)

        detections = [{'label': 'person', 'danger_level': 'HIGH'}]
        result = broadcaster.broadcast_frame("data:image/jpeg;base64,abc", detections)

        assert result is True

    @patch('camera.websocket_broadcaster.get_channel_layer')
    def test_broadcast_frame_no_channel_layer(self, mock_get_channel_layer):
        """Test d'échec si channel layer absent."""
        from camera.websocket_broadcaster import WebSocketBroadcaster

        # Mock : pas de channel layer
        mock_get_channel_layer.return_value = None

        camera_id = str(uuid4())
        broadcaster = WebSocketBroadcaster(camera_id)

        result = broadcaster.broadcast_frame("frame_data", [])

        assert result is False

    @patch('channels.layers.get_channel_layer')
    @patch('asgiref.sync.async_to_sync')
    def test_broadcast_alert(self, mock_async_to_sync, mock_get_channel_layer):
        """Test d'envoi d'alerte."""
        from camera.websocket_broadcaster import WebSocketBroadcaster

        mock_channel_layer = Mock()
        mock_get_channel_layer.return_value = mock_channel_layer
        mock_async_to_sync.return_value = Mock()

        camera_id = str(uuid4())
        broadcaster = WebSocketBroadcaster(camera_id)

        result = broadcaster.broadcast_alert("ALERTE CRITIQUE", "HIGH")

        assert result is True


# ============================================================================
# Tests DetectionProcessor (Celery)
# ============================================================================

class TestDetectionProcessor:
    """Tests du module d'envoi vers Celery."""

    @patch('ai_engine.tasks.save_detection_task.delay')
    def test_enqueue_detection_success(self, mock_task_delay):
        """Test d'envoi réussi vers Celery."""
        from camera.detection_processor import DetectionProcessor

        camera_id = str(uuid4())
        processor = DetectionProcessor(camera_id)

        detection = {
            'label': 'person',
            'confidence': 0.92,
            'danger_level': 'HIGH',
            'bbox': [10, 20, 100, 200]
        }

        result = processor.enqueue_detection(detection, "base64frame")

        assert result is True
        mock_task_delay.assert_called_once_with(
            camera_id,
            'person',
            0.92,
            'HIGH',
            [10, 20, 100, 200],
            "base64frame"
        )

    @patch('ai_engine.tasks.save_detection_task.delay', side_effect=Exception("Celery down"))
    def test_enqueue_detection_failure(self, mock_task_delay):
        """Test d'échec d'envoi vers Celery."""
        from camera.detection_processor import DetectionProcessor

        camera_id = str(uuid4())
        processor = DetectionProcessor(camera_id)

        detection = {
            'label': 'cow',
            'confidence': 0.85,
            'danger_level': 'MEDIUM',
            'bbox': [50, 60, 150, 200]
        }

        result = processor.enqueue_detection(detection, None)

        assert result is False


# ============================================================================
# Tests AlertCooldownManager (Redis)
# ============================================================================

class TestAlertCooldownManager:
    """Tests du module de cooldown anti-spam."""

    @patch('redis.Redis')
    def test_should_send_alert_first_time(self, mock_redis):
        """Test : première alerte autorisée (clé n'existe pas)."""
        from ai_engine.alert_cooldown import AlertCooldownManager

        # Mock : SET NX retourne True (clé créée)
        mock_redis_instance = Mock()
        mock_redis_instance.set.return_value = True
        mock_redis_instance.ping.return_value = True
        mock_redis.return_value = mock_redis_instance

        manager = AlertCooldownManager()
        result = manager.should_send_alert('cam1', 'person')

        assert result is True

    @patch('redis.Redis')
    def test_should_send_alert_cooldown_active(self, mock_redis):
        """Test : alerte bloquée (cooldown actif, clé existe)."""
        from ai_engine.alert_cooldown import AlertCooldownManager

        # Mock : SET NX retourne False (clé existe déjà)
        mock_redis_instance = Mock()
        mock_redis_instance.set.return_value = False
        mock_redis_instance.ping.return_value = True
        mock_redis.return_value = mock_redis_instance

        manager = AlertCooldownManager()
        result = manager.should_send_alert('cam1', 'person')

        assert result is False

    @patch('redis.Redis')
    def test_reset_cooldown(self, mock_redis):
        """Test de réinitialisation manuelle du cooldown."""
        from ai_engine.alert_cooldown import AlertCooldownManager

        mock_redis_instance = Mock()
        mock_redis_instance.ping.return_value = True
        mock_redis_instance.delete.return_value = 1
        mock_redis.return_value = mock_redis_instance

        manager = AlertCooldownManager()
        result = manager.reset_cooldown('cam1', 'cow')

        assert result is True
        mock_redis_instance.delete.assert_called_once()


# ============================================================================
# Tests MinIOUploader (Stockage S3)
# ============================================================================

class TestMinIOUploader:
    """Tests du module d'upload MinIO."""

    @patch('minio.Minio')
    @patch.dict('os.environ', {
        'MINIO_ENDPOINT': 'localhost:9000',
        'MINIO_ACCESS_KEY': 'minioadmin',
        'MINIO_SECRET_KEY': 'minioadmin'
    })
    def test_upload_detection_frame_success(self, mock_minio):
        """Test d'upload réussi."""
        from ai_engine.minio_uploader import MinIOUploader

        # Mock client MinIO
        mock_client = Mock()
        mock_client.bucket_exists.return_value = True
        mock_client.put_object.return_value = None
        mock_minio.return_value = mock_client

        uploader = MinIOUploader()
        result = uploader.upload_detection_frame('cam1', 'det123', 'YWJjMTIz')  # base64("abc123")

        assert result is not None
        assert 'cam1' in result
        assert 'det123' in result
        mock_client.put_object.assert_called_once()

    @patch.dict('os.environ', {}, clear=True)
    def test_upload_detection_frame_no_config(self):
        """Test sans configuration MinIO."""
        from ai_engine.minio_uploader import MinIOUploader

        uploader = MinIOUploader()
        result = uploader.upload_detection_frame('cam1', 'det123', 'base64data')

        assert result is None  # Upload ignoré


# ============================================================================
# Tests DetectionSaver (PostgreSQL)
# ============================================================================

@pytest.mark.django_db
class TestDetectionSaver:
    """Tests du module de sauvegarde en base."""

    def test_save_detection_success(self):
        """Test de sauvegarde réussie."""
        from ai_engine.detection_saver import DetectionSaver
        from surveillance.models import Camera
        from users.models import CustomUser

        # Création fixtures
        user = CustomUser.objects.create(
            email='agent@test.com',
            nin='1234567890',
            first_name='Test',
            last_name='Agent',
            role='agent_agricole'
        )
        camera = Camera.objects.create(
            name='Caméra Test',
            camera_index=0,
            agent=user
        )

        saver = DetectionSaver()
        detection = saver.save_detection(
            str(camera.id),
            'person',
            0.92,
            'HIGH',
            [10, 20, 100, 200],
            '/api/capture/123.jpg'
        )

        assert detection is not None
        assert detection.label == 'person'
        assert detection.confidence == 0.92
        assert detection.danger_level == 'HIGH'
        assert detection.is_alert is True

    def test_save_detection_camera_not_found(self):
        """Test avec caméra inexistante."""
        from ai_engine.detection_saver import DetectionSaver

        saver = DetectionSaver()
        detection = saver.save_detection(
            'invalid-uuid',
            'person',
            0.9,
            'HIGH',
            []
        )

        assert detection is None

    @pytest.mark.django_db
    def test_create_alert(self):
        """Test de création d'alerte."""
        from ai_engine.detection_saver import DetectionSaver
        from surveillance.models import Camera, Detection
        from users.models import CustomUser

        # Création fixtures
        user = CustomUser.objects.create(
            email='agent2@test.com',
            nin='9876543210',
            first_name='Test2',
            last_name='Agent2',
            role='agent_agricole'
        )
        camera = Camera.objects.create(
            name='Caméra Test 2',
            camera_index=1,
            agent=user
        )
        detection = Detection.objects.create(
            camera=camera,
            agent=user,
            label='person',
            confidence=0.95,
            danger_level='HIGH',
            bbox=[],
            is_alert=True
        )

        saver = DetectionSaver()
        alert = saver.create_alert(detection, "ALERTE CRITIQUE")

        assert alert is not None
        assert alert.message == "ALERTE CRITIQUE"
        assert alert.detection == detection
        assert alert.is_read is False


# ============================================================================
# Exécution des Tests
# ============================================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
