from django.db import models
from uuid import uuid4
from django.conf import settings
from django.utils import timezone


class Device(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devices',
    )
    phone_number = models.CharField(max_length=20, unique=True)
    device_secret = models.UUIDField(default=uuid4, unique=True)
    fcm_token = models.CharField(max_length=255, blank=True, null=True)

    # Device fingerprinting
    device_name = models.CharField(max_length=255, blank=True, default='')
    device_model = models.CharField(max_length=255, blank=True, default='')
    os_version = models.CharField(max_length=50, blank=True, default='')
    app_version = models.CharField(max_length=20, blank=True, default='')
    fingerprint = models.CharField(max_length=255, blank=True, default='', db_index=True)

    # Device management
    is_blocked = models.BooleanField(default=False)
    blocked_at = models.DateTimeField(null=True, blank=True)
    block_reason = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    # Heartbeat
    last_heartbeat_at = models.DateTimeField(null=True, blank=True)
    heartbeat_interval = models.IntegerField(default=60)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['fingerprint']),
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return self.phone_number

    def is_healthy(self):
        if not self.last_heartbeat_at:
            return False
        grace_period = timezone.timedelta(seconds=self.heartbeat_interval * 3)
        return timezone.now() - self.last_heartbeat_at < grace_period


class WatchRelation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('rejected', 'Rejected'),
        ('revoked', 'Revoked'),
    ]

    watcher = models.ForeignKey(
        Device, related_name='watching', on_delete=models.CASCADE
    )
    target = models.ForeignKey(
        Device, related_name='watched_by', on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['watcher', 'target']]

    def __str__(self):
        return f"{self.watcher} -> {self.target} ({self.status})"


class ForwardedSms(models.Model):
    target_device = models.ForeignKey(
        Device, related_name='forwarded_sms', on_delete=models.CASCADE
    )
    sender = models.CharField(max_length=20)
    message = models.TextField()
    received_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-received_at']
        verbose_name = 'Forwarded SMS'
        verbose_name_plural = 'Forwarded SMS'
        indexes = [
            models.Index(fields=['target_device', 'received_at']),
        ]

    def __str__(self):
        return f"{self.sender} -> {self.target_device.phone_number} @ {self.received_at}"


class DeviceHeartbeat(models.Model):
    device = models.ForeignKey(
        Device, on_delete=models.CASCADE, related_name='heartbeats',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    battery_level = models.FloatField(null=True, blank=True)
    network_type = models.CharField(max_length=20, blank=True, default='')
    signal_strength = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Device Heartbeat'
        verbose_name_plural = 'Device Heartbeats'

    def __str__(self):
        return f'{self.device.phone_number} @ {self.created_at}'
