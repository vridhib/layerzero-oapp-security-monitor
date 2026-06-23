from django.contrib import admin
from .models import BridgeContract, DVNConfig, MonitoredOApp, UserAlertChannel, Report


@admin.register(BridgeContract)
class BridgeContractAdmin(admin.ModelAdmin):
    list_display = ('address', 'chain', 'name', 'created_at')
    search_fields = ('address', 'name', 'chain')

@admin.register(DVNConfig)
class DVNAdmin(admin.ModelAdmin):
    list_display = ('contract', 'required_dvn_count', 'is_healthy', 'detected_at')
    list_filter = ('is_healthy',)
    search_fields = ('contract__address', 'contract__name')

@admin.register(MonitoredOApp)
class MonitoredOAppAdmin(admin.ModelAdmin):
    list_display = ('user', 'contract', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('user__username', 'contract__address')

@admin.register(UserAlertChannel)
class UserAlertChannelAdmin(admin.ModelAdmin):
    list_display = ('user', 'channel_type', 'identifier', 'is_verified', 'created_at')
    list_filter = ('channel_type', 'is_verified')
    search_fields = ('user__username', 'identifier')

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('generated_at', 'data', 'html_content', 'pdf_file')
    list_filter = ('generated_at', 'id')
    search_fields = ('generated_at', 'id')