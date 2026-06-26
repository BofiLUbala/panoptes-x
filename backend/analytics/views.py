import logging
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from transactions.models import Transaction, FailedParse
from ledger.models import SimBalance
from .models import DailyAnalytics, RevenueSummary
from .serializers import DailyAnalyticsSerializer, RevenueSummarySerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_analytics(request):
    today = timezone.now().date()
    days = int(request.query_params.get('days', 30))

    period_start = today - timedelta(days=days)

    transactions = Transaction.objects.filter(
        user=request.user,
        transaction_date__date__gte=period_start,
    )

    totals = transactions.aggregate(
        total_count=Count('id'),
        total_commission=Sum('commission'),
    )

    by_operator = list(
        transactions.values('operator')
        .annotate(
            count=Count('id'),
            total_commission=Sum('commission'),
        )
    )

    by_type = list(
        transactions.values('type')
        .annotate(
            count=Count('id'),
        )
    )

    recent_transactions = transactions.order_by('-transaction_date')[:20]
    from transactions.serializers import TransactionSerializer
    recent_data = TransactionSerializer(recent_transactions, many=True).data

    parsing_ratio = FailedParse.objects.filter(
        user=request.user,
        created_at__date__gte=period_start,
    ).count()

    total_parsing = transactions.count() + parsing_ratio
    success_rate = round((transactions.count() / total_parsing * 100), 1) if total_parsing > 0 else 0

    sim_count = SimBalance.objects.filter(user=request.user).count()

    daily_data = DailyAnalytics.objects.filter(
        user=request.user,
        date__gte=period_start,
    ).order_by('date')

    return Response({
        'period': {
            'start': period_start.isoformat(),
            'end': today.isoformat(),
            'days': days,
        },
        'summary': {
            'total_transactions': totals['total_count'] or 0,
            'total_commission': float(totals['total_commission'] or 0),
            'parsing_success_rate': success_rate,
            'active_sims': sim_count,
        },
        'by_operator': by_operator,
        'by_type': by_type,
        'recent_transactions': recent_data,
        'daily_analytics': DailyAnalyticsSerializer(daily_data, many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_analytics(request):
    months = int(request.query_params.get('months', 6))
    today = timezone.now().date()
    period_start = today - timedelta(days=months * 30)

    transactions = Transaction.objects.filter(
        user=request.user,
        transaction_date__date__gte=period_start,
    )

    total_revenue = Decimal('0')
    for tx in transactions:
        total_revenue += (tx.commission or 0) + (tx.fee or 0)

    monthly_data = []
    current = period_start
    while current <= today:
        month_end = current + timedelta(days=30)
        month_txs = transactions.filter(
            transaction_date__date__gte=current,
            transaction_date__date__lt=month_end,
        )
        monthly_data.append({
            'month': current.strftime('%Y-%m'),
            'transactions': month_txs.count(),
            'commission': float(month_txs.aggregate(total=Sum('commission'))['total'] or 0),
        })
        current = month_end

    return Response({
        'total_revenue': float(total_revenue),
        'total_transactions': transactions.count(),
        'monthly_breakdown': monthly_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sim_analytics(request):
    balances = SimBalance.objects.filter(user=request.user)
    data = []
    for sim in balances:
        tx_count = Transaction.objects.filter(user=request.user).count()
        data.append({
            'phone_number': sim.phone_number,
            'operator': sim.operator,
            'cash_balance': float(sim.cash_balance),
            'airtime_balance': float(sim.airtime_balance),
            'data_balance': float(sim.data_balance),
            'last_transaction': sim.last_transaction_at.isoformat() if sim.last_transaction_at else None,
            'estimated_revenue': float(sim.cash_balance * Decimal('0.05')),
        })

    return Response({
        'total_sims': len(data),
        'total_cash_balance': sum(d['cash_balance'] for d in data),
        'sims': data,
    })
