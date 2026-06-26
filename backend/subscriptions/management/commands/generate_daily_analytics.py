import logging
from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from django.utils import timezone

from transactions.models import Transaction, FailedParse
from ledger.models import SimBalance
from analytics.models import DailyAnalytics

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Generate daily analytics for all users'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Date (YYYY-MM-DD) to generate for')

    def handle(self, *args, **options):
        target_date = date.today() - timedelta(days=1)
        if options.get('date'):
            target_date = date.fromisoformat(options['date'])

        users = User.objects.filter(is_active=True)
        for user in users:
            day_start = timezone.make_aware(
                __import__('datetime').datetime.combine(target_date, __import__('datetime').time.min)
            )
            day_end = timezone.make_aware(
                __import__('datetime').datetime.combine(target_date, __import__('datetime').time.max)
            )

            transactions = Transaction.objects.filter(
                user=user,
                transaction_date__gte=day_start,
                transaction_date__lte=day_end,
            )

            totals = transactions.aggregate(
                count=Count('id'),
                commission=Sum('commission'),
                volume=Sum('volume'),
            )

            by_type = {}
            for tx in transactions.values('type').annotate(count=Count('id')):
                by_type[tx['type']] = tx['count']

            by_operator = {}
            for tx in transactions.values('operator').annotate(count=Count('id')):
                by_operator[tx['operator']] = tx['count']

            failed_count = FailedParse.objects.filter(
                user=user,
                created_at__gte=day_start,
                created_at__lte=day_end,
            ).count()

            success_count = totals['count'] or 0
            total_parsing = success_count + failed_count
            success_rate = round((success_count / total_parsing * 100), 1) if total_parsing > 0 else 0

            sim_count = SimBalance.objects.filter(user=user).count()

            total_revenue = Decimal('0')
            for tx in transactions:
                total_revenue += (tx.commission or 0) + (tx.fee or 0)

            DailyAnalytics.objects.update_or_create(
                user=user,
                date=target_date,
                defaults={
                    'total_transactions': success_count,
                    'total_commission': totals['commission'] or 0,
                    'total_volume_sold': totals['volume'] or 0,
                    'total_revenue': total_revenue,
                    'transactions_by_type': by_type,
                    'transactions_by_operator': by_operator,
                    'parsing_success_count': success_count,
                    'parsing_fail_count': failed_count,
                    'parsing_success_rate': success_rate,
                    'active_sims_count': sim_count,
                },
            )

            self.stdout.write(f'Analytics for {user.username} on {target_date}: {success_count} transactions')

        self.stdout.write(self.style.SUCCESS(f'Daily analytics generated for {target_date}'))
