from django.urls import path
from . import views

urlpatterns = [
    path('monitoring/register-device/', views.RegisterDeviceView.as_view(), name='register-device'),
    path('monitoring/authorize-watcher/', views.AuthorizeWatcherView.as_view(), name='authorize-watcher'),
    path('monitoring/confirm-watcher/', views.ConfirmWatcherView.as_view(), name='confirm-watcher'),
    path('monitoring/revoke-watcher/', views.RevokeWatcherView.as_view(), name='revoke-watcher'),
    path('monitoring/watch-relations/', views.WatchRelationsView.as_view(), name='watch-relations'),
    path('monitoring/forward-sms/', views.ForwardSmsView.as_view(), name='forward-sms'),
    path('monitoring/get-sms/', views.GetSmsView.as_view(), name='get-sms'),
]
