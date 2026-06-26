from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        READ = 'read', 'Read'
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        PAYMENT = 'payment', 'Payment'
        SUBSCRIPTION = 'subscription', 'Subscription'
        RECONCILIATION = 'reconciliation', 'Reconciliation'
        LEDGER_ENTRY = 'ledger_entry', 'Ledger Entry'
        DEVICE_ACTION = 'device_action', 'Device Action'
        ADMIN_ACTION = 'admin_action', 'Admin Action'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='audit_logs',
    )
    action = models.CharField(max_length=30, choices=Action.choices, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    resource_id = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(blank=True, default='')
    details = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f'{self.action} {self.resource_type}({self.resource_id}) by user {self.user_id}'
