import secrets
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    class AuthMethod(models.TextChoices):
        EMAIL = 'email', 'Email'
        PHONE = 'phone', 'TÃ©lÃ©phone'
        WHATSAPP = 'whatsapp', 'WhatsApp'

    class ServiceProfile(models.TextChoices):
        BUSINESS = 'business', 'Business'
        FAMILY = 'family', 'Family'
        PARTNER = 'partner', 'Partner'
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    whatsapp_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    pin = models.CharField(max_length=4, blank=True, null=True)
    auth_method = models.CharField(
        max_length=10,
        choices=AuthMethod.choices,
        default=AuthMethod.EMAIL,
    )
    service_profile = models.CharField(
        max_length=10,
        choices=ServiceProfile.choices,
        default=ServiceProfile.BUSINESS,
    )
    email_verified = models.BooleanField(default=False)
    subscription_plan = models.CharField(
        max_length=20,
        choices=[
            ('free', 'Free'),
            ('basic', 'Basic'),
            ('pro', 'Pro'),
            ('business', 'Business'),
        ],
        default='free',
    )
    subscription_expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='agenttrack_users',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='agenttrack_users',
        blank=True,
    )

    USERNAME_FIELD = 'username'

    def __str__(self):
        return f'{self.get_auth_method_display()}: {self.email or self.phone or self.whatsapp_number}'


class ActivationToken(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='activation_tokens'
    )
    token = models.CharField(max_length=64, unique=True, editable=False)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    method = models.CharField(
        max_length=10,
        choices=User.AuthMethod.choices,
        default=User.AuthMethod.EMAIL,
    )

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        super().save(*args, **kwargs)

    def is_expired(self):
        expiry = self.created_at + timezone.timedelta(hours=2)
        return timezone.now() > expiry

    def __str__(self):
        return f'Token for {self.user} (used={self.is_used})'


