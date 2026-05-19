import pytest
from unittest.mock import patch, MagicMock
from users.models import CustomUser
from surveillance.models import Camera, Detection, Alert


def make_camera():
    user = CustomUser.objects.create_user(
        email='cam@test.com', nin='CAM001', first_name='A', last_name='B', password='pass'
    )
    return Camera.objects.create(name='TestCam', camera_index=0, agent=user)


@pytest.mark.django_db
class TestSaveDetectionTask:

    @patch('ai_engine.tasks._upload_frame_to_minio', return_value=None)
    @patch('ai_engine.tasks.send_alert_via_websocket')
    def test_saves_detection_to_db(self, mock_ws, mock_upload):
        from ai_engine.tasks import save_detection_task
        cam = make_camera()
        save_detection_task(str(cam.id), 'person', 0.92, 'HIGH', [10, 20, 100, 200])
        assert Detection.objects.filter(camera=cam, label='person').count() == 1

    @patch('ai_engine.tasks._upload_frame_to_minio', return_value=None)
    @patch('ai_engine.tasks.send_alert_via_websocket')
    def test_creates_alert_for_high_danger(self, mock_ws, mock_upload):
        from ai_engine.tasks import save_detection_task
        cam = make_camera()
        with patch('ai_engine.tasks._should_send_alert', return_value=True):
            save_detection_task(str(cam.id), 'person', 0.92, 'HIGH', [])
        assert Alert.objects.filter(detection__camera=cam).count() == 1
        mock_ws.assert_called_once()

    @patch('ai_engine.tasks._upload_frame_to_minio', return_value=None)
    @patch('ai_engine.tasks.send_alert_via_websocket')
    def test_no_alert_for_low_danger(self, mock_ws, mock_upload):
        from ai_engine.tasks import save_detection_task
        cam = make_camera()
        save_detection_task(str(cam.id), 'bird', 0.7, 'LOW', [])
        assert Alert.objects.count() == 0
        mock_ws.assert_not_called()

    @patch('ai_engine.tasks._upload_frame_to_minio', return_value=None)
    @patch('ai_engine.tasks.send_alert_via_websocket')
    def test_unknown_camera_does_not_crash(self, mock_ws, mock_upload):
        from ai_engine.tasks import save_detection_task
        save_detection_task('00000000-0000-0000-0000-000000000000', 'person', 0.9, 'HIGH', [])
        assert Detection.objects.count() == 0


class TestShouldSendAlert:

    @patch('redis.Redis')
    def test_allows_first_alert(self, mock_redis_cls):
        from ai_engine.tasks import _should_send_alert
        mock_r = MagicMock()
        mock_r.set.return_value = True
        mock_redis_cls.return_value = mock_r
        assert _should_send_alert('cam1', 'person') is True

    @patch('redis.Redis')
    def test_blocks_during_cooldown(self, mock_redis_cls):
        from ai_engine.tasks import _should_send_alert
        mock_r = MagicMock()
        mock_r.set.return_value = False
        mock_redis_cls.return_value = mock_r
        assert _should_send_alert('cam1', 'person') is False

    @patch('redis.Redis', side_effect=Exception('Redis down'))
    def test_redis_down_allows_alert(self, mock_redis_cls):
        from ai_engine.tasks import _should_send_alert
        assert _should_send_alert('cam1', 'person') is True
