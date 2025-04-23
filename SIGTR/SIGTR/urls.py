from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('users.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('tickets/', include('tickets.urls')),  
]
