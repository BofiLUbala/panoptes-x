import uuid
import random
import string
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Service(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.name} ({self.code})'


class DeviceSubscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXPIRED = 'expired', 'Expired'
        SUSPENDED = 'suspended', 'Suspended'

    device = models.ForeignKey(
        'monitoring.Device',
        on_delete=models.CASCADE,
        related_name='subscriptions',
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='subscriptions',
    )
    start_date = models.DateTimeField(default=timezone.now)
    expiry_date = models.DateTimeField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['device', 'service']]
        verbose_name = 'Device Subscription'
        verbose_name_plural = 'Device Subscriptions'

    def __str__(self):
        return f'{self.device.phone_number} - {self.service.name} ({self.status})'

    def is_expired(self):
        return timezone.now() >= self.expiry_date

    def days_remaining(self):
        delta = self.expiry_date - timezone.now()
        return max(0, delta.days)

    def save(self, *args, **kwargs):
        if self.is_expired() and self.status == DeviceSubscription.Status.ACTIVE:
            self.status = DeviceSubscription.Status.EXPIRED
        super().save(*args, **kwargs)


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'

    class Network(models.TextChoices):
        MPESA = 'mpesa', 'M-Pesa'
        ORANGE = 'orange', 'Orange Money'
        AIRTEL = 'airtel', 'Airtel Money'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    invoice_reference = models.CharField(max_length=50, unique=True, editable=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    network = models.CharField(max_length=10, choices=Network.choices)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    transaction_reference = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.invoice_reference} - {self.amount} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.invoice_reference:
            date_part = timezone.now().strftime('%Y%m%d')
            rand_part = ''.join(random.choices(string.digits, k=4))
            self.invoice_reference = f'INV-{date_part}{rand_part}'
        super().save(*args, **kwargs)


class PaymentItem(models.Model):
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='items',
    )
    device = models.ForeignKey('monitoring.Device', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.PositiveIntegerField()

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.payment.invoice_reference} - {self.device.phone_number} - {self.service.name}'
