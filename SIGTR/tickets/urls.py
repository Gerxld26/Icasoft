from django.urls import path
from . import views

urlpatterns = [
    path('asistencia/', views.asistencia, name='asistencia'),
    path('get_nearby_technicians/', views.get_nearby_technicians_view, name='get_nearby_technicians'),
    path('assign_technician/<int:ticket_id>/', views.assign_selected_technician, name='assign_technician'),

]