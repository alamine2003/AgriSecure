import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import CustomUser
from surveillance.models import Camera, Detection, Alert


def make_agent(email, nin):
    u = CustomUser.objects.create_user(
        email=email, nin=nin, first_name='A', last_name='B', password='pass123'
    )
    u.must_change_password = False
    u.save()
    return u


def make_maintenancier():
    return CustomUser.objects.create_superuser(
        email='maint@test.com', nin='MNT001', password='pass123'
    )


def auth_client(user):
    refresh = RefreshToken.for_user(user)
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return c


@pytest.mark.django_db
class TestCameraViewSet:
    url = '/api/v1/surveillance/cameras/'

    def test_agent_sees_only_own_cameras(self):
        agent1 = make_agent('a1@test.com', 'A1')
        agent2 = make_agent('a2@test.com', 'A2')
        Camera.objects.create(name='Cam1', camera_index=0, agent=agent1)
        Camera.objects.create(name='Cam2', camera_index=1, agent=agent2)

        r = auth_client(agent1).get(self.url)
        assert r.status_code == status.HTTP_200_OK
        names = [c['name'] for c in r.data['results']]
        assert 'Cam1' in names
        assert 'Cam2' not in names

    def test_maintenancier_sees_all_cameras(self):
        maint = make_maintenancier()
        agent = make_agent('a3@test.com', 'A3')
        Camera.objects.create(name='CamA', camera_index=0, agent=agent)
        Camera.objects.create(name='CamB', camera_index=1, agent=agent)

        r = auth_client(maint).get(self.url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data['count'] >= 2

    def test_pagination_present(self):
        agent = make_agent('a4@test.com', 'A4')
        r = auth_client(agent).get(self.url)
        assert 'count' in r.data
        assert 'results' in r.data


@pytest.mark.django_db
class TestDetectionViewSet:
    url = '/api/v1/surveillance/detections/'

    def test_agent_sees_only_own_detections(self):
        agent1 = make_agent('d1@test.com', 'D1')
        agent2 = make_agent('d2@test.com', 'D2')
        cam1 = Camera.objects.create(name='C1', camera_index=0, agent=agent1)
        cam2 = Camera.objects.create(name='C2', camera_index=1, agent=agent2)
        Detection.objects.create(camera=cam1, agent=agent1, label='person',
                                  confidence=0.9, danger_level='HIGH', bbox=[], is_alert=True)
        Detection.objects.create(camera=cam2, agent=agent2, label='cow',
                                  confidence=0.8, danger_level='MEDIUM', bbox=[], is_alert=False)

        r = auth_client(agent1).get(self.url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data['count'] == 1
        assert r.data['results'][0]['label'] == 'person'

    def test_filter_by_danger_level(self):
        agent = make_agent('d3@test.com', 'D3')
        cam = Camera.objects.create(name='CF', camera_index=0, agent=agent)
        Detection.objects.create(camera=cam, agent=agent, label='person',
                                  confidence=0.9, danger_level='HIGH', bbox=[], is_alert=True)
        Detection.objects.create(camera=cam, agent=agent, label='bird',
                                  confidence=0.6, danger_level='LOW', bbox=[], is_alert=False)

        r = auth_client(agent).get(self.url + '?danger_level=HIGH')
        assert r.status_code == status.HTTP_200_OK
        assert r.data['count'] == 1


@pytest.mark.django_db
class TestAlertViewSet:
    url = '/api/v1/surveillance/alerts/'

    def test_maintenancier_blocked_on_alerts(self):
        maint = make_maintenancier()
        r = auth_client(maint).get(self.url)
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_can_list_alerts(self):
        agent = make_agent('al1@test.com', 'AL1')
        r = auth_client(agent).get(self.url)
        assert r.status_code == status.HTTP_200_OK

    def test_mark_alert_as_read(self):
        agent = make_agent('al2@test.com', 'AL2')
        cam = Camera.objects.create(name='CA', camera_index=0, agent=agent)
        det = Detection.objects.create(camera=cam, agent=agent, label='person',
                                        confidence=0.9, danger_level='HIGH',
                                        bbox=[], is_alert=True)
        alert = Alert.objects.create(detection=det, message='Intrusion')

        r = auth_client(agent).patch(f'{self.url}{alert.id}/read/')
        assert r.status_code == status.HTTP_200_OK
        alert.refresh_from_db()
        assert alert.is_read is True
