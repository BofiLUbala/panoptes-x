from rest_framework import serializers
from .models import DailyAnalytics, RevenueSummary


class DailyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAnalytics
        fields = [
            'id', 'date', 'total_transactions', 'total_commission',
            'total_volume_sold', 'total_revenue',
            'transactions_by_type', 'transactions_by_operator',
            'parsing_success_count', 'parsing_fail_count',
            'parsing_success_rate', 'active_sims_count',
        ]
        read_only_fields = ['id']


class RevenueSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = RevenueSummary
        fields = [
            'id', 'period', 'period_start', 'period_end',
            'total_revenue', 'total_commission', 'total_transactions',
            'by_operator', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
