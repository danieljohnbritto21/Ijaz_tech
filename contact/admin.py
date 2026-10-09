from django.contrib import admin
from .models import Inquiry


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'service', 'created_at', 'is_read']
    list_filter = ['service', 'is_read', 'created_at']
    search_fields = ['full_name', 'email', 'company', 'requirements']
    readonly_fields = ['created_at']
    list_editable = ['is_read']
