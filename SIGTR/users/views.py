from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from .forms import CustomUserCreationForm
from django.contrib.auth import logout
import logging
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.middleware.csrf import get_token

logger = logging.getLogger(__name__)
def client_dashboard_inicio(request):
    return render(request, 'users/vistaInicial.html')

@require_http_methods(["GET", "POST"])
def get_csrf_token(request):
    """
    Endpoint para obtener el token CSRF
    Soporta tanto GET como POST
    """
    return JsonResponse({
        'csrfToken': get_token(request)
    })

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')  # Puede ser correo o nombre de usuario
        password = request.POST.get('password')

        # Autentica al usuario
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            # Redirigir según el rol del usuario
            if user.role == 'admin':
                return redirect('admin_inicio')
            elif user.role == 'tech':
                return redirect('tech_dashboard')
            elif user.role == 'client':
                return redirect('client_dashboard')
        else:
            messages.error(request, "Usuario o contraseña incorrectos.")

    return render(request, 'users/login.html')

def user_register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Registro exitoso. Ahora puedes iniciar sesión.")
            return redirect('users:login')
        else:
            messages.error(request, "Hubo un error en el formulario. Por favor, corrige los errores.")
    else:
        form = CustomUserCreationForm()
    return render(request, 'users/register.html', {'form': form})

def user_logout(request):
    """Cerrar sesión y redirigir al login."""
    logout(request)
    return redirect('users:client_dashboard_inicio')


