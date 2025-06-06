from django.urls import path
from . import views

urlpatterns = [
    path('asistencia/', views.asistencia, name='asistencia'),
    path('tipo_asistencia/',views.tipo_asistencia, name='tipo_asistencia' ),
    path('listar_tecnicos_cercanos/', views.listar_tecnicos_cercanos,name='listar_tecnicos_cercanos' ),
]