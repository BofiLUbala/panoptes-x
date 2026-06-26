import logging
from celery import shared_task
from django.utils import timezone

from .models import Notification, PushDevice
from .utils import send_push_notification

logger = logging.getLogger(__name__)


@shared_task
def send_bulk_push_notification(user_id, title, body, data=None):
    send_push_notification(user_id, title, body, data)
    logger.info('Bulk push sent to user %s: %s', user_id, title)


@shared_task
def cleanup_old_notifications(days=90):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = Notification.objects.filter(created_at__lt=cutoff).delete()
    logger.info('Cleaned up %s old notifications', deleted)
    return deleted


@shared_task
def deactivate_stale_push_devices(days=30):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    count = PushDevice.objects.filter(updated_at__lt=cutoff, is_active=True).update(is_active=False)
    logger.info('Deactivated %s stale push devices', count)
    return count
