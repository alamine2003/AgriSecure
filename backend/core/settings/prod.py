from .base import *
import os

DEBUG = os.getenv('DJANGO_DEBUG', '').lower() in ('true', '1', 'yes')

# En production, le bypass OTP est toujours désactivé sauf surcharge explicite
BYPASS_OTP = os.getenv('BYPASS_OTP', 'false').lower() == 'true'

_allowed_hosts_str = os.getenv('DJANGO_ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_str.split(',') if h.strip()] or ['localhost']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('POSTGRES_HOST'),
        'PORT': os.getenv('POSTGRES_PORT'),
    }
}

_cors_origins_str = os.getenv('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins_str.split(',') if o.strip()]

# Security settings
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', str(SECURE_SSL_REDIRECT)) == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', str(SECURE_SSL_REDIRECT)) == 'True'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'False') == 'True'
SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'False') == 'True'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Email — SMTP en production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Logging JSON structuré (python-json-logger requis en prod)
LOGGING['formatters']['json'] = {
    '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
    'fmt': '%(asctime)s %(levelname)s %(name)s %(module)s %(funcName)s %(message)s',
    'datefmt': '%Y-%m-%dT%H:%M:%S',
}
LOGGING['handlers']['console']['formatter'] = 'json'
