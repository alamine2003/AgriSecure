import logging
from .models import AuditLog

logger = logging.getLogger(__name__)


def log_action(user, action, target, request=None, details=None):
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            target_type=type(target).__name__,
            target_id=str(target.pk),
            target_name=str(target),
            details=details,
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
        )
    except Exception as exc:
        logger.warning("Audit log failed [%s]: %s", action, exc)
