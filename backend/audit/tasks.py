import logging
from celery import shared_task
from django.utils import timezone

from .models import AuditLog

logger = logging.getLogger(__name__)


@shared_task
def cleanup_old_audit_logs(days=365):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = AuditLog.objects.filter(created_at__lt=cutoff).delete()
    logger.info('Cleaned up %s old audit logs', deleted)
    return deleted
