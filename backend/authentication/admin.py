from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['phone', 'username', 'subscription_plan', 'subscription_expiry', 'is_active']
    list_filter = ['subscription_plan', 'is_active']
    search_fields = ['phone', 'username']
