from django.contrib import admin
from .models import Ticket, Tag

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "created_at", "assigned_to")  # Eliminamos "priority" y "due_date"
    search_fields = ("title", "description")
    list_filter = ("status",)  # Eliminamos "priority" y "due_date"
    
    autocomplete_fields = ["assigned_to"]  # Eliminamos "tags"
    
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
