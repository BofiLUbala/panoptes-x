from rest_framework import serializers
from .models import Service, DeviceSubscription, Payment, PaymentItem


class ServiceSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(source='monthly_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Service
        fields = ['id', 'code', 'name', 'description', 'price', 'is_active']


class PaymentItemSerializer(serializers.Serializer):
    device_id = serializers.IntegerField()
    service_id = serializers.IntegerField()
    duration_days = serializers.IntegerField(min_value=1, max_value=365)


class CreatePaymentSerializer(serializers.Serializer):
    network = serializers.ChoiceField(choices=Payment.Network.choices)
    items = PaymentItemSerializer(many=True, min_length=1)

    def validate_items(self, items):
        from monitoring.models import Device
        from .models import Service

        for item in items:
            if not Device.objects.filter(id=item['device_id']).exists():
                raise serializers.ValidationError(f"Device {item['device_id']} does not exist.")
            if not Service.objects.filter(id=item['service_id'], is_active=True).exists():
                raise serializers.ValidationError(f"Service {item['service_id']} does not exist or is inactive.")
        return items


class ConfirmPaymentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    transaction_reference = serializers.CharField(max_length=100)


class PaymentItemReadSerializer(serializers.ModelSerializer):
    device_phone = serializers.CharField(source='device.phone_number', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_code = serializers.CharField(source='service.code', read_only=True)

    class Meta:
        model = PaymentItem
        fields = ['id', 'device_phone', 'service_name', 'service_code', 'amount', 'duration_days']


class PaymentSerializer(serializers.ModelSerializer):
    items = PaymentItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice_reference', 'amount', 'network', 'status',
            'transaction_reference', 'notes', 'created_at', 'confirmed_at', 'items',
        ]
        read_only_fields = ['id', 'invoice_reference', 'status', 'created_at', 'confirmed_at']


class DeviceSubscriptionSerializer(serializers.ModelSerializer):
    device_phone = serializers.CharField(source='device.phone_number', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_code = serializers.CharField(source='service.code', read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = DeviceSubscription
        fields = [
            'id', 'device_phone', 'service_name', 'service_code',
            'start_date', 'expiry_date', 'status', 'days_remaining', 'created_at',
        ]
        read_only_fields = ['id', 'start_date', 'expiry_date', 'status', 'created_at']
