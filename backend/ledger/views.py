import logging
from decimal import Decimal
from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SimBalance, LedgerEntry
from .serializers import SimBalanceSerializer, LedgerEntrySerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sim_balances(request):
    balances = SimBalance.objects.filter(user=request.user)
    serializer = SimBalanceSerializer(balances, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sim_balance_detail(request, phone_number):
    balance = SimBalance.objects.filter(user=request.user, phone_number=phone_number).first()
    if not balance:
        return Response({'error_code': 'NOT_FOUND', 'message': 'SIM balance not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(SimBalanceSerializer(balance).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_ledger_entries(request):
    entries = LedgerEntry.objects.filter(user=request.user)[:200]
    serializer = LedgerEntrySerializer(entries, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_ledger_entry(request):
    from .serializers import LedgerEntryCreateSerializer
    serializer = LedgerEntryCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    vd = serializer.validated_data
    try:
        sim_balance = SimBalance.objects.get(id=vd['sim_balance_id'], user=request.user)
    except SimBalance.DoesNotExist:
        return Response({'error_code': 'NOT_FOUND', 'message': 'SIM balance not found.'}, status=status.HTTP_404_NOT_FOUND)

    amount = Decimal(str(vd['amount']))
    balance_before = sim_balance.cash_balance

    if vd['entry_type'] in ('credit', 'adjustment'):
        balance_after = balance_before + amount
    else:
        balance_after = balance_before - amount
        if balance_after < 0 and vd['entry_type'] == LedgerEntry.EntryType.DEBIT:
            return Response(
                {'error_code': 'INSUFFICIENT_BALANCE', 'message': 'Insufficient balance for debit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    with db_transaction.atomic():
        entry = LedgerEntry.objects.create(
            sim_balance=sim_balance,
            user=request.user,
            entry_type=vd['entry_type'],
            category=vd['category'],
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            currency=vd.get('currency', 'CDF'),
            reference=vd.get('reference', ''),
            description=vd.get('description', ''),
            transaction_id=vd.get('transaction_id'),
        )

        sim_balance.cash_balance = balance_after
        sim_balance.last_transaction_at = timezone.now()
        sim_balance.save(update_fields=['cash_balance', 'last_transaction_at', 'updated_at'])

    logger.info('Ledger entry created: %s %s for sim %s', entry.entry_type, entry.amount, sim_balance.phone_number)
    return Response(LedgerEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
