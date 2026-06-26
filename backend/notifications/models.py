from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    class Channel(models.TextChoices):
        PUSH = 'push', 'Push'
        IN_APP = 'in_app', 'In-App'
        EMAIL = 'email', 'Email'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.IN_APP)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    data = models.JSONField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f'{self.title} — {self.user.username}'

    def mark_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])


class PushDevice(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='push_devices',
    )
    fcm_token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=10, default='android')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.platform}:{self.fcm_token[:20]}...'
