from rest_framework import serializers
from .models import SimBalance, LedgerEntry


class SimBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimBalance
        fields = [
            'id', 'phone_number', 'operator',
            'cash_balance', 'airtime_balance', 'data_balance', 'data_unit',
            'last_transaction_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'entry_type', 'category', 'amount',
            'balance_before', 'balance_after', 'currency',
            'reference', 'description', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class LedgerEntryCreateSerializer(serializers.Serializer):
    sim_balance_id = serializers.IntegerField()
    entry_type = serializers.ChoiceField(choices=LedgerEntry.EntryType.choices)
    category = serializers.ChoiceField(choices=LedgerEntry.Category.choices)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    currency = serializers.CharField(default='CDF')
    reference = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    transaction_id = serializers.IntegerField(required=False)
