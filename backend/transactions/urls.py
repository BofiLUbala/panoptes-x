from django.urls import path
from . import views

urlpatterns = [
    path('transactions/sync/', views.TransactionSyncView.as_view(), name='transaction-sync'),
    path('transactions/failed-parses/', views.FailedParseSyncView.as_view(), name='failed-parse-sync'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]
