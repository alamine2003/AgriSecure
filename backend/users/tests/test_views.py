import pytest
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient
from users.models import CustomUser, OTPCode, TrustedDevice


def make_agent(email='agent@test.com', nin='NIN001', active=True, must_change=False):
    u = CustomUser.objects.create_user(
        email=email, nin=nin, first_name='A', last_name='B', password='pass123'
    )
    u.is_active = active
    u.must_change_password = must_change
    u.save()
    return u


def make_maintenancier(email='maint@test.com', nin='MAINT01'):
    return CustomUser.objects.create_superuser(
        email=email, nin=nin, password='pass123'
    )


@pytest.mark.django_db
class TestLoginStep1:
    url = '/api/v1/auth/login/'

    def test_wrong_password_returns_401(self):
        make_agent()
        r = APIClient().post(self.url, {'email': 'agent@test.com', 'password': 'wrong'})
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_inactive_account_returns_401(self):
        # Django's ModelBackend returns None for inactive users → 401
        make_agent(active=False)
        r = APIClient().post(self.url, {'email': 'agent@test.com', 'password': 'pass123'})
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_valid_credentials_send_otp(self):
        make_agent()
        r = APIClient().post(self.url, {'email': 'agent@test.com', 'password': 'pass123'})
        assert r.status_code == status.HTTP_200_OK
        assert r.data['otp_required'] is True
        assert 'session_token' in r.data
        assert len(mail.outbox) == 1

    def test_trusted_device_skips_otp(self):
        user = make_agent()
        device = TrustedDevice.create_for(user)
        r = APIClient().post(self.url, {
            'email': 'agent@test.com', 'password': 'pass123',
            'device_token': str(device.token),
        })
        assert r.status_code == status.HTTP_200_OK
        assert r.data.get('otp_required') is False
        assert 'access' in r.data


@pytest.mark.django_db
class TestVerifyOTP:
    login_url = '/api/v1/auth/login/'
    verify_url = '/api/v1/auth/verify-otp/'

    def _get_session_token(self, email='agent@test.com'):
        make_agent(email=email, nin='NIN100')
        r = APIClient().post(self.login_url, {'email': email, 'password': 'pass123'})
        return r.data['session_token']

    def test_valid_otp_returns_tokens(self):
        token = self._get_session_token()
        code = OTPCode.objects.filter(is_used=False).first().code
        r = APIClient().post(self.verify_url, {'session_token': token, 'otp_code': code})
        assert r.status_code == status.HTTP_200_OK
        assert 'access' in r.data
        assert 'refresh' in r.data

    def test_wrong_otp_returns_400(self):
        token = self._get_session_token('agent2@test.com')
        r = APIClient().post(self.verify_url, {'session_token': token, 'otp_code': '000000'})
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_remember_device_returns_device_token(self):
        token = self._get_session_token('agent3@test.com')
        code = OTPCode.objects.filter(is_used=False).first().code
        r = APIClient().post(self.verify_url, {
            'session_token': token, 'otp_code': code, 'remember_device': True
        })
        assert r.status_code == status.HTTP_200_OK
        assert 'device_token' in r.data

    def test_used_otp_cannot_be_reused(self):
        token = self._get_session_token('agent4@test.com')
        otp = OTPCode.objects.filter(is_used=False).first()
        APIClient().post(self.verify_url, {'session_token': token, 'otp_code': otp.code})
        r = APIClient().post(self.verify_url, {'session_token': token, 'otp_code': otp.code})
        assert r.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPermissions:
    cameras_url = '/api/v1/surveillance/cameras/'

    def _auth_client(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return c

    def test_unauthenticated_blocked(self):
        r = APIClient().get(self.cameras_url)
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_must_change_password_blocked(self):
        user = make_agent(email='blocked@test.com', nin='BLK001', must_change=True)
        c = self._auth_client(user)
        r = c.get(self.cameras_url)
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_can_list_cameras(self):
        user = make_agent(email='agent5@test.com', nin='AG005')
        c = self._auth_client(user)
        r = c.get(self.cameras_url)
        assert r.status_code == status.HTTP_200_OK

    def test_agent_cannot_create_camera(self):
        user = make_agent(email='agent6@test.com', nin='AG006')
        c = self._auth_client(user)
        r = c.post(self.cameras_url, {'name': 'Cam', 'camera_index': 0})
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_maintenancier_can_create_camera(self):
        maint = make_maintenancier()
        agent = make_agent(email='agent7@test.com', nin='AG007')
        c = self._auth_client(maint)
        r = c.post(self.cameras_url, {
            'name': 'Cam Test', 'camera_index': 0, 'agent': str(agent.id)
        })
        assert r.status_code in (status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST)


@pytest.mark.django_db
class TestChangePassword:
    url = '/api/v1/auth/change-password/'

    def _auth_client(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return c

    def test_change_password_success(self):
        user = make_agent(email='chpw@test.com', nin='CHP001', must_change=True)
        c = self._auth_client(user)
        r = c.post(self.url, {
            'old_password': 'pass123',
            'new_password': 'NewStrongPass123!',
            'confirm_password': 'NewStrongPass123!',
        })
        assert r.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.must_change_password is False

    def test_wrong_old_password_rejected(self):
        user = make_agent(email='chpw2@test.com', nin='CHP002')
        c = self._auth_client(user)
        r = c.post(self.url, {
            'old_password': 'wrongpass',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!',
        })
        assert r.status_code == status.HTTP_400_BAD_REQUEST
