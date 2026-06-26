from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('transactions.urls')),
    path('api/', include('monitoring.urls')),
    path('api/', include('subscriptions.urls')),
    path('api/', include('ledger.urls')),
    path('api/', include('reconciliation.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('audit.urls')),
    path('api/', include('analytics.urls')),
]
