import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info('WebSocket connected: user=%s', self.user.username)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info('WebSocket disconnected: user=%s', getattr(self.user, 'username', 'unknown'))

    async def receive_json(self, content):
        action = content.get('action')
        if action == 'ping':
            await self.send_json({'action': 'pong'})
        elif action == 'mark_read':
            notification_id = content.get('notification_id')
            await self.mark_notification_read(notification_id)
            await self.send_json({'action': 'marked_read', 'notification_id': notification_id})

    async def notification_message(self, event):
        await self.send_json(event['payload'])

    async def transaction_update(self, event):
        await self.send_json(event['payload'])

    async def sms_received(self, event):
        await self.send_json(event['payload'])

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from .models import Notification
        Notification.objects.filter(id=notification_id, user=self.user).update(
            is_read=True, read_at=__import__('django.utils.timezone').timezone.now(),
        )


class TransactionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f'transactions_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info('Transaction WebSocket connected: user=%s', self.user.username)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        action = content.get('action')
        if action == 'ping':
            await self.send_json({'action': 'pong'})

    async def transaction_update(self, event):
        await self.send_json(event['payload'])


class SmsFeedConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f'sms_feed_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info('SMS Feed WebSocket connected: user=%s', self.user.username)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        if content.get('action') == 'ping':
            await self.send_json({'action': 'pong'})

    async def sms_received(self, event):
        await self.send_json(event['payload'])
