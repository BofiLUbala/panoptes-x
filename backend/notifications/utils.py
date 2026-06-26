import json
import logging
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Notification, PushDevice

logger = logging.getLogger(__name__)


def send_push_notification(user_id, title, body, data=None):
    tokens = list(PushDevice.objects.filter(
        user_id=user_id, is_active=True,
    ).values_list('fcm_token', flat=True))

    if not tokens:
        logger.info('No push devices for user %s', user_id)
        return

    if not settings.FCM_ENABLED or not settings.FCM_SERVER_KEY:
        logger.info('FCM not configured, skipping push for user %s', user_id)
        return

    headers = {
        'Authorization': f'key={settings.FCM_SERVER_KEY}',
        'Content-Type': 'application/json',
    }

    for token in tokens:
        payload = {
            'to': token,
            'notification': {
                'title': title,
                'body': body,
                'sound': 'default',
            },
            'data': data or {},
        }
        try:
            resp = requests.post(
                'https://fcm.googleapis.com/fcm/send',
                headers=headers,
                json=payload,
                timeout=10,
            )
            if resp.status_code == 200:
                logger.info('FCM push sent to %s: %s', token[:20], title)
            else:
                logger.warning('FCM push failed for %s: %s', token[:20], resp.text)
        except requests.RequestException as e:
            logger.error('FCM push error: %s', e)


def send_in_app_notification(user_id, title, body, data=None, priority=Notification.Priority.NORMAL):
    notification = Notification.objects.create(
        user_id=user_id,
        title=title,
        body=body,
        channel=Notification.Channel.IN_APP,
        priority=priority,
        data=data,
    )

    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'user_{user_id}',
            {
                'type': 'notification_message',
                'payload': {
                    'id': notification.id,
                    'title': notification.title,
                    'body': notification.body,
                    'data': notification.data,
                    'created_at': notification.created_at.isoformat(),
                },
            },
        )

    return notification


def notify_transaction_update(user_id, transaction_data):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'transactions_{user_id}',
            {
                'type': 'transaction_update',
                'payload': {
                    'type': 'new_transaction',
                    'transaction': transaction_data,
                },
            },
        )


def notify_sms_received(user_id, sms_data):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'sms_feed_{user_id}',
            {
                'type': 'sms_received',
                'payload': {
                    'type': 'new_sms',
                    'sms': sms_data,
                },
            },
        )


def notify_and_push(user_id, title, body, data=None):
    send_in_app_notification(user_id, title, body, data)
    send_push_notification(user_id, title, body, data)
