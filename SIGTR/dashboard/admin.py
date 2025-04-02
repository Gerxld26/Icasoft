from django.contrib import admin
from .models import Diagnosis

@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'cpu_usage', 'ram_percent', 'disk_percent', 'gpu_name')
    list_filter = ('timestamp', 'user')
    search_fields = ('user__username', 'gpu_name')
