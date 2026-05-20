from .base import *
import os

DEBUG = True
ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'surveillance_db'),
        'USER': os.getenv('POSTGRES_USER', 'surveillance_user'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}

CORS_ALLOW_ALL_ORIGINS = True

# Bypass OTP : désactivable indépendamment de DEBUG (ex: tester le flow OTP en dev)
BYPASS_OTP = os.getenv('BYPASS_OTP', 'true').lower() == 'true'

# OTP par console en dev (évite les 503 si SMTP non configuré)
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend',
)

# En dev/test : throttle présent mais taux très élevés pour ne pas bloquer
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '10000/min',
    'user': '100000/min',
    'login': '10000/min',
    'otp': '10000/min',
    'registration': '1000/hour',
}
