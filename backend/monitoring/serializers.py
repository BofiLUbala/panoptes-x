from rest_framework import serializers
from .models import Device, WatchRelation, ForwardedSms


class DeviceRegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    fcm_token = serializers.CharField(max_length=255, required=False, allow_blank=True)


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'phone_number', 'device_secret', 'fcm_token', 'created_at']
        read_only_fields = ['id', 'device_secret', 'created_at']


class AuthorizeWatcherSerializer(serializers.Serializer):
    target_phone = serializers.CharField(max_length=20)
    watcher_phone = serializers.CharField(max_length=20, required=False)


class ConfirmWatcherSerializer(serializers.Serializer):
    request_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['accept', 'reject'])


class RevokeWatcherSerializer(serializers.Serializer):
    request_id = serializers.IntegerField(required=False)
    target_phone = serializers.CharField(max_length=20, required=False)


class ForwardSmsSerializer(serializers.Serializer):
    device_secret = serializers.UUIDField(required=False)
    sender = serializers.CharField(max_length=20)
    message = serializers.CharField()
    timestamp = serializers.DateTimeField(required=False)


class WatchRelationSerializer(serializers.ModelSerializer):
    watcher_phone = serializers.CharField(source='watcher.phone_number', read_only=True)
    target_phone = serializers.CharField(source='target.phone_number', read_only=True)

    class Meta:
        model = WatchRelation
        fields = [
            'id', 'watcher_phone', 'target_phone', 'status',
            'created_at', 'confirmed_at', 'revoked_at',
        ]


class ForwardedSmsSerializer(serializers.ModelSerializer):
    target_phone = serializers.CharField(source='target_device.phone_number', read_only=True)

    class Meta:
        model = ForwardedSms
        fields = [
            'id', 'target_phone', 'sender', 'message',
            'received_at', 'created_at',
        ]
