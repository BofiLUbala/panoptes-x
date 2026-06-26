from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.list_notifications, name='notification-list'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='notification-mark-read'),
    path('notifications/mark-all-read/', views.mark_all_read, name='notification-mark-all-read'),
    path('notifications/push/register/', views.register_push_device, name='push-device-register'),
    path('notifications/push/unregister/', views.unregister_push_device, name='push-device-unregister'),
]
