import django
from django.conf import settings


def pytest_configure():
    settings.configure(
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.contenttypes',
            'django.contrib.auth',
            'rest_framework',
            'django_filters',
            'channels',
            'users',
            'surveillance',
            'camera',
            'ai_engine',
            'notifications',
            'reports',
        ],
        AUTH_USER_MODEL='users.CustomUser',
        DEFAULT_AUTO_FIELD='django.db.models.BigAutoField',
        REST_FRAMEWORK={
            'DEFAULT_AUTHENTICATION_CLASSES': [
                'rest_framework_simplejwt.authentication.JWTAuthentication',
            ],
            'DEFAULT_PERMISSION_CLASSES': [
                'rest_framework.permissions.IsAuthenticated',
            ],
        },
        CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}},
        CELERY_TASK_ALWAYS_EAGER=True,
        CELERY_BROKER_URL='memory://',
        SECRET_KEY='test-secret-key-not-for-production',
        USE_TZ=True,
        LANGUAGE_CODE='fr-fr',
        TIME_ZONE='UTC',
        STATIC_URL='/static/',
        MEDIA_URL='/media/',
        MEDIA_ROOT='/tmp/media',
    )
