"""
Tâches Celery pour actualiser les métriques Prometheus de type Gauge.
Planifiées via django_celery_beat (toutes les 30 s par défaut).
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='core.metrics_tasks.refresh_business_metrics', ignore_result=True)
def refresh_business_metrics():
    """Met à jour les jauges métier exposées à Prometheus."""
    try:
        from core.custom_metrics import (
            cameras_total,
            active_agents_total,
            pending_registrations_total,
        )
        from surveillance.models import Camera
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Caméras en ligne / hors ligne
        online = Camera.objects.filter(is_active=True).count()
        offline = Camera.objects.filter(is_active=False).count()
        cameras_total.labels(status='online').set(online)
        cameras_total.labels(status='offline').set(offline)

        # Agents actifs (role='agent', is_active=True)
        active = User.objects.filter(role='agent', is_active=True).count()
        active_agents_total.set(active)

        # Demandes en attente (is_active=False, role='agent', date_joined récente)
        pending = User.objects.filter(role='agent', is_active=False).count()
        pending_registrations_total.set(pending)

    except Exception as exc:
        logger.warning("refresh_business_metrics failed: %s", exc)
