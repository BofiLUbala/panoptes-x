from django.db import models
from django.conf import settings
from django.utils import timezone


class DailyAnalytics(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='daily_analytics',
    )
    date = models.DateField(db_index=True)
    total_transactions = models.IntegerField(default=0)
    total_commission = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_volume_sold = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    transactions_by_type = models.JSONField(default=dict)
    transactions_by_operator = models.JSONField(default=dict)
    parsing_success_count = models.IntegerField(default=0)
    parsing_fail_count = models.IntegerField(default=0)
    parsing_success_rate = models.FloatField(default=0.0)
    active_sims_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'date']]
        ordering = ['-date']
        verbose_name = 'Daily Analytics'
        verbose_name_plural = 'Daily Analytics'

    def __str__(self):
        return f'{self.user.username} — {self.date}'


class RevenueSummary(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='revenue_summaries',
    )
    period = models.CharField(max_length=10, db_index=True)
    period_start = models.DateField()
    period_end = models.DateField()
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_transactions = models.IntegerField(default=0)
    by_operator = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'period']]
        ordering = ['-period']
        verbose_name = 'Revenue Summary'
        verbose_name_plural = 'Revenue Summaries'

    def __str__(self):
        return f'{self.user.username} — {self.period}'
