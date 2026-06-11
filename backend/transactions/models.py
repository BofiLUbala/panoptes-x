from django.db import models
from django.conf import settings


class Transaction(models.Model):
    class Operator(models.TextChoices):
        AIRTEL = 'AIRTEL', 'Airtel'
        ORANGE = 'ORANGE', 'Orange'
        VODACOM = 'VODACOM', 'Vodacom'
        AFRICELL = 'AFRICELL', 'Africell'

    class TransactionType(models.TextChoices):
        MOBILE_MONEY = 'MOBILE_MONEY', 'Mobile Money'
        AIRTIME = 'AIRTIME', 'Airtime'
        BUNDLE = 'BUNDLE', 'Bundle'
        BILL_PAYMENT = 'BILL_PAYMENT', 'Bill Payment'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    operator = models.CharField(max_length=20, choices=Operator.choices)
    type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='CDF')
    volume = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    volume_unit = models.CharField(max_length=10, null=True, blank=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    commission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    raw_sms = models.TextField()
    transaction_date = models.DateTimeField()
    synced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-transaction_date']

    def __str__(self):
        return f'{self.operator} | {self.type} | {self.amount or self.volume} {self.volume_unit or self.currency}'


class FailedParse(models.Model):
    class Operator(models.TextChoices):
        AIRTEL = 'AIRTEL', 'Airtel'
        ORANGE = 'ORANGE', 'Orange'
        VODACOM = 'VODACOM', 'Vodacom'
        AFRICELL = 'AFRICELL', 'Africell'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='failed_parses',
    )
    raw_sms = models.TextField()
    operator = models.CharField(max_length=20, choices=Operator.choices)
    error = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Failed parse: {self.operator} - {self.created_at}'
