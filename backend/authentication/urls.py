from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

urlpatterns = [
    path('register/', views.register, name='auth-register'),
    path('activate/', views.activate, name='auth-activate'),
    path('verify-otp/', views.verify_otp, name='auth-verify-otp'),
    path('login/', views.login, name='auth-login'),
    path('logout/', views.logout, name='auth-logout'),
    path('profile/', views.profile, name='auth-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
]
