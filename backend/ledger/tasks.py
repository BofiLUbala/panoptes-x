import logging
from celery import shared_task
from django.db.models import Sum
from django.utils import timezone

from transactions.models import Transaction
from .models import SimBalance

logger = logging.getLogger(__name__)


@shared_task
def reconcile_sim_balances(user_id):
    balances = SimBalance.objects.filter(user_id=user_id)
    period_start = timezone.now() - timezone.timedelta(days=1)

    for sim in balances:
        tx_sum = Transaction.objects.filter(
            user_id=user_id,
            transaction_date__gte=period_start,
        ).aggregate(total=Sum('amount'))['total'] or 0

        logger.info('SIM %s balance check: ledger=%s, recent_tx=%s',
                    sim.phone_number, sim.cash_balance, tx_sum)

    return f'Reconciled {balances.count()} SIM balances for user {user_id}'
