from django.urls import path
from .views import request_assistance



urlpatterns = [
    path('request/', request_assistance, name='request_assistance'),
]
