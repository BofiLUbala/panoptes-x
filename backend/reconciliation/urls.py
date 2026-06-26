from django.urls import path
from . import views

urlpatterns = [
    path('reconciliation/start/', views.start_reconciliation, name='reconciliation-start'),
    path('reconciliation/runs/', views.list_reconciliations, name='reconciliation-list'),
    path('reconciliation/runs/<int:run_id>/', views.reconciliation_detail, name='reconciliation-detail'),
]
