from django.db import models
from uuid import uuid4
from django.conf import settings


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.phone_number


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

    def __str__(self):
        return f"{self.sender} -> {self.target_device.phone_number} @ {self.received_at}"
