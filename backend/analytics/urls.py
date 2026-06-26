from django.urls import path
from . import views

urlpatterns = [
    path('analytics/dashboard/', views.dashboard_analytics, name='analytics-dashboard'),
    path('analytics/revenue/', views.revenue_analytics, name='analytics-revenue'),
    path('analytics/sims/', views.sim_analytics, name='analytics-sims'),
]
