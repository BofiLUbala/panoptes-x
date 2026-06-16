import logging
import re
from datetime import timedelta
from typing import Optional

from django.utils import timezone

logger = logging.getLogger(__name__)

SMS_RETENTION_DAYS = 30


def normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone or '')
    if digits.startswith('243') and len(digits) >= 12:
        return '+' + digits
    if digits.startswith('0') and len(digits) >= 10:
        return '+243' + digits[1:]
    if len(digits) == 9:
        return '+243' + digits
    if phone and phone.startswith('+'):
        return '+' + digits
    return '+' + digits if digits else phone


def get_device_secret_from_request(request):
    header = request.headers.get('X-Device-Secret')
    if header:
        return header.strip()
    if isinstance(request.data, dict):
        return request.data.get('device_secret')
    return None


def cleanup_old_sms():
    cutoff = timezone.now() - timedelta(days=SMS_RETENTION_DAYS)
    from .models import ForwardedSms
    deleted, _ = ForwardedSms.objects.filter(received_at__lt=cutoff).delete()
    if deleted:
        logger.info('Purged %s forwarded SMS older than %s days', deleted, SMS_RETENTION_DAYS)


def send_fcm_notification(fcm_token: str, title: str, body: str, data: Optional[dict] = None):
    if not fcm_token:
        return
    logger.info(
        'FCM notification (stub): token=%s… title=%s body=%s data=%s',
        fcm_token[:12],
        title,
        body,
        data,
    )
