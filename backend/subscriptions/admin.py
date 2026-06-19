from django.contrib import admin
from django.utils import timezone
from .models import Service, DeviceSubscription, Payment, PaymentItem


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'monthly_price', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name']
    list_editable = ['monthly_price', 'is_active']


class PaymentItemInline(admin.TabularInline):
    model = PaymentItem
    extra = 0
    readonly_fields = ['device', 'service', 'amount', 'duration_days']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice_reference', 'user', 'amount', 'network', 'status', 'created_at', 'confirmed_at']
    list_filter = ['status', 'network']
    search_fields = ['invoice_reference', 'transaction_reference', 'user__username']
    readonly_fields = ['invoice_reference', 'created_at', 'confirmed_at']
    inlines = [PaymentItemInline]
    actions = ['confirm_payment', 'cancel_payment']

    def confirm_payment(self, request, queryset):
        from django.utils import timezone
        for payment in queryset.filter(status=Payment.Status.PENDING):
            payment.status = Payment.Status.CONFIRMED
            payment.confirmed_at = timezone.now()
            payment.save(update_fields=['status', 'confirmed_at'])

            items = PaymentItem.objects.filter(payment=payment)
            for item in items:
                existing = DeviceSubscription.objects.filter(
                    device=item.device,
                    service=item.service,
                ).first()
                if existing:
                    if existing.status == DeviceSubscription.Status.ACTIVE and existing.expiry_date > timezone.now():
                        new_expiry = existing.expiry_date + timezone.timedelta(days=item.duration_days)
                    else:
                        new_expiry = timezone.now() + timezone.timedelta(days=item.duration_days)
                    existing.expiry_date = new_expiry
                    existing.status = DeviceSubscription.Status.ACTIVE
                    existing.save(update_fields=['expiry_date', 'status', 'updated_at'])
                else:
                    DeviceSubscription.objects.create(
                        device=item.device,
                        service=item.service,
                        start_date=timezone.now(),
                        expiry_date=timezone.now() + timezone.timedelta(days=item.duration_days),
                        status=DeviceSubscription.Status.ACTIVE,
                    )
        self.message_user(request, f'{queryset.count()} paiement(s) confirmé(s).')
    confirm_payment.short_description = 'Confirmer les paiements sélectionnés'

    def cancel_payment(self, request, queryset):
        updated = queryset.filter(status=Payment.Status.PENDING).update(
            status=Payment.Status.CANCELLED,
        )
        self.message_user(request, f'{updated} paiement(s) annulé(s).')
    cancel_payment.short_description = 'Annuler les paiements sélectionnés'


@admin.register(DeviceSubscription)
class DeviceSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['device', 'service', 'status', 'start_date', 'expiry_date', 'days_remaining']
    list_filter = ['status', 'service']
    search_fields = ['device__phone_number', 'service__name']
    actions = ['suspend_subscription', 'reactivate_subscription', 'extend_subscription']

    def days_remaining(self, obj):
        return obj.days_remaining()
    days_remaining.short_description = 'Jours restants'

    def suspend_subscription(self, request, queryset):
        updated = queryset.filter(status=DeviceSubscription.Status.ACTIVE).update(
            status=DeviceSubscription.Status.SUSPENDED,
        )
        self.message_user(request, f'{updated} abonnement(s) suspendu(s).')
    suspend_subscription.short_description = 'Suspendre les abonnements'

    def reactivate_subscription(self, request, queryset):
        now = timezone.now()
        for sub in queryset.filter(status__in=[DeviceSubscription.Status.EXPIRED, DeviceSubscription.Status.SUSPENDED]):
            sub.status = DeviceSubscription.Status.ACTIVE
            if sub.expiry_date < now:
                sub.expiry_date = now + timezone.timedelta(days=30)
            sub.save(update_fields=['status', 'expiry_date'])
        self.message_user(request, f'{queryset.count()} abonnement(s) réactivé(s).')
    reactivate_subscription.short_description = 'Réactiver les abonnements'

    def extend_subscription(self, request, queryset):
        for sub in queryset.filter(status=DeviceSubscription.Status.ACTIVE):
            sub.expiry_date += timezone.timedelta(days=30)
            sub.save(update_fields=['expiry_date'])
        self.message_user(request, f'{queryset.count()} abonnement(s) prolongé(s) de 30 jours.')
    extend_subscription.short_description = 'Prolonger de 30 jours'


@admin.register(PaymentItem)
class PaymentItemAdmin(admin.ModelAdmin):
    list_display = ['payment', 'device', 'service', 'amount', 'duration_days']
    search_fields = ['device__phone_number', 'payment__invoice_reference']
