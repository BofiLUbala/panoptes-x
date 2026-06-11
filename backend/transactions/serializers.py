from rest_framework import serializers
from .models import Transaction, FailedParse


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'operator', 'type', 'amount', 'currency',
            'volume', 'volume_unit', 'fee', 'commission',
            'new_balance', 'raw_sms', 'transaction_date', 'synced_at',
        ]
        read_only_fields = ['id', 'synced_at']


class TransactionSyncSerializer(serializers.Serializer):
    transactions = TransactionSerializer(many=True)


class FailedParseSerializer(serializers.ModelSerializer):
    class Meta:
        model = FailedParse
        fields = ['id', 'raw_sms', 'operator', 'error', 'created_at']
        read_only_fields = ['id', 'created_at']


class FailedParseSyncSerializer(serializers.Serializer):
    failed_parses = FailedParseSerializer(many=True)


class DashboardSerializer(serializers.Serializer):
    total_transactions = serializers.IntegerField()
    total_commission = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_volume_sold = serializers.DecimalField(max_digits=10, decimal_places=2)
    transactions_by_type = serializers.DictField(child=serializers.IntegerField())
