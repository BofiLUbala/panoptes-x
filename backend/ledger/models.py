from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal


class SimBalance(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='sim_balances',
    )
    phone_number = models.CharField(max_length=20, db_index=True)
    operator = models.CharField(max_length=20, db_index=True)
    cash_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    airtime_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    data_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    data_unit = models.CharField(max_length=10, default='MB')
    last_transaction_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['user', 'phone_number']]
        ordering = ['-updated_at']
        verbose_name = 'SIM Balance'
        verbose_name_plural = 'SIM Balances'

    def __str__(self):
        return f'{self.phone_number} ({self.operator}) — Cash: {self.cash_balance}'


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        CREDIT = 'credit', 'Credit'
        DEBIT = 'debit', 'Debit'
        ADJUSTMENT = 'adjustment', 'Adjustment'

    class Category(models.TextChoices):
        MOBILE_MONEY_DEPOSIT = 'mm_deposit', 'Mobile Money Deposit'
        MOBILE_MONEY_WITHDRAWAL = 'mm_withdrawal', 'Mobile Money Withdrawal'
        MOBILE_MONEY_TRANSFER = 'mm_transfer', 'Mobile Money Transfer'
        AIRTIME_SALE = 'airtime_sale', 'Airtime Sale'
        DATA_SALE = 'data_sale', 'Data Bundle Sale'
        BILL_PAYMENT = 'bill_payment', 'Bill Payment'
        COMMISSION = 'commission', 'Commission'
        FEE = 'fee', 'Fee'
        SUBSCRIPTION = 'subscription', 'Subscription Payment'
        MANUAL_ADJUSTMENT = 'manual_adjustment', 'Manual Adjustment'

    sim_balance = models.ForeignKey(
        SimBalance, on_delete=models.CASCADE,
        related_name='ledger_entries',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='ledger_entries',
    )
    entry_type = models.CharField(max_length=20, choices=EntryType.choices)
    category = models.CharField(max_length=30, choices=Category.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=10, default='CDF')
    reference = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    description = models.TextField(blank=True, default='')
    transaction = models.ForeignKey(
        'transactions.Transaction', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ledger_entries',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['sim_balance', 'created_at']),
        ]
        verbose_name = 'Ledger Entry'
        verbose_name_plural = 'Ledger Entries'

    def __str__(self):
        return f'{self.entry_type} {self.amount} — {self.category}'
