from django.urls import path
from .views import user_login, user_register, user_logout, get_csrf_token, client_dashboard_inicio

app_name = "users"  

urlpatterns = [
    path('',client_dashboard_inicio,name='client_dashboard_inicio'),
    path('login/', user_login, name='login'), 
    path('register/', user_register, name='register'),
    path('logout/', user_logout, name='logout'),
    path('get-csrf-token/', get_csrf_token, name='get_csrf_token'),
]
