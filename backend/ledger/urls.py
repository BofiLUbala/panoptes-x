from django.urls import path
from . import views

urlpatterns = [
    path('ledger/balances/', views.list_sim_balances, name='ledger-balances'),
    path('ledger/balances/<str:phone_number>/', views.sim_balance_detail, name='ledger-balance-detail'),
    path('ledger/entries/', views.list_ledger_entries, name='ledger-entries'),
    path('ledger/entries/create/', views.record_ledger_entry, name='ledger-entry-create'),
]
