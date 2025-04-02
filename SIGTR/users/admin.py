from django.contrib import admin
from .models import User, UserProfile, Ticket

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'username')
    list_filter = ('role', 'is_active', 'is_staff')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'phone_number', 'address')
    search_fields = ('user__username', 'full_name')

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'priority', 'status', 'client', 'assigned_to', 'created_at')
    search_fields = ('title', 'client__email', 'assigned_to__email')
    list_filter = ('priority', 'status')
