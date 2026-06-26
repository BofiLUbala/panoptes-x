from rest_framework import serializers
from .models import Notification, PushDevice


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'body', 'channel', 'priority', 'data', 'is_read', 'read_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class PushDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushDevice
        fields = ['id', 'fcm_token', 'platform', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterPushDeviceSerializer(serializers.Serializer):
    fcm_token = serializers.CharField(max_length=255)
    platform = serializers.ChoiceField(choices=['android', 'ios'], default='android')
