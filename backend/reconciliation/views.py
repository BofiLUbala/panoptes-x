import logging
from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from transactions.models import Transaction
from ledger.models import LedgerEntry
from .models import ReconciliationRun, ReconciliationItem
from .serializers import ReconciliationRunSerializer, ReconciliationItemSerializer

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_reconciliation(request):
    from django.db.models import Sum

    period_start = request.data.get('period_start')
    period_end = request.data.get('period_end')

    if not period_start or not period_end:
        return Response(
            {'error_code': 'MISSING_PARAM', 'message': 'period_start and period_end required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with db_transaction.atomic():
        run = ReconciliationRun.objects.create(
            user=request.user,
            period_start=period_start,
            period_end=period_end,
            status=ReconciliationRun.Status.IN_PROGRESS,
        )

        transactions = Transaction.objects.filter(
            user=request.user,
            transaction_date__gte=period_start,
            transaction_date__lte=period_end,
        )

        ledger_entries = LedgerEntry.objects.filter(
            user=request.user,
            created_at__gte=period_start,
            created_at__lte=period_end,
        )

        matched = 0
        unmatched = 0
        discrepancies = 0

        for tx in transactions:
            linked = ledger_entries.filter(transaction=tx).first()
            if linked:
                diff = (tx.amount or 0) - linked.amount
                if diff == 0:
                    status_item = ReconciliationItem.Status.MATCHED
                    matched += 1
                else:
                    status_item = ReconciliationItem.Status.DISCREPANCY
                    discrepancies += 1
            else:
                status_item = ReconciliationItem.Status.UNMATCHED
                unmatched += 1

            ReconciliationItem.objects.create(
                run=run,
                transaction=tx,
                ledger_entry=linked,
                status=status_item,
                expected_amount=tx.amount,
                actual_amount=linked.amount if linked else None,
                difference=(tx.amount or 0) - (linked.amount if linked else 0),
            )

        run.total_transactions = transactions.count() + ledger_entries.count()
        run.matched_count = matched
        run.unmatched_count = unmatched
        run.discrepancy_count = discrepancies
        run.status = ReconciliationRun.Status.COMPLETED
        run.completed_at = timezone.now()
        run.save(update_fields=[
            'total_transactions', 'matched_count', 'unmatched_count',
            'discrepancy_count', 'status', 'completed_at',
        ])

    logger.info('Reconciliation %s completed: matched=%s, unmatched=%s, discrepancies=%s',
                run.id, matched, unmatched, discrepancies)
    return Response(ReconciliationRunSerializer(run).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_reconciliations(request):
    runs = ReconciliationRun.objects.filter(user=request.user)[:50]
    serializer = ReconciliationRunSerializer(runs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reconciliation_detail(request, run_id):
    run = ReconciliationRun.objects.filter(id=run_id, user=request.user).first()
    if not run:
        return Response({'error_code': 'NOT_FOUND', 'message': 'Reconciliation not found.'}, status=status.HTTP_404_NOT_FOUND)
    items = ReconciliationItem.objects.filter(run=run)[:500]
    return Response({
        'run': ReconciliationRunSerializer(run).data,
        'items': ReconciliationItemSerializer(items, many=True).data,
    })
