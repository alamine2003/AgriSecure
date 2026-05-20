from __future__ import absolute_import, unicode_literals

# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
from .celery import app as celery_app

# Register custom Prometheus metrics at import time
from . import custom_metrics  # noqa: F401

__all__ = ('celery_app',)
