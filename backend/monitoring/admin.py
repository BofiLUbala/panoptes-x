from django.contrib import admin
from .models import Device, WatchRelation, ForwardedSms


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'user', 'created_at']
    search_fields = ['phone_number']
    readonly_fields = ['device_secret', 'created_at', 'updated_at']


@admin.register(WatchRelation)
class WatchRelationAdmin(admin.ModelAdmin):
    list_display = ['watcher', 'target', 'status', 'created_at', 'confirmed_at']
    list_filter = ['status']
    search_fields = ['watcher__phone_number', 'target__phone_number']


@admin.register(ForwardedSms)
class ForwardedSmsAdmin(admin.ModelAdmin):
    list_display = ['sender', 'target_device', 'received_at', 'created_at']
    search_fields = ['sender', 'message', 'target_device__phone_number']
    readonly_fields = ['created_at']
