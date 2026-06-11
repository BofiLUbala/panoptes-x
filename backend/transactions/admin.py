from django.contrib import admin
from .models import Transaction, FailedParse


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['operator', 'type', 'amount', 'volume', 'volume_unit', 'transaction_date', 'user']
    list_filter = ['operator', 'type', 'transaction_date']
    search_fields = ['raw_sms', 'user__phone']
    date_hierarchy = 'transaction_date'


@admin.register(FailedParse)
class FailedParseAdmin(admin.ModelAdmin):
    list_display = ['operator', 'error', 'created_at', 'user']
    list_filter = ['operator', 'created_at']
    search_fields = ['raw_sms', 'error']
