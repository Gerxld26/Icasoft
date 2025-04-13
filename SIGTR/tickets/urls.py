# En tu archivo urls.py de la aplicación tickets

from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.request_assistance, name='request_assistance'),
    path('get_nearby_technicians/', views.get_nearby_technicians_view, name='get_nearby_technicians'),
    path('assign_technician/<int:ticket_id>/', views.assign_selected_technician, name='assign_technician'),

]