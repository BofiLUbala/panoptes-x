from django.db import models
from django.conf import settings
from django.utils import timezone


class ReconciliationRun(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reconciliation_runs',
    )
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_transactions = models.IntegerField(default=0)
    matched_count = models.IntegerField(default=0)
    unmatched_count = models.IntegerField(default=0)
    discrepancy_count = models.IntegerField(default=0)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Reconciliation {self.id} — {self.period_start.date()} to {self.period_end.date()}'


class ReconciliationItem(models.Model):
    class Status(models.TextChoices):
        MATCHED = 'matched', 'Matched'
        UNMATCHED = 'unmatched', 'Unmatched'
        DISCREPANCY = 'discrepancy', 'Discrepancy'

    run = models.ForeignKey(
        ReconciliationRun, on_delete=models.CASCADE,
        related_name='items',
    )
    transaction = models.ForeignKey(
        'transactions.Transaction', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reconciliation_items',
    )
    ledger_entry = models.ForeignKey(
        'ledger.LedgerEntry', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reconciliation_items',
    )
    status = models.CharField(max_length=20, choices=Status.choices)
    expected_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    difference = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Item {self.id} — {self.status}'
