from django.urls import path
from .views import user_login, user_register, user_logout, get_csrf_token

app_name = "users"  

urlpatterns = [
    path('login/', user_login, name='login'), 
    path('register/', user_register, name='register'),
    path('logout/', user_logout, name='logout'),
    path('get-csrf-token/', get_csrf_token, name='get_csrf_token'),
]
