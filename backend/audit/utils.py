import logging
from .models import AuditLog

logger = logging.getLogger(__name__)


def log_audit(user, action, resource_type, resource_id=None, description='', details=None, request=None):
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        description=description,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    logger.info('AUDIT: %s %s %s by user %s', action, resource_type, resource_id, user)
