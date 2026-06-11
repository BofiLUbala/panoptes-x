from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='auth-register'),
    path('activate/', views.activate, name='auth-activate'),
    path('verify-otp/', views.verify_otp, name='auth-verify-otp'),
    path('login/', views.login, name='auth-login'),
    path('profile/', views.profile, name='auth-profile'),
]
