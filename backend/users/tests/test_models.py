import pytest
from django.utils import timezone
from users.models import CustomUser, OTPCode, TrustedDevice


@pytest.mark.django_db
class TestCustomUser:
    def _make_agent(self, email='agent@test.com', nin='NIN123456'):
        return CustomUser.objects.create_user(
            email=email, nin=nin,
            first_name='Agent', last_name='Test', password='pass123'
        )

    def test_creation_defaults(self):
        user = self._make_agent()
        assert user.email == 'agent@test.com'
        assert user.role == 'agent_agricole'
        assert user.must_change_password is True
        assert user.is_active is True

    def test_email_is_username(self):
        user = self._make_agent()
        assert user.USERNAME_FIELD == 'email'
        assert user.username is None

    def test_nin_hash_is_deterministic(self):
        user = self._make_agent()
        assert user.nin_hash() == user.nin_hash()
        assert len(user.nin_hash()) == 64  # SHA-256 hex

    def test_superuser_flags(self):
        su = CustomUser.objects.create_superuser(
            email='admin@test.com', nin='ADMIN001', password='adminpass'
        )
        assert su.is_staff is True
        assert su.is_superuser is True
        assert su.role == 'maintenancier'
        assert su.must_change_password is False


@pytest.mark.django_db
class TestOTPCode:
    def _make_user(self):
        return CustomUser.objects.create_user(
            email='otp@test.com', nin='NIN999', password='pass'
        )

    def test_generate_creates_code(self):
        user = self._make_user()
        otp = OTPCode.generate_for(user)
        assert len(otp.code) == 6
        assert otp.code.isdigit()
        assert otp.is_used is False
        assert otp.is_expired is False

    def test_generate_replaces_previous(self):
        user = self._make_user()
        OTPCode.generate_for(user)
        OTPCode.generate_for(user)
        assert OTPCode.objects.filter(user=user, is_used=False).count() == 1

    def test_expired_otp(self):
        user = self._make_user()
        otp = OTPCode.generate_for(user)
        otp.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        assert otp.is_expired is True

    def test_generate_is_atomic(self):
        """Plusieurs appels successifs ne laissent qu'un seul OTP actif."""
        user = self._make_user()
        for _ in range(4):
            OTPCode.generate_for(user)
        assert OTPCode.objects.filter(user=user, is_used=False).count() == 1


@pytest.mark.django_db
class TestTrustedDevice:
    def test_create_valid(self):
        user = CustomUser.objects.create_user(
            email='dev@test.com', nin='DEV001', password='pass'
        )
        device = TrustedDevice.create_for(user, user_agent='TestBrowser/1.0')
        assert device.is_valid is True
        assert device.user == user

    def test_expired_device(self):
        user = CustomUser.objects.create_user(
            email='dev2@test.com', nin='DEV002', password='pass'
        )
        device = TrustedDevice.create_for(user)
        device.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        assert device.is_valid is False
