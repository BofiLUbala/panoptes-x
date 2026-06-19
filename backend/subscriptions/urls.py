from django.urls import path
from . import views

urlpatterns = [
    path('services/', views.service_list, name='service-list'),
    path('payments/create/', views.create_payment, name='payment-create'),
    path('payments/confirm/', views.confirm_payment, name='payment-confirm'),
    path('payments/', views.list_payments, name='payment-list'),
    path('subscriptions/', views.list_subscriptions, name='subscription-list'),
]
