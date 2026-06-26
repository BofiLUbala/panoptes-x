import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from monitoring.models import ForwardedSms
from audit.models import AuditLog

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Cleanup old data (SMS, audit logs)'

    def add_arguments(self, parser):
        parser.add_argument('--sms-days', type=int, default=30, help='Retention days for SMS')
        parser.add_argument('--audit-days', type=int, default=365, help='Retention days for audit logs')

    def handle(self, *args, **options):
        sms_cutoff = timezone.now() - timedelta(days=options['sms_days'])
        sms_deleted, _ = ForwardedSms.objects.filter(received_at__lt=sms_cutoff).delete()
        self.stdout.write(f'Deleted {sms_deleted} old SMS records')

        audit_cutoff = timezone.now() - timedelta(days=options['audit_days'])
        audit_deleted, _ = AuditLog.objects.filter(created_at__lt=audit_cutoff).delete()
        self.stdout.write(f'Deleted {audit_deleted} old audit logs')

        self.stdout.write(self.style.SUCCESS('Cleanup completed'))
