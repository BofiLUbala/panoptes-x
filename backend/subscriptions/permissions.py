from rest_framework.permissions import BasePermission
from django.utils import timezone
from .models import DeviceSubscription


class HasActiveSubscription(BasePermission):
    message = 'Abonnement expiré ou inactif pour ce service.'

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'device') and hasattr(obj, 'service'):
            return DeviceSubscription.objects.filter(
                device=obj.device,
                service__code=obj.service.code,
                status=DeviceSubscription.Status.ACTIVE,
                expiry_date__gt=timezone.now(),
            ).exists()
        return True


def check_device_service_subscription(device, service_code):
    return DeviceSubscription.objects.filter(
        device=device,
        service__code=service_code,
        status=DeviceSubscription.Status.ACTIVE,
        expiry_date__gt=timezone.now(),
    ).exists()
