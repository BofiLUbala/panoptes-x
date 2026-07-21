import asyncio
from django.contrib.auth import get_user_model
from django.test import TestCase
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from monitoring.models import Device, WatchRelation

User = get_user_model()


class ForwardSmsRealtimePushTest(TestCase):
    def setUp(self):
        self.watcher_user = User.objects.create_user(
            username='watcher1', password='testpass123'
        )
        self.watcher_device = Device.objects.create(
            user=self.watcher_user, phone_number='+243900000001'
        )
        self.target_device = Device.objects.create(
            phone_number='+243900000002'
        )
        WatchRelation.objects.create(
            watcher=self.watcher_device,
            target=self.target_device,
            status='active',
        )

    def test_forward_sms_pushes_to_watcher_channel_group(self):
        channel_layer = get_channel_layer()
        group_name = f'sms_feed_{self.watcher_user.id}'

        channel_name = async_to_sync(channel_layer.new_channel)()
        async_to_sync(channel_layer.group_add)(group_name, channel_name)

        response = self.client.post(
            '/api/monitoring/forward-sms/',
            data={
                'sender': 'AIRTEL',
                'message': 'Vous avez recu 10.000 CDF',
            },
            content_type='application/json',
            HTTP_X_DEVICE_SECRET=str(self.target_device.device_secret),
        )
        self.assertEqual(response.status_code, 201, response.content)

        async def receive():
            return await asyncio.wait_for(
                channel_layer.receive(channel_name), timeout=2
            )

        message = async_to_sync(receive)()
        self.assertEqual(message['type'], 'sms_received')
        self.assertEqual(message['payload']['sender'], 'AIRTEL')
        self.assertIn('10.000 CDF', message['payload']['message'])
