import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from subscriptions.models import DeviceSubscription

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check for expired subscriptions and mark them as expired.'

    def handle(self, *args, **options):
        now = timezone.now()
        expired = DeviceSubscription.objects.filter(
            status=DeviceSubscription.Status.ACTIVE,
            expiry_date__lte=now,
        )
        count = expired.count()
        if count > 0:
            expired.update(status=DeviceSubscription.Status.EXPIRED)
            logger.info(f'Marked {count} subscription(s) as expired.')
            self.stdout.write(self.style.SUCCESS(f'{count} subscription(s) expired.'))
        else:
            self.stdout.write(self.style.SUCCESS('No expired subscriptions found.'))
