from rest_framework import serializers
from .models import ReconciliationRun, ReconciliationItem


class ReconciliationRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReconciliationRun
        fields = [
            'id', 'period_start', 'period_end', 'status',
            'total_transactions', 'matched_count', 'unmatched_count',
            'discrepancy_count', 'notes', 'created_at', 'completed_at',
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class ReconciliationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReconciliationItem
        fields = [
            'id', 'transaction_id', 'ledger_entry_id', 'status',
            'expected_amount', 'actual_amount', 'difference',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
