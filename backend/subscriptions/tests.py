from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from monitoring.models import Device
from subscriptions.models import Service, DeviceSubscription, Payment, PaymentItem

User = get_user_model()


class SubscriptionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPass123!',
            email='test@example.com',
        )
        self.device = Device.objects.create(
            user=self.user,
            phone_number='+243800000001',
        )
        self.device2 = Device.objects.create(
            user=self.user,
            phone_number='+243800000002',
        )
        self.service = Service.objects.create(
            code='sms_monitoring',
            name='SMS Monitoring',
            monthly_price=Decimal('1.00'),
        )
        self.service2 = Service.objects.create(
            code='mobile_money_monitoring',
            name='Mobile Money Monitoring',
            monthly_price=Decimal('2.00'),
        )
        self.client.force_authenticate(user=self.user)

    def test_service_list(self):
        """Test GET /api/services/ returns all active services."""
        response = self.client.get('/api/services/')
        self.assertEqual(response.status_code, 200)
        codes = [s['code'] for s in response.data]
        self.assertIn('sms_monitoring', codes)

    def test_create_payment(self):
        """Test POST /api/payments/create/ creates a payment and payment items."""
        response = self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('payment_id', response.data)
        self.assertIn('reference', response.data)
        self.assertEqual(float(response.data['amount']), 1.00)
        self.assertEqual(Payment.objects.count(), 1)

    def test_create_payment_multiple_items(self):
        """Test payment with multiple items across devices and services."""
        response = self.client.post('/api/payments/create/', {
            'network': 'orange',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
                {'device_id': self.device2.id, 'service_id': self.service2.id, 'duration_days': 30},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 201)
        payment = Payment.objects.first()
        self.assertEqual(payment.items.count(), 2)
        self.assertAlmostEqual(float(payment.amount), 3.00, places=2)

    def test_confirm_payment_activates_subscription(self):
        """Test POST /api/payments/confirm/ activates device subscriptions."""
        create_resp = self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        payment_id = create_resp.data['payment_id']

        response = self.client.post('/api/payments/confirm/', {
            'payment_id': payment_id,
            'transaction_reference': 'MP123456',
        }, format='json')
        self.assertEqual(response.status_code, 200)

        subs = DeviceSubscription.objects.filter(
            device=self.device,
            service=self.service,
        )
        self.assertEqual(subs.count(), 1)
        sub = subs.first()
        self.assertEqual(sub.status, DeviceSubscription.Status.ACTIVE)
        self.assertGreater(sub.expiry_date, timezone.now())

    def test_confirm_payment_extends_subscription(self):
        """Test confirming a second payment extends the existing subscription."""
        self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        pay1 = Payment.objects.first()
        pay1.status = Payment.Status.CONFIRMED
        pay1.transaction_reference = 'MP1'
        pay1.confirmed_at = timezone.now()
        pay1.save()
        DeviceSubscription.objects.create(
            device=self.device,
            service=self.service,
            expiry_date=timezone.now() + timedelta(days=30),
            status=DeviceSubscription.Status.ACTIVE,
        )

        create_resp2 = self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        payment_id2 = create_resp2.data['payment_id']

        response = self.client.post('/api/payments/confirm/', {
            'payment_id': payment_id2,
            'transaction_reference': 'MP2',
        }, format='json')
        self.assertEqual(response.status_code, 200)

        sub = DeviceSubscription.objects.get(device=self.device, service=self.service)
        self.assertGreaterEqual(sub.days_remaining(), 55)

    def test_create_payment_invalid_device(self):
        """Test payment with invalid device returns 400."""
        response = self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': 9999, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_confirm_payment_invalid_id(self):
        """Test confirming non-existent payment returns 404."""
        response = self.client.post('/api/payments/confirm/', {
            'payment_id': 9999,
            'transaction_reference': 'MP123',
        }, format='json')
        self.assertEqual(response.status_code, 404)

    def test_confirm_payment_twice(self):
        """Test confirming an already confirmed payment returns 400."""
        create_resp = self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        payment_id = create_resp.data['payment_id']

        self.client.post('/api/payments/confirm/', {
            'payment_id': payment_id,
            'transaction_reference': 'MP1',
        }, format='json')

        response = self.client.post('/api/payments/confirm/', {
            'payment_id': payment_id,
            'transaction_reference': 'MP2',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_list_subscriptions(self):
        """Test GET /api/subscriptions/ returns user subscriptions."""
        DeviceSubscription.objects.create(
            device=self.device,
            service=self.service,
            expiry_date=timezone.now() + timedelta(days=30),
            status=DeviceSubscription.Status.ACTIVE,
        )
        response = self.client.get('/api/subscriptions/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_list_payments(self):
        """Test GET /api/payments/ returns user payments."""
        Payment.objects.create(
            user=self.user,
            amount=Decimal('1.00'),
            network='mpesa',
            status=Payment.Status.CONFIRMED,
        )
        response = self.client.get('/api/payments/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_expire_subscription_command(self):
        """Test the expire_subscriptions management command."""
        from django.core.management import call_command
        DeviceSubscription.objects.create(
            device=self.device,
            service=self.service,
            expiry_date=timezone.now() - timedelta(days=1),
            status=DeviceSubscription.Status.ACTIVE,
        )
        call_command('expire_subscriptions')
        sub = DeviceSubscription.objects.get(device=self.device, service=self.service)
        self.assertEqual(sub.status, DeviceSubscription.Status.EXPIRED)

    def test_unauthenticated_access(self):
        """Test unauthenticated requests are rejected."""
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/payments/create/', {
            'network': 'mpesa',
            'items': [
                {'device_id': self.device.id, 'service_id': self.service.id, 'duration_days': 30},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 401)

    def test_subscription_expired_status_on_save(self):
        """Test that saving an expired subscription auto-sets status to expired."""
        sub = DeviceSubscription.objects.create(
            device=self.device,
            service=self.service,
            expiry_date=timezone.now() - timedelta(days=1),
            status=DeviceSubscription.Status.ACTIVE,
        )
        sub.save()
        self.assertEqual(sub.status, DeviceSubscription.Status.EXPIRED)
