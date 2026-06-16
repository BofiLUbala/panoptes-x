from rest_framework.permissions import BasePermission

from .models import Device
from .utils import get_device_secret_from_request


class HasDeviceSecret(BasePermission):
    message = 'Authentification appareil requise (X-Device-Secret ou device_secret).'

    def has_permission(self, request, view):
        secret = get_device_secret_from_request(request)
        if not secret:
            return False
        request.device = Device.objects.filter(device_secret=secret).first()
        return request.device is not None
