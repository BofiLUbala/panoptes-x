from django.urls import path
from . import views

urlpatterns = [
    path('audit/logs/', views.list_audit_logs, name='audit-log-list'),
    path('audit/logs/<int:log_id>/', views.audit_log_detail, name='audit-log-detail'),
    path('audit/admin-logs/', views.admin_audit_logs, name='audit-admin-logs'),
]
