import pytest


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def make_agent(db):
    def _make(email='agent@test.com', nin='NIN001', must_change=False, active=True):
        from users.models import CustomUser
        u = CustomUser.objects.create_user(
            email=email, nin=nin, first_name='A', last_name='B', password='pass123'
        )
        u.must_change_password = must_change
        u.is_active = active
        u.save()
        return u
    return _make


@pytest.fixture
def make_maintenancier(db):
    def _make(email='maint@test.com', nin='MAINT01'):
        from users.models import CustomUser
        return CustomUser.objects.create_superuser(
            email=email, nin=nin, password='pass123'
        )
    return _make


@pytest.fixture
def auth_client():
    def _client(user):
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return c
    return _client
