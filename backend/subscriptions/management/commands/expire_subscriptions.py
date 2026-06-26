import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from subscriptions.models import DeviceSubscription

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Auto-expire subscriptions that have passed their expiry date'

    def handle(self, *args, **options):
        expired = DeviceSubscription.objects.filter(
            status=DeviceSubscription.Status.ACTIVE,
            expiry_date__lte=timezone.now(),
        )
        count = expired.count()
        expired.update(status=DeviceSubscription.Status.EXPIRED)
        self.stdout.write(self.style.SUCCESS(f'Expired {count} subscription(s)'))
        logger.info('Subscription expiry: %s subscriptions expired', count)
