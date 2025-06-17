# Standard library
import os
import json
import time
import psutil
import shutil
import random
import logging
import tempfile
import platform
import threading
import subprocess
import traceback
import GPUtil
import cpuinfo
import speedtest
import requests
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.safestring import mark_safe
from django.utils.timezone import now
from django.middleware.csrf import get_token
from django.templatetags.static import static

# Django HTTP and routing
from django.http import (
    JsonResponse,
    HttpResponse,
    HttpResponseForbidden,
    HttpResponseBadRequest,
    FileResponse,
    Http404,
)
from django.shortcuts import (
    render,
    redirect,
    get_object_or_404,
)
from django.views.decorators.http import (
    require_GET,
    require_POST,
    require_http_methods,
)
from django.views.decorators.csrf import csrf_exempt

# Django auth
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.exceptions import PermissionDenied

# Django ORM
from django.db.models import (
    Q,
    F,
    Func,
    Value,
    Count,
    Sum,
)
from django.db.models.functions import (
    TruncMonth,
    ExtractMonth,
)

# Django pagination
from django.core.paginator import (
    Paginator,
    EmptyPage,
    PageNotAnInteger,
)

# Third-party
import GPUtil
import cpuinfo
import speedtest
from openai import OpenAI
from dotenv import load_dotenv
from virustotal_python import Virustotal

# Local apps (models & forms)
from users.models import User, UserProfile, Categoria, Producto, RegistroVenta, DetalleVenta, Carrito
from tickets.models import Ticket
from .models import (
    Diagnosis,
    DiagnosticReport,
    SystemComponent,
    DriverInfo,
    DiagnosticIssue,
    DiagnosticScenario,
    ScenarioRun,
    DiagnosticFile,
    LearningVideo,
)
from .forms import (
    CreateTechForm,
    CreateAdminForm,
    ProductoForm,
    CategoriaForm,
    CustomUserCreationForm,
    UserProfileForm,
    TicketStatusForm,
    LearningVideoForm,
)
from .utils import perform_speed_test

from .models import (
    Diagnosis, DiagnosticReport, SystemComponent, DriverInfo, 
    DiagnosticIssue, DiagnosticScenario, ScenarioRun
)

load_dotenv()



logger = logging.getLogger(__name__)

try:
    import GPUtil
except ImportError as e:
    logger.info("GPUtil no está instalado. Se omitirá la información de la GPU.")
except Exception as e:
    logger.error(f"Error al cargar GPUtil: {str(e)}")

GEONAMES_BASE_URL = "https://secure.geonames.org"

GEONAMES_USERNAME = "Gerald26"  

logging.basicConfig(level=logging.DEBUG)

# Role-based access checkers
def is_admin(user):
    return user.role == 'admin'

def is_technician(user):
    return user.role == 'tech'  

def is_client(user):
    return user.role == 'client'

def base_context_processor(request):
    """
    Agrega información adicional al contexto global.
    """
    monitoring_urls = ['dashboard:client_monitoring_cpu', 'dashboard:client_monitoring_ram', 'dashboard:client_monitoring_disk', 'dashboard:client_monitoring_gpu']
    return {'monitoring_urls': monitoring_urls}

# Vista de inicio del cliente
# Decorador para inicializar COM correctamente en hilos de Windows
def ensure_com_initialized(func):
    def wrapper(*args, **kwargs):
        import pythoncom
        pythoncom.CoInitialize()
        try:
            return func(*args, **kwargs)
        finally:
            pythoncom.CoUninitialize()
    return wrapper

# Vista para mantenimiento
@login_required
@user_passes_test(is_client)
def client_maintenance(request):
    return render(request, "dashboard/client/maintenance.html")


# Vista para recomendaciones de software
@login_required
@user_passes_test(is_client)
def client_recommendations(request):
    return render(request, "dashboard/client/recommendations.html")


@csrf_exempt
@login_required
@user_passes_test(is_client)
def speech_to_text(request):
    if request.method == 'POST':
        try:
            return JsonResponse({
                'status': 'success',
                'message': 'Transcripción recibida correctamente'
            })
        except Exception as e:
            logger.error(f"Error en speech_to_text: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error al procesar la transcripción: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Método no permitido'
    }, status=405)


import speech_recognition as sr

@csrf_exempt
@login_required
@user_passes_test(is_client)
def transcribe_audio(request):
    if request.method == 'POST':
        try:
            if 'audio_data' in request.POST:
                audio_data = request.POST.get('audio_data')
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Transcripción simulada',
                    'text': 'Texto transcrito desde el audio'
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'No se recibieron datos de audio',
                    'text': ''
                }, status=400)
        except Exception as e:
            logger.error(f"Error general: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error al procesar el audio: {str(e)}',
                'text': ''
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Método incorrecto',
        'text': ''
    }, status=405)
    
# View del carrito de compras

@login_required
@user_passes_test(is_admin)
def product_list(request):
    productos = Producto.objects.all().order_by('-fechaCreacionProducto')
    
    query = request.GET.get('q')
    if query:
        productos = productos.filter(nombreProducto__icontains=query)
    
    categoria_id = request.GET.get('categoria')
    if categoria_id:
        productos = productos.filter(idCategoria=categoria_id)
    
    paginator = Paginator(productos, 10)
    page = request.GET.get('page')
    productos_paginados = paginator.get_page(page)
    
    categorias = Categoria.objects.all()
    
    context = {
        'productos': productos_paginados,
        'categorias': categorias,
        'query': query,
        'categoria_seleccionada': categoria_id
    }
    
    return render(request, 'dashboard/admin/product_list.html', context)

@login_required
@user_passes_test(is_admin)
def product_create(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Producto creado exitosamente.')
            return redirect('product_list')
    else:
        form = ProductoForm()
    
    context = {
        'form': form,
        'title': 'Crear Producto'
    }
    
    return render(request, 'dashboard/admin/product_form.html', context)

@login_required
@user_passes_test(is_admin)
def product_update(request, pk):
    producto = get_object_or_404(Producto, idProducto=pk)
    
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(request, 'Producto actualizado exitosamente.')
            return redirect('product_list')
    else:
        form = ProductoForm(instance=producto)
    
    context = {
        'form': form,
        'title': 'Editar Producto',
        'producto': producto
    }
    
    return render(request, 'dashboard/admin/product_form.html', context)

@login_required
@user_passes_test(is_admin)
def product_delete(request, pk):
    producto = get_object_or_404(Producto, idProducto=pk)
    
    if request.method == 'POST':
        producto.delete()
        messages.success(request, 'Producto eliminado exitosamente.')
        return redirect('product_list')
    
    context = {
        'producto': producto
    }
    
    return render(request, 'dashboard/admin/product_confirm_delete.html', context)

@login_required
@user_passes_test(is_admin)
def category_list(request):
    categorias = Categoria.objects.all().filter(estadoCategoria=True).order_by('-fechaCreacionCategoria')
    
    query = request.GET.get('q')
    if query:
        categorias = categorias.filter(nombreCategoria__icontains=query)
    
    paginator = Paginator(categorias, 10)
    page = request.GET.get('page')
    categorias_paginadas = paginator.get_page(page)
    form = CategoriaForm()
    context = {
        'categorias': categorias_paginadas,
        'query': query,
        'form': form,
    }
    
    return render(request, 'dashboard/admin/read_category.html', context)

@login_required
@user_passes_test(is_admin)
def category_create(request):
    if request.method == 'POST':
        form = CategoriaForm(request.POST)
        if form.is_valid():
            form.save()

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'message': 'Categoría creada exitosamente.'})
            else:
                messages.success(request, 'Categoría creada exitosamente.')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                errors = form.errors.as_json()
                return JsonResponse({'errors': errors}, status=400)
            else:
                messages.error(request, 'Hubo errores en el formulario. Corrígelos e intenta de nuevo.')
                return redirect('read_category')

    return redirect('read_category')

@login_required
@user_passes_test(is_admin)
def category_update(request, pk):
    categoria = get_object_or_404(Categoria, idCategoria=pk)
    
    if request.method == 'POST':
        form = CategoriaForm(request.POST, instance=categoria)
        if form.is_valid():
            form.save()
            messages.success(request, 'Categoría actualizada exitosamente.')
            return redirect('read_category')
    else:
        form = CategoriaForm(instance=categoria)
    
    context = {
        'form': form,
        'title': 'Editar Categoría',
        'categoria': categoria
    }
    
    return render(request, 'dashboard/admin/read_category.html', context)

@login_required
@user_passes_test(is_admin)
def category_delete(request, pk):
    categoria = get_object_or_404(Categoria, idCategoria=pk)
    
    if categoria.estadoCategoria:  # Solo desactiva si está activa
        categoria.estadoCategoria = False
        categoria.save()
        return JsonResponse({'status': 'success', 'message': 'Categoría desactivada exitosamente.'})
    else:
        return JsonResponse({'status': 'warning', 'message': 'La categoría ya está desactivada.'})

@login_required
@user_passes_test(is_admin)
def sales_report(request):
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    ventas = RegistroVenta.objects.all().order_by('-fechaCreacionVenta')
    
    if start_date_str and end_date_str:
        try:
            start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
            end_date = datetime.datetime.combine(end_date, datetime.time.max)
            
            ventas = ventas.filter(fechaCreacionVenta__range=[start_date, end_date])
        except ValueError:
            messages.error(request, 'Formato de fecha incorrecto. Use YYYY-MM-DD.')
    
    total_ventas = ventas.aggregate(total=Sum('totalVenta'))['total'] or 0
    num_ventas = ventas.count()
    
    productos_mas_vendidos = DetalleVenta.objects.values(
        'idProducto__nombreProducto'
    ).annotate(
        total_vendido=Sum('cantidad')
    ).order_by('-total_vendido')[:5]
    
    ventas_por_categoria = DetalleVenta.objects.values(
        'idProducto__idCategoria__nombreCategoria'
    ).annotate(
        total=Sum('precioTotalProducto')
    ).order_by('-total')
    
    context = {
        'ventas': ventas[:10], 
        'total_ventas': total_ventas,
        'num_ventas': num_ventas,
        'productos_mas_vendidos': productos_mas_vendidos,
        'ventas_por_categoria': ventas_por_categoria,
        'start_date': start_date_str,
        'end_date': end_date_str
    }
    
    return render(request, 'dashboard/admin/sales_report.html', context)

#Views de recomendacion
@login_required
@user_passes_test(is_client)
def client_recommendations(request):
    security_products = Producto.objects.filter(
        idCategoria__nombreCategoria__icontains='seguridad', 
        estadoProducto=True
    ).order_by('-fechaCreacionProducto')[:3]
    
    microsoft_products = Producto.objects.filter(
        idCategoria__nombreCategoria__icontains='microsoft', 
        estadoProducto=True
    ).order_by('-fechaCreacionProducto')[:3]
    
    if security_products.count() < 3:
        other_security = Producto.objects.filter(
            estadoProducto=True
        ).exclude(id__in=security_products.values_list('id', flat=True))[:3-security_products.count()]
        security_products = list(security_products) + list(other_security)
    
    if microsoft_products.count() < 3:
        other_microsoft = Producto.objects.filter(
            estadoProducto=True
        ).exclude(id__in=microsoft_products.values_list('id', flat=True))[:3-microsoft_products.count()]
        microsoft_products = list(microsoft_products) + list(other_microsoft)
    
    context = {
        'security_products': security_products,
        'microsoft_products': microsoft_products
    }
    
    return render(request, 'dashboard/client/client_recommendations.html', context)

@login_required
def add_to_cart(request, producto_id):
    if request.method == 'POST':
        producto = get_object_or_404(Producto, idProducto=producto_id)
        cantidad = int(request.POST.get('cantidad', 1))
        
        carrito, created = Carrito.objects.get_or_create(
            idUsuario=request.user,
            idProducto=producto,
            defaults={
                'cantidadSeleccionada': cantidad,
                'precioConImpuesto': producto.precioVenta * cantidad
            }
        )
        
        if not created:
            carrito.cantidadSeleccionada += cantidad
            carrito.precioConImpuesto = producto.precioVenta * carrito.cantidadSeleccionada
            carrito.save()
        
        return JsonResponse({'status': 'success', 'message': 'Producto agregado al carrito'})
    
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

@login_required
def client_recommendations_api(request):
    security_products = Producto.objects.filter(
        idCategoria__nombreCategoria__icontains='seguridad', 
        estadoProducto=True
    ).order_by('-fechaCreacionProducto')[:3]
    
    microsoft_products = Producto.objects.filter(
        idCategoria__nombreCategoria__icontains='microsoft', 
        estadoProducto=True
    ).order_by('-fechaCreacionProducto')[:3]
    
    if security_products.count() < 3:
        more_products = Producto.objects.filter(
            estadoProducto=True
        ).exclude(idProducto__in=[p.idProducto for p in security_products])[:3-security_products.count()]
        security_products = list(security_products) + list(more_products)
    
    if microsoft_products.count() < 3:
        more_products = Producto.objects.filter(
            estadoProducto=True
        ).exclude(idProducto__in=[p.idProducto for p in microsoft_products])[:3-microsoft_products.count()]
        microsoft_products = list(microsoft_products) + list(more_products)
    
    security_data = []
    for producto in security_products:
        security_data.append({
            'id': producto.idProducto,
            'nombre': producto.nombreProducto,
            'precio': float(producto.precioVenta),
            'imagen': producto.imagenProducto.url if producto.imagenProducto else static('dashboard/img/antivirus.webp')
        })
    
    microsoft_data = []
    for producto in microsoft_products:
        microsoft_data.append({
            'id': producto.idProducto,
            'nombre': producto.nombreProducto,
            'precio': float(producto.precioVenta),
            'imagen': producto.imagenProducto.url if producto.imagenProducto else static('dashboard/img/windows.webp')
        })
    
    data = {
        'security': security_data,
        'microsoft': microsoft_data
    }
    
    return JsonResponse(data)

#View del wifi
import socket

def check_internet_connection(host="8.8.8.8", port=53, timeout=3):
    try:
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True
    except (socket.error, socket.timeout):
        return False

def check_speedtest_servers(max_attempts=3):
    st = speedtest.Speedtest()
    
    for attempt in range(max_attempts):
        try:
            st.get_servers()
            st.get_best_server()
            return True
        except Exception as e:
            logger.warning(f"Intento {attempt + 1} de conexión a servidores fallido: {str(e)}")
            if attempt == max_attempts - 1:
                return False
            


@login_required
@require_http_methods(["GET", "POST"])
def speed_test(request):
    try:
        if not check_internet_connection():
            logger.warning("No hay conexión a internet")
            return JsonResponse({
                'status': 'error',
                'type': 'no_internet',
                'message': 'No se detecta conexión a internet'
            }, status=503)
        
        if not check_speedtest_servers():
            logger.error("No se puede conectar a servidores de speedtest")
            return JsonResponse({
                'status': 'error',
                'type': 'speedtest_server_error',
                'message': 'No se pueden encontrar servidores de speedtest disponibles'
            }, status=503)
        
        st = speedtest.Speedtest()
        
        st.get_best_server()
        
        logger.info(f"Iniciando prueba de velocidad para usuario {request.user.username}")
        
        # descarga
        logger.info("Iniciando prueba de descarga...")
        download_speed = st.download() / 1_000_000 
        
        # subida 
        logger.info("Iniciando prueba de subida...")
        upload_speed = st.upload() / 1_000_000 
        
        #  ping
        ping = st.results.ping
        
        server = st.results.server

        resultado = {
            'status': 'success',
            'user': {
                'username': request.user.username,
                'email': request.user.email,
                'role': getattr(request.user, 'role', 'No definido')
            },
            'data': {
                'download_speed': round(download_speed, 2),
                'upload_speed': round(upload_speed, 2),
                'ping': round(ping, 2),
                'server': {
                    'name': server.get('sponsor', 'Desconocido'),
                    'location': f"{server.get('name', 'Sin ubicación')} - {server.get('country', 'N/A')}",
                    'id': server.get('id', 'N/A')
                }
            }
        }
        
        logger.info(f"Prueba de velocidad completada: Download {resultado['data']['download_speed']} Mbps, Upload {resultado['data']['upload_speed']} Mbps")
        
        return JsonResponse(resultado)
    
    except speedtest.SpeedtestException as speed_err:
        logger.error(f"Error de Speedtest: {str(speed_err)}")
        return JsonResponse({
            'status': 'error',
            'type': 'speedtest_error', 
            'message': f"Error en prueba de velocidad: {str(speed_err)}"
        }, status=500)
    
    except Exception as e:
        logger.error(f"Error inesperado en prueba de velocidad: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error', 
            'type': 'unexpected_error',
            'message': "Error interno al realizar la prueba de velocidad"
        }, status=500)
    
# Vista para asistencia técnica
@login_required
@user_passes_test(is_client)
def client_support(request):
    return redirect('request_assistance') 

# Vista para CPU
@login_required
@user_passes_test(is_client)
def client_monitoring_cpu(request):
    """
    Renderiza la página de monitoreo de CPU.
    """
    return render(request, 'dashboard/client/monitoring/cpu.html')

# Vista para RAM
@login_required
@user_passes_test(is_client)
def client_monitoring_ram(request):
    """
    Renderiza la página de monitoreo de RAM.
    """
    return render(request, 'dashboard/client/monitoring/ram.html')
# Vista para Disco
@login_required
@user_passes_test(is_client)
def client_monitoring_disk(request):
    """
    Renderiza la página de monitoreo de Disco.
    """
    return render(request, 'dashboard/client/monitoring/disk.html')

# Vista para GPU
@login_required
@user_passes_test(is_client)
def client_monitoring_gpu(request):
    """
    Renderiza la página de monitoreo de GPU.
    """
    return render(request, 'dashboard/client/monitoring/gpu.html')

# Vista para diagnóstico
@login_required
@user_passes_test(is_client)
def client_diagnosis(request):
    return render(request, "dashboard/client/diagnosis.html")


class IcasoftToolsContext:
    TOOLS = {
        'diagnostico': {
            'keywords': ['lenta', 'lento', 'rendimiento', 'rapido'],
            'solution': 'Ejecuta el módulo de diagnóstico para problemas de rendimiento.'
        },
        'antivirus': {
            'keywords': ['virus', 'malware', 'seguridad'],
            'solution': 'Ejecuta un análisis completo con el módulo de Antivirus ICASOFT.'
        },
        'monitoreo': {
            'keywords': ['temperatura', 'recursos', 'uso de cpu'],
            'solution': 'Revisa el Monitoreo del Sistema para identificar procesos que consumen muchos recursos.'
        },
        'mantenimiento': {
            'keywords': ['limpieza', 'optimizar', 'mejorar'],
            'solution': 'Ejecuta el módulo de Mantenimiento para optimizar tu sistema.'
        },
        'red': {
            'keywords': ['wifi', 'internet', 'conexion', 'red'],
            'solution': 'Ejecuta el módulo de Testeo de Red para diagnosticar problemas de conectividad.'
        },
        'ubicacion': {
            'keywords':['ubicacion', 'ubican', 'encuentran'],
            'solution':'Nos ubicamos en Ica, Perú. Nuestro local está en Calle Cajamarca 156, Galería Amisur, puesto 135-A, Ica.'
        },
        'tecnico':{
            'keywords': ['domicilio', 'enviar', 'necesito un tecnico', 'tecnico'],
            'solution': 'Te brindamos el número para agendar asistencia a domicilio: +51 972 142 522 o en el módulo de Asistencia Técnica puede solicitar'
        },
        'horario':{
            'keywords':['atencion', 'hora', 'abren', 'atienden'],
            'solution': 'Nuestro horario de atención es de 9:00 A.M. - 9:00 P.M.'
        }
    }

    @classmethod
    def get_tool_recommendation(cls, user_input):
        user_input = user_input.lower()
        
        for tool, details in cls.TOOLS.items():
            if any(keyword in user_input for keyword in details['keywords']):
                return details['solution']
        
        return 'Explora las herramientas de ICASOFT IA.'

class ConversationManager:
    def __init__(self):
        self.conversation_history = [
            {
                "role": "system", 
                "content": """
                Eres el Asistente Virtual de ICASOFT IA Ingeniería 21. 
                Características:
                - Respuestas breves, concisas y precisas
                - Siempre recomienda herramientas específicas de ICASOFT IA
                - Usa un tono profesional y amigable
                - Enfócate en soluciones prácticas
                - Brinda pasos ante los problemas
                - Si no hay solución específica, dirige al usuario a Asistencia Técnica de manera corta
                """
            }
        ]
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    def add_message(self, role, content):
        self.conversation_history.append({
            "role": role,
            "content": content
        })

    def generate_response(self, user_input):
        try:
            self.add_message("user", user_input)

            tool_recommendation = IcasoftToolsContext.get_tool_recommendation(user_input)

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=self.conversation_history + [
                    {"role": "system", "content": f"Herramienta recomendada: {tool_recommendation}"}
                ],
                max_tokens=100,
                temperature=0.7
            )

            assistant_response = response.choices[0].message.content.strip()

            if not assistant_response:
                assistant_response = tool_recommendation

            # Evita repetir si ya contiene la respuesta
            if tool_recommendation.lower() in assistant_response.lower():
                full_response = assistant_response
            else:
                full_response = f"{assistant_response} {tool_recommendation}"
            
            return full_response

        except Exception as e:
            print(f"Error en generación de respuesta: {str(e)}")
            return "Te recomendamos contactar a Asistencia Técnica de ICASOFT IA para resolver tu problema."

conversation_manager = ConversationManager()
    
#CHAT IA
def clean_response_for_speech(text):
    """
    Limpia el texto de la respuesta para síntesis de voz
    """
    if not text:
        return text
    
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'\1', text)  
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)      
    text = re.sub(r'\*(.*?)\*', r'\1', text)         
    
    text = re.sub(r'_(.*?)_', r'\1', text)          
    
    text = re.sub(r'~~(.*?)~~', r'\1', text)         
    
    text = re.sub(r'`(.*?)`', r'\1', text)         
    
    text = re.sub(r'[#\-\+\[\]]+', '', text)
    
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def format_response_for_display(text):
    """
    Formatea el texto para mejor visualización
    Esta función es opcional - se puede hacer completamente en el frontend
    """
    if not text:
        return text

    
    return text

@csrf_exempt
@require_http_methods(["POST"])
def chatIA(request):
    try:
        data = json.loads(request.body)
        user_input = data.get('message', '').strip()
        
        if not user_input:
            return JsonResponse({
                'response': 'Por favor, escribe tu consulta.',
                'speech_text': 'Por favor, escribe tu consulta.'
            })
        
        user_context = get_user_context_for_chat(request.user)
        
        contextual_input = build_contextual_prompt(user_input, user_context)
        
        response = conversation_manager.generate_response(contextual_input)
        
        personalized_response = personalize_response(response, user_context)
        
        return JsonResponse({
            'response': personalized_response,
            'speech_text': clean_response_for_speech(personalized_response),
            'has_formatting': bool(re.search(r'[\*_~`#]', personalized_response)),
            'user_context': user_context 
        })
        
    except json.JSONDecodeError:
        error_msg = 'Hubo un problema al procesar tu solicitud.'
        return JsonResponse({
            'response': error_msg,
            'speech_text': error_msg
        }, status=400)
        
    except Exception as e:
        print(f"Error en chatIA: {str(e)}")
        error_msg = 'Te recomendamos contactar a Asistencia Técnica de ICASOFT IA.'
        return JsonResponse({
            'response': error_msg,
            'speech_text': error_msg
        }, status=500)

def get_user_context_for_chat(user):
    """Obtiene contexto relevante del usuario para el chat"""
    try:
        context = {
            'name': user.first_name or user.username,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'is_first_time': False,
            'has_recent_issues': False,
            'system_info': {},
            'suggestions': []
        }
        
        total_diagnoses = Diagnosis.objects.filter(user=user).count()
        context['is_first_time'] = total_diagnoses == 0
        
        latest_diagnosis = Diagnosis.objects.filter(user=user).order_by('-timestamp').first()
        if latest_diagnosis:
            days_since = (timezone.now() - latest_diagnosis.timestamp).days
            context.update({
                'last_diagnosis_date': latest_diagnosis.timestamp.strftime('%d/%m/%Y'),
                'days_since_last_diagnosis': days_since,
                'system_info': {
                    'os': latest_diagnosis.os_name,
                    'cpu': latest_diagnosis.cpu_model,
                    'ram': f"{latest_diagnosis.ram_total}GB" if latest_diagnosis.ram_total else None,
                    'status': latest_diagnosis.overall_status
                }
            })
        
        recent_critical_issues = DiagnosticIssue.objects.filter(
            diagnosis__user=user,
            severity='HIGH',
            diagnosis__timestamp__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        context['has_recent_issues'] = recent_critical_issues > 0
        context['critical_issues_count'] = recent_critical_issues
        
        context['suggestions'] = generate_smart_suggestions(context)
        
        return context
        
    except Exception as e:
        print(f"Error obteniendo contexto del usuario: {str(e)}")
        return {
            'name': user.first_name or user.username,
            'full_name': user.first_name or user.username,
            'is_first_time': True,
            'has_recent_issues': False,
            'suggestions': []
        }


def build_contextual_prompt(user_input, user_context):
    """Construye un prompt contextualizado para el conversation_manager"""
    
    context_prefix = f"""
CONTEXTO DEL USUARIO:
- Nombre: {user_context['full_name']}
- Usuario {'nuevo' if user_context['is_first_time'] else 'existente'}
"""
    
    if not user_context['is_first_time']:
        context_prefix += f"- Último diagnóstico: {user_context.get('last_diagnosis_date', 'Desconocido')}\n"
        
        if user_context.get('system_info', {}).get('os'):
            context_prefix += f"- Sistema: {user_context['system_info']['os']}\n"
            
        if user_context['has_recent_issues']:
            context_prefix += f"- Problemas críticos recientes: {user_context['critical_issues_count']}\n"
    
    context_prefix += f"""
INSTRUCCIONES:
- Siempre saluda al usuario por su nombre ({user_context['name']})
- Sé personal y empático
- Si es usuario nuevo, ofrece un diagnóstico inicial
- Si tiene problemas pendientes, menciónalos y ofrece ayuda específica
- Mantén un tono profesional pero cercano

CONSULTA DEL USUARIO: {user_input}
"""
    
    return context_prefix


def personalize_response(response, user_context):
    """Post-procesa la respuesta para mayor personalización"""
    
    if user_context['name'].lower() not in response.lower()[:50]:
        if not any(greeting in response.lower()[:20] for greeting in ['hola', 'buenos', 'buenas']):
            response = f"Hola {user_context['name']}, {response}"
    
    if len(response) < 200 and user_context.get('suggestions'):
        suggestion = user_context['suggestions'][0] 
        response += f"\n\n💡 **Sugerencia**: {suggestion}"
    
    return response


def generate_smart_suggestions(context):
    """Genera sugerencias inteligentes basadas en el contexto"""
    suggestions = []
    
    if context['is_first_time']:
        suggestions.append("¿Te gustaría que ejecutemos tu primer diagnóstico completo?")
    elif context.get('days_since_last_diagnosis', 0) > 14:
        suggestions.append(f"Han pasado {context['days_since_last_diagnosis']} días desde tu último diagnóstico. ¿Ejecutamos uno nuevo?")
    
    if context['has_recent_issues']:
        suggestions.append(f"Tienes {context['critical_issues_count']} problema(s) crítico(s) pendiente(s). ¿Te ayudo a resolverlos?")
    
    if not context['is_first_time'] and not context['has_recent_issues']:
        suggestions.append("¿Te gustaría ver el estado actual de tu sistema?")
    
    return suggestions[:2]  


@login_required
def get_user_chat_context(request):
    """API endpoint para obtener contexto inicial del chat"""
    try:
        context = get_user_context_for_chat(request.user)
        
        welcome_message = generate_welcome_message(context)
        
        return JsonResponse({
            'status': 'success',
            'context': context,
            'welcome_message': welcome_message
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


def generate_welcome_message(context):
    """Genera mensaje de bienvenida personalizado"""
    if context['is_first_time']:
        return f"¡Hola {context['name']}! 👋 Bienvenido a ICASOFT IA. Soy tu asistente técnico personal. ¿Te gustaría que ejecutemos tu primer diagnóstico completo?"
    
    msg = f"¡Hola {context['name']}! 👋 Me alegra verte de nuevo."
    
    if context['has_recent_issues']:
        msg += f" Veo que tienes {context['critical_issues_count']} problema(s) crítico(s) que requieren atención. ¿Te ayudo a resolverlos?"
    elif context.get('last_diagnosis_date'):
        msg += f" Tu último diagnóstico fue el {context['last_diagnosis_date']}."
        
        if context.get('days_since_last_diagnosis', 0) > 14:
            msg += " ¿Te gustaría ejecutar un nuevo diagnóstico?"
        else:
            msg += " Tu sistema se ve bien. ¿En qué puedo ayudarte hoy?"
    
    return msg    


# Vista para el Chat del Cliente
@login_required
@user_passes_test(is_client)
def client_chat(request):
    if request.method == "GET":
        return render(request, "dashboard/client/client_chat.html")



@user_passes_test(lambda user: user.is_authenticated and user.role == 'client')
def cpu_monitoring_data(request):
    try:
        system = platform.system()
        data = {
            "cpu_name": "Desconocido",
            "usage": 0,
            "speed": "N/A",
            "processes": 0,
            "threads": 0,
            "sockets": 1, 
            "cores": 0,
            "logical_processors": 0,
            "uptime": "0:00:00",
            "virtualization": "No disponible",
            "cache_l1": "No disponible",
            "cache_l2": "No disponible",
            "cache_l3": "No disponible",
        }

        if system == "Windows":
            @ensure_com_initialized
            def get_windows_cpu_info():
                import wmi
                w = wmi.WMI(namespace="root\\CIMV2")
                
                cpu_info = w.query("SELECT Name, MaxClockSpeed FROM Win32_Processor")[0]
                data["cpu_name"] = cpu_info.Name.strip()
                data["speed"] = f"{cpu_info.MaxClockSpeed / 1000:.2f} GHz"

                data["usage"] = psutil.cpu_percent(interval=1)
                data["processes"] = len(psutil.pids())
                data["cores"] = psutil.cpu_count(logical=False)
                data["logical_processors"] = psutil.cpu_count(logical=True)

                uptime_seconds = time.time() - psutil.boot_time()
                hours, remainder = divmod(uptime_seconds, 3600)
                minutes, seconds = divmod(remainder, 60)
                data["uptime"] = f"{int(hours)}h:{int(minutes)}m:{int(seconds)}s"

                virtualization_info = w.query("SELECT VirtualizationFirmwareEnabled FROM Win32_ComputerSystem")
                data["virtualization"] = "Habilitado" if virtualization_info[0].VirtualizationFirmwareEnabled else "No habilitado"

                cache_info = w.query("SELECT L2CacheSize, L3CacheSize FROM Win32_Processor")[0]
                data["cache_l2"] = f"{cache_info.L2CacheSize / 1024:.1f} MB" if cache_info.L2CacheSize else "No disponible"
                data["cache_l3"] = f"{cache_info.L3CacheSize / 1024:.1f} MB" if cache_info.L3CacheSize else "No disponible"
                data["cache_l1"] = "1.1 MB"  # Estimado

            try:
                get_windows_cpu_info()
            except Exception as e:
                logger.warning(f"Error al obtener datos en Windows: {e}")

        elif system == "Linux":
            try:
                import cpuinfo
                cpu_info = cpuinfo.get_cpu_info()
                data["cpu_name"] = cpu_info.get("brand_raw", "Procesador desconocido")
                data["usage"] = psutil.cpu_percent(interval=1)
                data["speed"] = f"{psutil.cpu_freq().current / 1000:.2f} GHz" if psutil.cpu_freq() else "N/A"
                data["processes"] = len(psutil.pids())
                data["cores"] = psutil.cpu_count(logical=False)
                data["logical_processors"] = psutil.cpu_count(logical=True)

                uptime_seconds = time.time() - psutil.boot_time()
                hours, remainder = divmod(uptime_seconds, 3600)
                minutes, seconds = divmod(remainder, 60)
                data["uptime"] = f"{int(hours)}h:{int(minutes)}m:{int(seconds)}s"
            except Exception as e:
                logger.warning(f"Error al obtener datos en Linux: {e}")
        else:
            logger.warning("Sistema operativo no soportado para datos detallados.")

        return JsonResponse(data)
    except Exception as e:
        logger.error(f"Error en cpu_monitoring_data: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@user_passes_test(lambda user: user.role == 'client')
def ram_monitoring_data(request):
    try:
        memory = psutil.virtual_memory()
        system = platform.system()

        data = {
            "os": system,
            "percent": memory.percent,
            "used": round(memory.used / (1024 ** 3), 2),
            "total": round(memory.total / (1024 ** 3), 2),
            "available": round(memory.available / (1024 ** 3), 2),
            "speed": "No disponible",
            "slots_used": "No disponible"
        }

        if system == "Windows":
            @ensure_com_initialized
            def get_windows_ram_info():
                import wmi
                w = wmi.WMI()
                memory_modules = w.query("SELECT Speed, BankLabel FROM Win32_PhysicalMemory")
                speeds = [m.Speed for m in memory_modules if isinstance(m.Speed, int)]
                slots_used = len(memory_modules)

                data["speed"] = f"{max(speeds)} MT/s" if speeds else "No disponible"
                data["slots_used"] = f"{slots_used} de {slots_used}"

            try:
                get_windows_ram_info()
            except Exception as e:
                logger.warning(f"Error al obtener datos de RAM en Windows: {e}")

        return JsonResponse(data)
    except Exception as e:
        logger.error(f"Error en ram_monitoring_data: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@user_passes_test(lambda user: user.role == 'client')
def disk_monitoring_data(request):
    try:
        import psutil
        import time

        def convert_bytes(size):
            """Convierte bytes a la unidad más legible (KB, MB, GB, etc.)"""
            units = ['B', 'KB', 'MB', 'GB', 'TB']
            i = 0
            while size >= 1024 and i < len(units) - 1:
                size /= 1024.0
                i += 1
            return round(size, 2), units[i]

        # Calcular velocidades de transferencia
        if not hasattr(disk_monitoring_data, "previous_data"):
            disk_monitoring_data.previous_data = {
                "read_bytes": psutil.disk_io_counters().read_bytes,
                "write_bytes": psutil.disk_io_counters().write_bytes,
                "timestamp": time.time(),
            }

        current_data = psutil.disk_io_counters()
        current_time = time.time()

        elapsed_time = current_time - disk_monitoring_data.previous_data["timestamp"]
        read_speed_bytes = (
            current_data.read_bytes - disk_monitoring_data.previous_data["read_bytes"]
        ) / elapsed_time
        write_speed_bytes = (
            current_data.write_bytes - disk_monitoring_data.previous_data["write_bytes"]
        ) / elapsed_time

        disk_monitoring_data.previous_data = {
            "read_bytes": current_data.read_bytes,
            "write_bytes": current_data.write_bytes,
            "timestamp": current_time,
        }

        # Convertir velocidades a formato legible
        read_speed_value, read_speed_unit = convert_bytes(read_speed_bytes)
        write_speed_value, write_speed_unit = convert_bytes(write_speed_bytes)

        # Obtener información de cada disco
        partitions = psutil.disk_partitions()
        disks = []
        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                total_val, total_unit = convert_bytes(usage.total)
                used_val, used_unit = convert_bytes(usage.used)
                free_val, free_unit = convert_bytes(usage.free)

                disks.append({
                    "device": partition.device,
                    "mountpoint": partition.mountpoint,
                    "fstype": partition.fstype,
                    "total": f"{total_val} {total_unit}",
                    "used": f"{used_val} {used_unit}",
                    "free": f"{free_val} {free_unit}",
                    "percent": f"{usage.percent}%",
                })
            except Exception as e:
                continue  # Evita errores con montajes inaccesibles

        return JsonResponse(
            {
                "read_speed": f"{read_speed_value} {read_speed_unit}/s",
                "write_speed": f"{write_speed_value} {write_speed_unit}/s",
                "disks": disks,
            }
        )
    except Exception as e:
        logger.error(f"Error en disk_monitoring_data: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@login_required
@user_passes_test(lambda user: user.role == 'client')
def gpu_monitoring_data(request):
    try:
        gpu_data = []
        gpus = GPUtil.getGPUs()  
        if gpus:
            for gpu in gpus:
                gpu_data.append({
                    "name": gpu.name,
                    "load": round(gpu.load * 100, 2),  
                    "temperature": gpu.temperature if gpu.temperature else "No disponible",
                    "memory_used": round(gpu.memoryUsed, 2),  
                    "memory_total": round(gpu.memoryTotal, 2),  
                    "memory_free": round(gpu.memoryTotal - gpu.memoryUsed, 2),  
                })
        else:
            gpu_data.append({"error": "No hay GPUs disponibles."})

        return JsonResponse({"gpu": gpu_data})
    except Exception as e:
        logger.error(f"Error en gpu_monitoring_data: {e}")
        return JsonResponse({"error": str(e)}, status=500)

def google_maps(request):
     return {
        'google_api_key': settings.GOOGLE_API_KEY
    }


#ANTIVIRUS
@login_required
@require_http_methods(["GET", "POST"])
def system_virus_scan(request):
    try:
        virustotal_api_key = os.environ.get('virus_total_api_key')
        if not virustotal_api_key:
            return JsonResponse({
                'status': 'error',
                'message': 'Configuración de API de VirusTotal no encontrada'
            }, status=500)

        scan_results = {
            'total_files_scanned': 0,
            'potentially_malicious': [],
            'clean_files': 0,
            'scan_logs': []
        }

        scan_paths = [
            os.path.expanduser('~'),
            os.path.join(os.path.expanduser('~'), 'Downloads'),
            os.path.join(os.path.expanduser('~'), 'Documents'),
        ]

        def get_files_to_scan(directory):
            files_to_scan = []
            try:
                for root, _, files in os.walk(directory):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if os.path.getsize(file_path) < 32 * 1024 * 1024:
                            files_to_scan.append(file_path)
            except Exception as e:
                logger.warning(f"Error escaneando directorio {directory}: {str(e)}")
            return files_to_scan

        max_total_files = 30
        all_files = []

        for path in scan_paths:
            if os.path.exists(path):
                files_in_path = get_files_to_scan(path)
                for file in files_in_path:
                    if len(all_files) >= max_total_files:
                        break
                    all_files.append(file)
            if len(all_files) >= max_total_files:
                break

        for file_path in all_files:
            try:
                with open(file_path, 'rb') as f:
                    files = {'file': f}
                    response = requests.post(
                        'https://www.virustotal.com/vtapi/v2/file/scan',
                        params={'apikey': virustotal_api_key},
                        files=files
                    )

                if response.status_code == 200:
                    scan_result = response.json()

                    report_response = requests.get(
                        'https://www.virustotal.com/vtapi/v2/file/report',
                        params={
                            'apikey': virustotal_api_key,
                            'resource': scan_result['resource']
                        }
                    )

                    if report_response.status_code == 200:
                        analysis_results = report_response.json()

                        scan_results['total_files_scanned'] += 1

                        log_entry = {
                            'file': os.path.basename(file_path),
                            'status': 'clean',
                            'details': 'Archivo escaneado correctamente'
                        }

                        if analysis_results.get('positives', 0) > 0:
                            log_entry['status'] = 'threat'
                            log_entry['details'] = (
                                f"Amenazas detectadas: {analysis_results['positives']} "
                                f"de {analysis_results['total']} motores"
                            )

                            scan_results['potentially_malicious'].append({
                                'file': file_path,
                                'detections': analysis_results['positives'],
                                'total_engines': analysis_results['total']
                            })
                        else:
                            scan_results['clean_files'] += 1

                        scan_results['scan_logs'].append(log_entry)

            except PermissionError:
                scan_results['scan_logs'].append({
                    'file': os.path.basename(file_path),
                    'status': 'error',
                    'details': 'Permiso denegado'
                })
            except Exception as e:
                scan_results['scan_logs'].append({
                    'file': os.path.basename(file_path),
                    'status': 'error',
                    'details': str(e)
                })

        return JsonResponse({
            'status': 'success',
            'scan_results': scan_results
        })

    except Exception as e:
        logger.error(f"Error en escaneo de sistema: {str(e)}")
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
        
@login_required
@require_http_methods(["GET"])
def system_security_info(request):
    """
    Obtener información de seguridad del sistema (Firewall y Antivirus)
    """
    try:
        import subprocess
        import json
        import platform
        
        firewall_data = {"enabled": False, "status": "Inactivo"}
        antivirus_data = {"enabled": False, "status": "Inactivo", "name": "No detectado"}
        
        if platform.system() == "Windows":
            try:
                firewall_cmd = "powershell \"Get-NetFirewallProfile | Select Name, Enabled | ConvertTo-Json\""
                firewall_result = subprocess.run(
                    firewall_cmd, 
                    capture_output=True, 
                    text=True, 
                    shell=True, 
                    timeout=10
                )
                
                if firewall_result.returncode == 0 and firewall_result.stdout:
                    try:
                        firewall_profiles = json.loads(firewall_result.stdout)
                        if not isinstance(firewall_profiles, list):
                            firewall_profiles = [firewall_profiles]
                        
                        firewall_enabled = any(profile.get('Enabled', False) for profile in firewall_profiles)
                        firewall_data = {
                            "enabled": firewall_enabled,
                            "status": "Activo" if firewall_enabled else "Inactivo",
                            "profiles": firewall_profiles
                        }
                    except json.JSONDecodeError:
                        logger.warning("Error al decodificar respuesta del firewall")
                        
            except Exception as e:
                logger.error(f"Error al verificar firewall: {str(e)}")
            
            try:
                defender_cmd = "powershell \"Get-MpComputerStatus | Select AntivirusEnabled, RealTimeProtectionEnabled, AntispywareEnabled | ConvertTo-Json\""
                defender_result = subprocess.run(
                    defender_cmd, 
                    capture_output=True, 
                    text=True, 
                    shell=True, 
                    timeout=10
                )
                
                if defender_result.returncode == 0 and defender_result.stdout:
                    try:
                        defender_status = json.loads(defender_result.stdout)
                        antivirus_enabled = defender_status.get('AntivirusEnabled', False)
                        
                        antivirus_data = {
                            "enabled": antivirus_enabled,
                            "status": "Activo" if antivirus_enabled else "Inactivo",
                            "name": "Windows Defender",
                            "realtime_protection": defender_status.get('RealTimeProtectionEnabled', False),
                            "antispyware": defender_status.get('AntispywareEnabled', False)
                        }
                    except json.JSONDecodeError:
                        logger.warning("Error al decodificar respuesta de Windows Defender")
                        
            except Exception as e:
                logger.error(f"Error al verificar Windows Defender: {str(e)}")
                
                try:
                    alt_antivirus_cmd = "powershell \"Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select displayName, productState | ConvertTo-Json\""
                    alt_result = subprocess.run(
                        alt_antivirus_cmd, 
                        capture_output=True, 
                        text=True, 
                        shell=True, 
                        timeout=10
                    )
                    
                    if alt_result.returncode == 0 and alt_result.stdout:
                        try:
                            antivirus_products = json.loads(alt_result.stdout)
                            if not isinstance(antivirus_products, list):
                                antivirus_products = [antivirus_products]
                            
                            for av in antivirus_products:
                                product_state = av.get('productState', 0)
                                if (product_state & 0x1000) != 0:
                                    antivirus_data = {
                                        "enabled": True,
                                        "status": "Activo",
                                        "name": av.get('displayName', 'Antivirus detectado')
                                    }
                                    break
                        except json.JSONDecodeError:
                            logger.warning("Error al decodificar respuesta de antivirus alternativo")
                            
                except Exception as e2:
                    logger.error(f"Error en método alternativo de antivirus: {str(e2)}")
        
        try:
            security_processes = []
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    proc_name = proc.info['name'].lower()
                    if any(keyword in proc_name for keyword in ['defender', 'antivirus', 'firewall', 'security']):
                        security_processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name']
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
                    
        except Exception as e:
            logger.error(f"Error al obtener procesos de seguridad: {str(e)}")
            security_processes = []
        
        response_data = {
            'status': 'success',
            'data': {
                'firewall': firewall_data,
                'antivirus': antivirus_data,
                'security_processes': security_processes[:10], 
                'timestamp': str(timezone.now())
            }
        }
        
        logger.info(f"Información de seguridad obtenida exitosamente: Firewall={firewall_data['enabled']}, Antivirus={antivirus_data['enabled']}")
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Error crítico obteniendo información de seguridad: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Error al obtener información de seguridad: {str(e)}',
            'data': {
                'firewall': {"enabled": False, "status": "Error al verificar"},
                'antivirus': {"enabled": False, "status": "Error al verificar", "name": "Error"}
            }
        }, status=500)

#diagnostico

@login_required
@user_passes_test(is_client)
def diagnostics_dashboard(request):
    """Renderiza el dashboard principal de diagnósticos"""
    latest_diagnosis = Diagnosis.objects.filter(user=request.user).order_by('-timestamp').first()
    
    scenarios = DiagnosticScenario.objects.filter(is_active=True)
    
    diagnosis_history = Diagnosis.objects.filter(user=request.user).order_by('-timestamp')[:5]
    
    scenario_runs = ScenarioRun.objects.filter(user=request.user).order_by('-timestamp')[:5]
    
    context = {
        'latest_diagnosis': latest_diagnosis,
        'scenarios': scenarios,
        'diagnosis_history': diagnosis_history,
        'scenario_runs': scenario_runs,
    }
    
    return render(request, 'diagnostics/dashboard.html', context)

@login_required
@user_passes_test(is_client)
def client_diagnosis_data(request):
    """API para obtener datos del sistema en tiempo real"""
    try:
        scan_type = request.GET.get("scan_type", "QuickScan")
        
        # Obtener datos del sistema
        system_data = get_system_data()
        
        # Crear nuevo diagnóstico
        diagnosis = create_diagnosis_entry(request.user, system_data, scan_type)
        
        # Devolver datos recolectados
        return JsonResponse({
            "status": "success", 
            "data": system_data,
            "diagnosis_id": diagnosis.id
        })
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def system_updates_info(request):
    """API para obtener información sobre actualizaciones del sistema"""
    try:
        updates_status = check_windows_updates()
        return JsonResponse({"status": "success", "data": updates_status})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    

def get_system_data():
    """Recolecta datos del sistema"""
    try:
        # Datos de CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_freq = psutil.cpu_freq()
        cpu_count = psutil.cpu_count()
        cpu_stats = psutil.cpu_stats()
        
        # Datos de memoria
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # Datos de disco
        disk_partitions = []
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_partitions.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': get_size_str(usage.total),
                    'used': get_size_str(usage.used),
                    'free': get_size_str(usage.free),
                    'percent': f"{usage.percent}%"
                })
            except:
                pass
        
        # Datos de red
        net_io = psutil.net_io_counters()
        net_connections = len(psutil.net_connections())
        
        # Datos de batería
        battery = None
        if hasattr(psutil, "sensors_battery"):
            battery_stats = psutil.sensors_battery()
            if battery_stats:
                battery = {
                    'percent': f"{battery_stats.percent}%",
                    'power_plugged': battery_stats.power_plugged,
                    'secsleft': battery_stats.secsleft if battery_stats.secsleft != -1 else None
                }
        
        system_info = {
            'system': platform.system(),
            'version': platform.version(),
            'release': platform.release(),
            'machine': platform.machine(),
            'processor': platform.processor()
        }
        
        cpu_temp = "N/A"
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    if entries:
                        cpu_temp = f"{entries[0].current:.1f}°C"
                        break
        
        gpu_info = get_gpu_info()
        
        system_data = {
            # CPU
            "cpu_usage": f"{cpu_percent}%",
            "cpu_temp": cpu_temp,
            "cpu_freq": f"{cpu_freq.current if cpu_freq else 0} MHz",
            "cpu_cores": cpu_count,
            "cpu_stats": {
                "ctx_switches": cpu_stats.ctx_switches,
                "interrupts": cpu_stats.interrupts,
                "soft_interrupts": cpu_stats.soft_interrupts,
                "syscalls": cpu_stats.syscalls
            },
            
            # RAM
            "ram_usage": {
                "total": get_size_str(memory.total),
                "available": get_size_str(memory.available),
                "used": get_size_str(memory.used),
                "free": get_size_str(memory.free),
                "percent": f"{memory.percent}%"
            },
            "swap_usage": {
                "total": get_size_str(swap.total),
                "used": get_size_str(swap.used),
                "free": get_size_str(swap.free),
                "percent": f"{swap.percent}%"
            },
            
            # Disco
            "disk_usage": {
                "partitions": disk_partitions
            },
            
            # Red
            "network": {
                "bytes_sent": get_size_str(net_io.bytes_sent),
                "bytes_recv": get_size_str(net_io.bytes_recv),
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "connections": net_connections
            },
            
            # Batería
            "battery": battery,
            
            # Sistema operativo
            "system_info": system_info,
            
            # GPU
            "gpu_info": gpu_info,
            
            # Procesos
            "top_processes": get_top_processes()
        }
        
        return system_data
    except Exception as e:
        raise Exception(f"Error al obtener datos del sistema: {str(e)}")

def get_size_str(bytes_size):
    """Convierte bytes a un string legible (KB, MB, GB)"""
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    size = bytes_size
    unit_index = 0
    
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1
    
    return f"{size:.2f} {units[unit_index]}"

def get_gpu_info():
    """Obtiene información de GPU"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-WmiObject Win32_VideoController | Select Name, AdapterRAM, DriverVersion | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
            
            if result.returncode == 0 and result.stdout:
                gpu_data = json.loads(result.stdout)
                
                if not isinstance(gpu_data, list):
                    gpu_data = [gpu_data]
                
                gpus = []
                for gpu in gpu_data:
                    if 'AdapterRAM' in gpu and gpu['AdapterRAM']:
                        try:
                            gpu_ram = get_size_str(int(gpu['AdapterRAM']))
                        except:
                            gpu_ram = "Desconocido"
                    else:
                        gpu_ram = "Desconocido"
                    
                    gpus.append({
                        "name": gpu.get('Name', 'Desconocido'),
                        "memory": gpu_ram,
                        "driver": gpu.get('DriverVersion', 'Desconocido')
                    })
                
                return gpus
        elif platform.system() == "Linux":
            try:
                nvidia_cmd = "nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader"
                nvidia_result = subprocess.run(nvidia_cmd, capture_output=True, text=True, shell=True)
                
                if nvidia_result.returncode == 0 and nvidia_result.stdout:
                    gpus = []
                    for line in nvidia_result.stdout.strip().split('\n'):
                        parts = line.split(', ')
                        if len(parts) >= 3:
                            gpus.append({
                                "name": parts[0],
                                "memory": parts[1],
                                "driver": parts[2]
                            })
                    return gpus
            except:
                pass
            
            try:
                lspci_cmd = "lspci | grep -i 'vga\\|3d\\|2d'"
                lspci_result = subprocess.run(lspci_cmd, capture_output=True, text=True, shell=True)
                
                if lspci_result.returncode == 0 and lspci_result.stdout:
                    gpus = []
                    for line in lspci_result.stdout.strip().split('\n'):
                        if line:
                            gpus.append({
                                "name": line.split(': ')[1] if ': ' in line else line,
                                "memory": "Desconocido",
                                "driver": "Desconocido"
                            })
                    return gpus
            except:
                pass
        
        return [{
            "name": "GPU detectada",
            "memory": "Desconocido",
            "driver": "Desconocido"
        }]
    except Exception as e:
        return [{
            "name": f"Error al detectar GPU: {str(e)}",
            "memory": "N/A",
            "driver": "N/A"
        }]

def get_top_processes(limit=5):
    """Versión OPTIMIZADA y CORREGIDA para obtener top procesos"""
    try:
        logger = logging.getLogger(__name__)
        processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
            try:
                proc_info = proc.info
                
                if proc_info['name'] and not proc_info['name'].lower().startswith(('system', 'idle')):
                    
                    cpu_percent = proc.cpu_percent(interval=0.05)
                    
                    if (0 <= cpu_percent <= 100 and 
                        cpu_percent > 0.5 and
                        proc_info['memory_percent'] is not None):
                        
                        processes.append({
                            'pid': proc_info['pid'],
                            'name': proc_info['name'],
                            'cpu_percent': f"{cpu_percent:.1f}%",
                            'memory_percent': f"{proc_info['memory_percent']:.1f}%"
                        })
                        
                    if len(processes) >= limit * 2:
                        break
                        
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        processes.sort(key=lambda x: float(x['cpu_percent'].replace('%', '')), reverse=True)
        return processes[:limit]
        
    except Exception as e:
        logger.error(f"Error en get_top_processes: {str(e)}")
        return [{
            "pid": "N/A",
            "name": "Sistema optimizado",
            "cpu_percent": "0.5%",
            "memory_percent": "1.2%"
        }]

def create_diagnosis_entry(user, system_data, scan_type):
   """Crea un registro de diagnóstico en la base de datos"""
   try:
       cpu_usage = system_data.get('cpu_usage', 'N/A')
       cpu_temp = system_data.get('cpu_temp', 'N/A')
       
       ram_data = system_data.get('ram_usage', {})
       ram_total = ram_data.get('total', 'N/A')
       ram_used = ram_data.get('used', 'N/A')
       ram_percent = ram_data.get('percent', 'N/A')
       
       disk_data = system_data.get('disk_usage', {}).get('partitions', [{}])[0]
       disk_total = disk_data.get('total', 'N/A')
       disk_used = disk_data.get('used', 'N/A')
       disk_free = disk_data.get('free', 'N/A')
       disk_percent = disk_data.get('percent', 'N/A')
       
       network_data = system_data.get('network', {})
       network_sent = network_data.get('bytes_sent', 'N/A')
       network_recv = network_data.get('bytes_recv', 'N/A')
       
       sys_info = system_data.get('system_info', {})
       os_name = f"{sys_info.get('system', '')} {sys_info.get('release', '')}"
       os_version = sys_info.get('version', 'N/A')
       
       gpu_data = system_data.get('gpu_info', [{}])[0]
       gpu_model = gpu_data.get('name', 'N/A')
       gpu_memory = gpu_data.get('memory', 'N/A')
       gpu_driver = gpu_data.get('driver', 'N/A')
       
       overall_status = "Normal"
       issues_count = 0
       warnings_count = 0
       
       cpu_value = float(cpu_usage.replace('%', '')) if '%' in cpu_usage else 0
       if cpu_value > 90:
           overall_status = "Crítico"
           issues_count += 1
       elif cpu_value > 75:
           if overall_status == "Normal":
               overall_status = "Advertencia"
           warnings_count += 1
       
       ram_value = float(ram_percent.replace('%', '')) if '%' in ram_percent else 0
       if ram_value > 90:
           overall_status = "Crítico"
           issues_count += 1
       elif ram_value > 80:
           if overall_status == "Normal":
               overall_status = "Advertencia"
           warnings_count += 1
       
       disk_value = float(disk_percent.replace('%', '')) if '%' in disk_percent else 0
       if disk_value > 95:
           overall_status = "Crítico"
           issues_count += 1
       elif disk_value > 85:
           if overall_status == "Normal":
               overall_status = "Advertencia"
           warnings_count += 1
       
       diagnosis = Diagnosis.objects.create(
           user=user,
           scan_type=scan_type,
           cpu_usage=cpu_usage,
           cpu_temp=cpu_temp,
           ram_total=ram_total,
           ram_used=ram_used,
           ram_percent=ram_percent,
           disk_total=disk_total,
           disk_used=disk_used,
           disk_free=disk_free,
           disk_percent=disk_percent,
           network_sent=network_sent,
           network_recv=network_recv,
           gpu_model=gpu_model,
           gpu_memory=gpu_memory,
           gpu_driver=gpu_driver,
           os_name=os_name,
           os_version=os_version,
           overall_status=overall_status,
           issues_count=issues_count,
           warnings_count=warnings_count
       )
       
       report = DiagnosticReport.objects.create(
           user=user,
           diagnosis=diagnosis,
           status="En progreso",
           progress=0,
           current_component="Iniciando diagnóstico"
       )
       
       if scan_type in ["FullScan", "CustomScan", "QuickScan"]:
           try:
               analysis_thread = threading.Thread(
                   target=run_detailed_analysis,
                   args=(user, diagnosis, system_data)
               )
               analysis_thread.daemon = True
               analysis_thread.start()
               print(f"Hilo de análisis iniciado para diagnosis_id={diagnosis.id}")
           except Exception as e:
               print(f"Error al iniciar hilo de análisis: {str(e)}")
               report.status = "Error"
               report.error_message = f"Error al iniciar análisis: {str(e)}"
               report.save()
       
       return diagnosis
   except Exception as e:
       raise Exception(f"Error al crear diagnóstico: {str(e)}")

def run_detailed_analysis(user, diagnosis, system_data=None):
    """Ejecuta un análisis detallado en segundo plano"""
    report = None
    try:
        report = DiagnosticReport.objects.create(
            user=user,
            diagnosis=diagnosis,
            status="En progreso",
            progress=0,  
            current_component="Inicializando"
        )
        
        if not system_data:
            system_data = get_system_data()
        
        components = [
            {"type": "CPU", "name": "Procesador", "function": analyze_cpu},
            {"type": "RAM", "name": "Memoria RAM", "function": analyze_ram},
            {"type": "DISK", "name": "Almacenamiento", "function": analyze_disk},
            {"type": "NETWORK", "name": "Red", "function": analyze_network},
            {"type": "GPU", "name": "Tarjeta gráfica", "function": analyze_gpu},
            {"type": "BATTERY", "name": "Batería", "function": analyze_battery},
            {"type": "DRIVER", "name": "Controladores", "function": analyze_drivers},
            {"type": "SOFTWARE", "name": "Software", "function": analyze_software},
            {"type": "SECURITY", "name": "Seguridad", "function": analyze_security}
        ]
        
        total_components = len(components)
        
        for i, component in enumerate(components):
            progress = int(((i) / total_components) * 100)
            report.progress = progress
            report.current_component = component["name"]
            report.save()
            
            try:
                result = component["function"](system_data)
                
                SystemComponent.objects.create(
                    report=report,
                    type=component["type"],
                    name=component["name"],
                    status=result.get("status", "UNKNOWN"),
                    details=result,
                    recommendations=result.get("recommendations", "")
                )
                
                if "issues" in result and result["issues"]:
                    for issue in result["issues"]:
                        DiagnosticIssue.objects.create(
                            diagnosis=diagnosis,
                            component=component["name"],
                            issue_type=issue.get("type", "OTHER"),
                            severity=issue.get("severity", "MEDIUM"),
                            description=issue.get("description", ""),
                            recommendation=issue.get("recommendation", "")
                        )
            except Exception as e:
                SystemComponent.objects.create(
                    report=report,
                    type=component["type"],
                    name=component["name"],
                    status="ERROR",
                    details={"error": str(e)},
                    recommendations="Error al analizar este componente. Por favor, inténtelo de nuevo."
                )
        
        report.progress = 100
        report.status = "Completado"
        report.current_component = "Finalizado"
        report.completion_time = timezone.now()
        report.save()
        
        issues_count = DiagnosticIssue.objects.filter(diagnosis=diagnosis).count()
        diagnosis.issues_count = issues_count
        diagnosis.save()
        
    except Exception as e:
        if report:
            report.status = "Error"
            report.error_message = str(e)
            report.save()
        print(f"Error en análisis detallado: {str(e)}")

def analyze_cpu(system_data):
    """Analiza el procesador del sistema"""
    try:
        cpu_usage = system_data.get('cpu_usage', 'N/A')
        cpu_temp = system_data.get('cpu_temp', 'N/A')
        cpu_freq = system_data.get('cpu_freq', 'N/A')
        cpu_cores = system_data.get('cpu_cores', 0)
        
        cpu_usage_value = float(cpu_usage.replace('%', '')) if '%' in cpu_usage else 0
        cpu_temp_value = float(cpu_temp.replace('°C', '')) if '°C' in cpu_temp else 0
        
        status = "NORMAL"
        issues = []
        
        if cpu_usage_value > 90:
            status = "CRITICAL"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "HIGH",
                "description": f"Uso de CPU extremadamente alto ({cpu_usage})",
                "recommendation": "Cierre aplicaciones innecesarias o procesos en segundo plano que consumen muchos recursos."
            })
        elif cpu_usage_value > 75:
            status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "MEDIUM",
                "description": f"Uso de CPU elevado ({cpu_usage})",
                "recommendation": "Considere cerrar algunas aplicaciones para reducir la carga del procesador."
            })
        
        if cpu_temp != "N/A" and cpu_temp_value > 0:
            if cpu_temp_value > 85:
                status = "CRITICAL"
                issues.append({
                    "type": "HARDWARE",
                    "severity": "HIGH",
                    "description": f"Temperatura de CPU peligrosamente alta ({cpu_temp})",
                    "recommendation": "Verifique el sistema de enfriamiento y asegúrese de que los ventiladores funcionan correctamente."
                })
            elif cpu_temp_value > 75:
                if status != "CRITICAL":
                    status = "WARNING"
                issues.append({
                    "type": "HARDWARE",
                    "severity": "MEDIUM",
                    "description": f"Temperatura de CPU elevada ({cpu_temp})",
                    "recommendation": "Mejore la ventilación de su equipo y considere limpiar el polvo acumulado."
                })
        
        recommendations = "El procesador está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        return {
            "status": status,
            "usage": cpu_usage,
            "temperature": cpu_temp,
            "frequency": cpu_freq,
            "cores": cpu_cores,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar CPU: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de CPU."
        }

def analyze_ram(system_data):
    """Analiza la memoria RAM del sistema"""
    try:
        ram_data = system_data.get('ram_usage', {})
        ram_total = ram_data.get('total', 'N/A')
        ram_used = ram_data.get('used', 'N/A')
        ram_available = ram_data.get('available', 'N/A')
        ram_percent = ram_data.get('percent', 'N/A')
        
        swap_data = system_data.get('swap_usage', {})
        swap_total = swap_data.get('total', 'N/A')
        swap_used = swap_data.get('used', 'N/A')
        swap_percent = swap_data.get('percent', 'N/A')
        
        ram_percent_value = float(ram_percent.replace('%', '')) if '%' in ram_percent else 0
        swap_percent_value = float(swap_percent.replace('%', '')) if '%' in swap_percent else 0
        
        # Determinar estado
        status = "NORMAL"
        issues = []
        
        if ram_percent_value > 90:
            status = "CRITICAL"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "HIGH",
                "description": f"Uso de memoria RAM extremadamente alto ({ram_percent})",
                "recommendation": "Cierre aplicaciones innecesarias o considere ampliar la memoria RAM de su equipo."
            })
        elif ram_percent_value > 80:
            status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "MEDIUM",
                "description": f"Uso de memoria RAM elevado ({ram_percent})",
                "recommendation": "Considere cerrar algunas aplicaciones para liberar memoria."
            })
        
        if swap_total != "N/A" and swap_total != "0.00 B" and swap_percent_value > 75:
            if status != "CRITICAL":
                status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "MEDIUM",
                "description": f"Uso elevado de memoria virtual ({swap_percent})",
                "recommendation": "El sistema está utilizando mucha memoria virtual, lo que puede reducir el rendimiento. Considere cerrar aplicaciones o ampliar la RAM física."
            })
        
        top_processes = system_data.get('top_processes', [])
        memory_intensive_processes = []
        for process in top_processes:
            memory_percent = process.get('memory_percent', '0%')
            memory_value = float(memory_percent.replace('%', '')) if '%' in memory_percent else 0
            if memory_value > 10:  
                memory_intensive_processes.append(process)
        
        recommendations = "La memoria RAM está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
            if memory_intensive_processes:
                recommendations += "\n\nProcesos con alto consumo de memoria:"
                for proc in memory_intensive_processes:
                    recommendations += f"\n- {proc.get('name', 'Desconocido')}: {proc.get('memory_percent', 'N/A')}"
        
        return {
            "status": status,
            "total": ram_total,
            "used": ram_used,
            "available": ram_available,
            "percent": ram_percent,
            "swap_total": swap_total,
            "swap_used": swap_used,
            "swap_percent": swap_percent,
            "memory_intensive_processes": memory_intensive_processes,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar RAM: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de memoria RAM."
        }

def analyze_disk(system_data):
    """Analiza el almacenamiento del sistema"""
    try:
        partitions = system_data.get('disk_usage', {}).get('partitions', [])
        
        status = "NORMAL"
        issues = []
        critical_partitions = []
        warning_partitions = []
        
        for partition in partitions:
            device = partition.get('device', 'Desconocido')
            mountpoint = partition.get('mountpoint', 'Desconocido')
            percent = partition.get('percent', '0%')
            
            percent_value = float(percent.replace('%', '')) if '%' in percent else 0
            
            if percent_value > 95:
                status = "CRITICAL"
                critical_partitions.append(partition)
                issues.append({
                    "type": "HARDWARE",
                    "severity": "HIGH",
                    "description": f"Espacio crítico en {mountpoint} ({percent} lleno)",
                    "recommendation": f"Libere espacio urgentemente en la unidad {device} para evitar problemas de funcionamiento."
                })
            elif percent_value > 85:
                if status != "CRITICAL":
                    status = "WARNING"
                warning_partitions.append(partition)
                issues.append({
                    "type": "HARDWARE",
                    "severity": "MEDIUM",
                    "description": f"Poco espacio disponible en {mountpoint} ({percent} lleno)",
                    "recommendation": f"Considere liberar espacio en la unidad {device} eliminando archivos innecesarios."
                })
        
        fragmentation_data = None
        if platform.system() == "Windows":
            try:
                cmd = "defrag C: /A /H"
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and "% fragmentados" in result.stdout:
                    for line in result.stdout.split('\n'):
                        if "% fragmentados" in line:
                            frag_percent = line.split('%')[0].strip().split()[-1]
                            try:
                                frag_value = float(frag_percent)
                                fragmentation_data = {
                                    "percent": f"{frag_value}%",
                                    "status": "Normal" if frag_value < 10 else "Fragmentado"
                                }
                                
                                if frag_value > 20:
                                    if status != "CRITICAL":
                                        status = "WARNING"
                                    issues.append({
                                        "type": "PERFORMANCE",
                                        "severity": "MEDIUM",
                                        "description": f"Disco altamente fragmentado ({frag_value}%)",
                                        "recommendation": "Ejecute el desfragmentador de disco para mejorar el rendimiento."
                                    })
                            except:
                                pass
                            break
            except:
                pass
        
        disk_health_data = None
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject -Namespace root\\wmi -Class MSStorageDriver_FailurePredictStatus | Select InstanceName, PredictFailure, Reason | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and result.stdout:
                    health_data = json.loads(result.stdout)
                    
                    if not isinstance(health_data, list):
                        health_data = [health_data]
                    
                    for disk in health_data:
                        if disk.get('PredictFailure', False):
                            status = "CRITICAL"
                            issues.append({
                                "type": "HARDWARE",
                                "severity": "HIGH",
                                "description": f"Predicción de fallo en disco {disk.get('InstanceName', 'Desconocido')}",
                                "recommendation": "¡ATENCIÓN! El disco podría fallar pronto. Haga copias de seguridad inmediatamente y considere reemplazar el disco."
                            })
                    
                    disk_health_data = {
                        "status": "Critical" if any(disk.get('PredictFailure', False) for disk in health_data) else "Normal",
                        "disks": health_data
                    }
            except:
                pass
        
        recommendations = "El almacenamiento está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        return {
            "status": status,
            "partitions": partitions,
            "critical_partitions": critical_partitions,
            "warning_partitions": warning_partitions,
            "fragmentation": fragmentation_data,
            "health": disk_health_data,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar almacenamiento: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de almacenamiento."
        }

def analyze_network(system_data):
    """Analiza la red del sistema"""
    try:
        network_data = system_data.get('network', {})
        sent = network_data.get('bytes_sent', 'N/A')
        recv = network_data.get('bytes_recv', 'N/A')
        connections = network_data.get('connections', 0)
        
        status = "NORMAL"
        issues = []
        
        internet_status = check_internet_connectivity()
        if not internet_status["connected"]:
            status = "CRITICAL"
            issues.append({
                "type": "NETWORK",
                "severity": "HIGH",
                "description": "Sin conexión a Internet",
                "recommendation": "Verifique su conexión de red, router o contacte con su proveedor de servicios de Internet."
            })
        
        if internet_status["connected"] and internet_status["ping"] > 150:
            if status != "CRITICAL":
                status = "WARNING"
            issues.append({
                "type": "NETWORK",
                "severity": "MEDIUM",
                "description": f"Latencia de red alta ({internet_status['ping']} ms)",
                "recommendation": "La velocidad de respuesta de su conexión es lenta. Verifique si hay otras aplicaciones usando el ancho de banda o contacte con su proveedor de Internet."
            })
        
        wifi_status = None
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-NetAdapter | Where-Object {$_.InterfaceDescription -match 'wireless|wi-fi|wifi|wlan|802.11'} | Select Name, Status, LinkSpeed | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and result.stdout:
                    wifi_data = json.loads(result.stdout)
                    
                    if not isinstance(wifi_data, list):
                        wifi_data = [wifi_data]
                    
                    for adapter in wifi_data:
                        if adapter.get('Status') != 'Up':
                            if status != "CRITICAL":
                                status = "WARNING"
                            issues.append({
                                "type": "NETWORK",
                                "severity": "MEDIUM",
                                "description": f"Adaptador Wi-Fi {adapter.get('Name', 'Desconocido')} no está activo",
                                "recommendation": "Verifique que su adaptador Wi-Fi esté habilitado y funcionando correctamente."
                            })
                    
                    wifi_status = wifi_data
            except:
                pass
        
        recommendations = "La conexión de red está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        return {
            "status": status,
            "data_sent": sent,
            "data_received": recv,
            "connections": connections,
            "internet_status": internet_status,
            "wifi_status": wifi_status,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar red: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de red."
        }

def check_internet_connectivity():
    """Verifica la conectividad a Internet"""
    try:
        # Intentar ping a Google DNS
        hosts = ['8.8.8.8', '1.1.1.1', 'www.google.com']
        connected = False
        ping_time = 0
        
        for host in hosts:
            if platform.system() == "Windows":
                cmd = f"ping -n 1 -w 1000 {host}"
            else:
                cmd = f"ping -c 1 -W 1 {host}"
            
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
            
            if result.returncode == 0:
                connected = True
                
                # Extraer tiempo de ping
                if "tiempo=" in result.stdout or "time=" in result.stdout:
                    for line in result.stdout.split('\n'):
                        if "tiempo=" in line or "time=" in line:
                            try:
                                if "tiempo=" in line:
                                    ping_time = float(line.split('tiempo=')[1].split('ms')[0].strip())
                                else:
                                    ping_time = float(line.split('time=')[1].split('ms')[0].strip())
                            except:
                                pass
                            break
                
                break
        
        return {
            "connected": connected,
            "ping": ping_time,
            "status": "Normal" if connected else "Sin conexión"
        }
    except:
        return {
            "connected": False,
            "ping": 0,
            "status": "Error al verificar"
        }

def analyze_gpu(system_data):
    """Analiza la tarjeta gráfica del sistema"""
    try:
        gpu_info = system_data.get('gpu_info', [])
        
        if not gpu_info:
            return {
                "status": "UNKNOWN",
                "message": "No se detectó ninguna GPU en el sistema",
                "issues": [],
                "recommendations": "No se encontró información de tarjeta gráfica."
            }
        
        status = "NORMAL"
        issues = []
        
        if platform.system() == "Windows":
            for gpu in gpu_info:
                gpu_name = gpu.get('name', 'Desconocido')
                gpu_driver = gpu.get('driver', 'Desconocido')
                
                if "básico" in gpu_name.lower() or "basic" in gpu_name.lower() or "Microsoft" in gpu_driver:
                    status = "WARNING"
                    issues.append({
                        "type": "DRIVER",
                        "severity": "MEDIUM",
                        "description": f"Controlador genérico o básico para {gpu_name}",
                        "recommendation": "Instale el controlador específico del fabricante para mejorar el rendimiento y funcionalidad de su tarjeta gráfica."
                    })
                
                try:
                    if gpu_driver != "Desconocido" and ("NVIDIA" in gpu_name or "AMD" in gpu_name or "Intel" in gpu_name):
                        current_version = gpu_driver.split('.')
                        if len(current_version) >= 2:
                            latest_version = f"{current_version[0]}.{int(current_version[1]) + 1}"
                            if status != "WARNING":
                                status = "WARNING"
                            issues.append({
                                "type": "DRIVER",
                                "severity": "LOW",
                                "description": f"Actualización disponible para {gpu_name}",
                                "recommendation": f"Se recomienda actualizar el controlador de su tarjeta gráfica de la versión {gpu_driver} a la versión {latest_version}."
                            })
                except:
                    pass
        
        recommendations = "La tarjeta gráfica está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        return {
            "status": status,
            "gpus": gpu_info,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar GPU: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de la tarjeta gráfica."
        }

def analyze_battery(system_data):
    """Analiza la batería del sistema"""
    try:
        battery_data = system_data.get('battery')
        
        if not battery_data:
            return {
                "status": "UNKNOWN",
                "message": "No se detectó batería en el sistema",
                "issues": [],
                "recommendations": "Este dispositivo no tiene batería o no se pudo detectar."
            }
        
        status = "NORMAL"
        issues = []
        
        battery_percent = battery_data.get('percent', '0%')
        power_plugged = battery_data.get('power_plugged', False)
        secsleft = battery_data.get('secsleft')
        
        percent_value = float(battery_percent.replace('%', '')) if '%' in battery_percent else 0
        
        if not power_plugged:
            if percent_value < 10:
                status = "CRITICAL"
                issues.append({
                    "type": "HARDWARE",
                    "severity": "HIGH",
                    "description": f"Batería extremadamente baja ({battery_percent})",
                    "recommendation": "Conecte su equipo a la corriente inmediatamente para evitar pérdida de datos."
                })
            elif percent_value < 20:
                status = "WARNING"
                issues.append({
                    "type": "HARDWARE",
                    "severity": "MEDIUM",
                    "description": f"Batería baja ({battery_percent})",
                    "recommendation": "Conecte su equipo a la corriente pronto."
                })
        
        battery_health = None
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject Win32_Battery | Select DesignCapacity, FullChargeCapacity | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and result.stdout:
                    health_data = json.loads(result.stdout)
                    
                    if not isinstance(health_data, list):
                        health_data = [health_data]
                    
                    for battery in health_data:
                        design_capacity = battery.get('DesignCapacity', 0)
                        full_charge_capacity = battery.get('FullChargeCapacity', 0)
                        
                        if design_capacity > 0 and full_charge_capacity > 0:
                            health_percent = (full_charge_capacity / design_capacity) * 100
                            
                            battery_health = {
                                "health_percent": f"{health_percent:.1f}%",
                                "status": "Normal" if health_percent >= 70 else "Degradada"
                            }
                            
                            if health_percent < 50:
                                if status != "CRITICAL":
                                    status = "WARNING"
                                issues.append({
                                    "type": "HARDWARE",
                                    "severity": "MEDIUM",
                                    "description": f"Salud de batería deteriorada ({health_percent:.1f}%)",
                                    "recommendation": "La capacidad de su batería está significativamente reducida. Considere reemplazarla para mejorar la autonomía."
                                })
            except:
                pass
        
        recommendations = "La batería está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        time_remaining = "Desconocido"
        if secsleft and secsleft != -1:
            hours = secsleft // 3600
            minutes = (secsleft % 3600) // 60
            time_remaining = f"{hours}h {minutes}m"
        
        return {
            "status": status,
            "percent": battery_percent,
            "power_plugged": power_plugged,
            "time_remaining": time_remaining,
            "health": battery_health,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar batería: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de la batería."
        }
        
        
EXCLUDED_DRIVERS = [
    "WAN Miniport (Network Monitor)",
    "WAN Miniport (IPv6)", 
    "WAN Miniport (IP)",
    "WAN Miniport (PPPOE)",
    "WAN Miniport (PPTP)",
    "WAN Miniport (L2TP)",
    "WAN Miniport (SSTP)",
    "WAN Miniport (IKEv2)",
    "Root Print Queue",
    "Local Print Queue",
    "Print Queue",
    "Computer Device",
    "NDIS Virtual Network Adapter Enumerator",
    "Steam Streaming Speakers",
    "Microsoft Kernel Debug Network Adapter",
    "Microsoft ISATAP Adapter",
    "Microsoft Teredo Tunneling Adapter",
    "Microsoft 6to4 Adapter",
    "Microsoft WiFi Direct Virtual Adapter",
    "Composite Bus Enumerator",
    "Microsoft System Management BIOS Driver",
    "High Definition Audio Controller",
    "Generic software device",
    "System Speaker",
    "Programmable Interrupt Controller",
    "System Timer",
    "Direct Memory Access Controller",
    "System CMOS/real time clock",
    "Motherboard resources",
    "PCI Bus",
    "Microsoft Basic Display Adapter",
    "Microsoft Basic Render Driver",
    "HID-compliant consumer control device",
    "HID-compliant system controller",
    "HID-compliant vendor-defined device",
    "Plug and Play Software Device Enumerator",
    "Microsoft Windows Management Interface for ACPI",
    "Volume Manager",
    "Logical Disk Manager",
    "Microsoft Streaming Service Proxy",
    "Remote Desktop Device Redirector Bus"
]


import re
from datetime import datetime

def is_excluded(driver_name):
    if not driver_name or driver_name in [None, '', 'Desconocido', 'None']:
        return True
        
    driver_name_clean = str(driver_name).lower().strip()
    
    system_patterns = [
        r'wan miniport.*',
        r'.*print queue.*',
        r'computer device',
        r'ndis virtual.*',
        r'steam streaming.*',
        r'microsoft.*adapter',
        r'microsoft kernel debug.*',
        r'microsoft isatap.*',
        r'microsoft teredo.*',
        r'microsoft 6to4.*',
        r'microsoft wifi direct.*',
        r'composite bus enumerator',
        r'system management bios',
        r'generic software device',
        r'system speaker',
        r'programmable interrupt.*',
        r'system timer',
        r'direct memory access.*',
        r'system cmos.*',
        r'motherboard resources',
        r'pci bus',
        r'microsoft basic.*',
        r'high definition audio controller',
        r'plug and play.*enumerator',
        r'.*management interface.*acpi',
        r'volume manager',
        r'logical disk manager',
        r'streaming service proxy',
        r'remote desktop.*redirector',
        r'hid-compliant consumer control.*',
        r'hid-compliant system controller',
        r'hid-compliant vendor-defined.*'
    ]
    
    for pattern in system_patterns:
        if re.search(pattern, driver_name_clean):
            return True
    
    for excluded in EXCLUDED_DRIVERS:
        if excluded.lower() in driver_name_clean:
            return True
    
    if any(year in driver_name_clean for year in ['2006', '2001', '1999', '2000']):
        if any(keyword in driver_name_clean for keyword in [
            'microsoft', 'system', 'basic', 'generic', 'standard', 'pnp', 'acpi', 'computer', 'ndis'
        ]):
            return True
    
    return False

def is_legitimate_device_error(device_name, error_code):
    if not device_name or device_name in [None, '', 'Desconocido', 'None']:
        return False
        
    if is_excluded(device_name):
        return False
    
    device_name_lower = str(device_name).lower()
    
    ignorable_combinations = [
        ('wan miniport', [22, 24, 28]),
        ('print queue', [22, 24]),
        ('microsoft', [22, 28]),
        ('computer device', [22, 24, 28]),
        ('ndis virtual', [22, 24, 28]),
        ('steam streaming', [22, 24, 28]),
    ]
    
    for device_pattern, error_codes in ignorable_combinations:
        if device_pattern in device_name_lower and error_code in error_codes:
            return False
    
    return True




import re
from datetime import datetime

class DriverAnalyzer:
    def __init__(self):
        self.system_keywords = [
            'microsoft', 'system', 'basic', 'standard', 'generic', 'pnp', 'acpi', 
            'computer', 'ndis', 'steam', 'firmware', 'bios', 'uefi', 'root', 'composite'
        ]
        
        self.virtual_patterns = [
            r'wan miniport.*', r'.*print queue.*', r'microsoft.*adapter',
            r'virtual.*', r'.*enumerator.*', r'.*redirector.*'
        ]
        
        self.firmware_patterns = [
            r'device firmware.*', r'.*firmware.*', r'.*bios.*', r'.*uefi.*',
            r'system.*firmware.*', r'.*rom.*'
        ]
        
        # NUEVO: Patrones específicos para controladores de procesador
        self.processor_patterns = [
            r'amd.*processor.*', r'intel.*processor.*', r'.*processor.*',
            r'amd.*cpu.*', r'intel.*cpu.*', r'.*cpu.*driver.*',
            r'processor.*driver.*', r'cpu.*driver.*'
        ]
        
        # NUEVO: Patrones de controladores integrados del sistema
        self.integrated_system_patterns = [
            r'amd.*processor.*', r'intel.*processor.*',
            r'amd.*cpu.*', r'intel.*cpu.*',
            r'processor.*device.*', r'cpu.*device.*',
            r'motherboard.*', r'chipset.*', r'platform.*device.*',
            r'system.*device.*', r'root.*device.*'
        ]

    def calculate_system_score(self, device_name, driver_date, manufacturer=None):
        if not device_name:
            return 100
            
        score = 0
        device_lower = device_name.lower()
        
        # NUEVO: Puntuación muy alta para controladores de procesador
        if any(re.search(pattern, device_lower) for pattern in self.processor_patterns):
            score += 85  # Casi garantiza exclusión
            
        # NUEVO: Puntuación alta para controladores integrados del sistema
        if any(re.search(pattern, device_lower) for pattern in self.integrated_system_patterns):
            score += 70
        
        # Nombres genéricos muy probablemente del sistema
        generic_names = ['disk drive', 'usb device', 'pci device', 'hid device', 
                        'unknown device', 'composite device', 'generic']
        if any(generic in device_lower for generic in generic_names):
            score += 60
            
        if any(keyword in device_lower for keyword in self.system_keywords):
            score += 30
            
        if any(re.search(pattern, device_lower) for pattern in self.virtual_patterns):
            score += 40
            
        if any(re.search(pattern, device_lower) for pattern in self.firmware_patterns):
            score += 50
            
        if manufacturer and 'microsoft' in manufacturer.lower():
            score += 25
            
        # Si tiene fecha de era del sistema (2006, 2001, etc.) y nombre genérico = definitivamente sistema
        if driver_date and self._is_system_era_date(driver_date):
            score += 30
            # NUEVO: Puntuación extra para procesadores con fechas del sistema
            if any(re.search(pattern, device_lower) for pattern in self.processor_patterns):
                score += 40
            if any(generic in device_lower for generic in ['disk drive', 'device', 'generic']):
                score += 40
            
        if any(term in device_lower for term in ['legacy', 'compatibility', 'emulation']):
            score += 15
            
        # Penalty para hardware específico con fabricantes conocidos - MODIFICADO
        hardware_vendors = ['nvidia', 'amd', 'intel', 'realtek', 'broadcom', 'qualcomm']
        vendor_found = any(vendor in device_lower for vendor in hardware_vendors)
        
        # NUEVO: No aplicar penalty si es un controlador de procesador
        if vendor_found and not any(re.search(pattern, device_lower) for pattern in self.processor_patterns):
            # Solo aplicar penalty si NO es un controlador de procesador
            if not any(proc_term in device_lower for proc_term in ['processor', 'cpu']):
                score -= 20
            
        return min(max(score, 0), 100)

    def _is_system_era_date(self, date_str):
        # Fechas típicas de controladores del sistema de Windows
        system_years = ['2001', '2006', '2009', '1999', '2000', '2007', '2008']
        system_dates = ['2006-06-21', '2001-07-01', '2009-07-14']  # Fechas específicas comunes
        
        date_str = str(date_str)
        return (any(year in date_str for year in system_years) or 
                any(date in date_str for date in system_dates))

    def is_critical_hardware(self, device_name):
        if not device_name:
            return False
            
        device_lower = device_name.lower()
        
        if any(re.search(pattern, device_lower) for pattern in self.processor_patterns):
            return False
            
        if any(re.search(pattern, device_lower) for pattern in self.integrated_system_patterns):
            return False
        
        generic_exclusions = [
            'disk drive', 'generic', 'standard', 'basic', 'unknown device',
            'pci device', 'usb device', 'hid device', 'composite device',
            'processor', 'cpu'  
        ]
        
        if any(exclusion in device_lower for exclusion in generic_exclusions):
            return False
        
        critical_patterns = [
            r'nvidia.*', r'amd.*radeon.*', r'amd.*rx.*', r'amd.*hd.*',  
            r'intel.*graphics.*', r'intel.*iris.*', r'intel.*uhd.*',   
            r'geforce.*', r'quadro.*', r'.*gtx.*', r'.*rtx.*',
            r'realtek.*', r'broadcom.*', r'qualcomm.*', r'intel.*wireless.*',
            r'.*ethernet.*controller.*', r'.*wifi.*adapter.*',
            r'creative.*', r'sound blaster.*', r'realtek.*audio.*',
            r'.*nvme.*ssd.*', r'samsung.*ssd.*', r'western digital.*',
            r'seagate.*', r'toshiba.*', r'crucial.*'
        ]
        
        return any(re.search(pattern, device_lower) for pattern in critical_patterns)

    def should_exclude_driver(self, device_name, driver_date=None, manufacturer=None):
        if not device_name or device_name in [None, '', 'Desconocido', 'None']:
            return True
            
        device_lower = device_name.lower()
        
        if any(re.search(pattern, device_lower) for pattern in self.processor_patterns):
            logger.info(f"Excluyendo controlador de procesador: {device_name}")
            return True
            
        if any(re.search(pattern, device_lower) for pattern in self.integrated_system_patterns):
            logger.info(f"Excluyendo controlador integrado del sistema: {device_name}")
            return True
        
        immediate_exclusions = [
            'disk drive', 'usb device', 'pci device', 'unknown device',
            'generic software device', 'composite device', 'processor', 'cpu'
        ]
        
        if any(exclusion in device_lower for exclusion in immediate_exclusions):
            return True
            
        system_score = self.calculate_system_score(device_name, driver_date, manufacturer)
        
        # Umbrales más estrictos
        if system_score >= 80:  # Muy probablemente del sistema
            return True
            
        if system_score >= 60:  # Probablemente del sistema
            # Solo mantener si es hardware específico con fabricante conocido Y NO es procesador
            hardware_vendors = ['nvidia', 'amd', 'intel', 'realtek', 'broadcom', 'qualcomm']
            vendor_found = any(vendor in device_lower for vendor in hardware_vendors)
            is_processor = any(proc_term in device_lower for proc_term in ['processor', 'cpu'])
            
            if not vendor_found or is_processor:
                return True
                
        if system_score >= 40 and not self.is_critical_hardware(device_name):
            return True
            
        return False

    def should_exclude_error(self, device_name, error_code):
        if not device_name:
            return True
            
        if self.should_exclude_driver(device_name):
            return True
            
        device_lower = device_name.lower()
        
        # NUEVO: Excluir errores de procesador
        if any(re.search(pattern, device_lower) for pattern in self.processor_patterns):
            return True
        
        non_critical_errors = {
            22: ['disabled', 'virtual', 'miniport', 'print', 'processor', 'cpu'],
            24: ['not present', 'virtual', 'optional', 'processor', 'cpu'],
            28: ['disabled', 'optional', 'processor', 'cpu']
        }
        
        if error_code in non_critical_errors:
            keywords = non_critical_errors[error_code]
            if any(keyword in device_lower for keyword in keywords):
                return True
                
        return False

def analyze_drivers(system_data):
    analyzer = DriverAnalyzer()
    
    try:
        drivers_info = []
        outdated_drivers = []
        problematic_drivers = []
        
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject Win32_PnPSignedDriver | Select DeviceName, DriverVersion, DriverDate, Manufacturer | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if result.returncode == 0 and result.stdout:
                    drivers_data = json.loads(result.stdout)
                    
                    if not isinstance(drivers_data, list):
                        drivers_data = [drivers_data]
                    
                    logger.info(f"Analizando {len(drivers_data)} controladores...")
                    
                    for driver in drivers_data:
                        device_name = driver.get('DeviceName')
                        
                        if not device_name or device_name in [None, '', 'None']:
                            continue
                            
                        device_name = str(device_name).strip()
                        if not device_name or device_name == 'Desconocido':
                            continue
                            
                        driver_version = driver.get('DriverVersion', 'Desconocido')
                        driver_date_str = driver.get('DriverDate', '')
                        manufacturer = driver.get('Manufacturer', '')
                        
                        driver_date = "Desconocida"
                        if driver_date_str:
                            try:
                                date_parts = str(driver_date_str).split('.')[0]
                                if len(date_parts) >= 8:
                                    year = date_parts[:4]
                                    month = date_parts[4:6] 
                                    day = date_parts[6:8]
                                    driver_date = f"{year}-{month}-{day}"
                            except:
                                pass
                        
                        driver_info = {
                            "name": device_name,
                            "version": driver_version,
                            "date": driver_date,
                            "manufacturer": manufacturer,
                            "status": "Normal"
                        }
                        
                        # Verificar si debe excluirse
                        if analyzer.should_exclude_driver(device_name, driver_date, manufacturer):
                            driver_info["status"] = "Sistema (excluido)"
                            drivers_info.append(driver_info)
                            logger.debug(f"Controlador excluido: {device_name}")
                            continue
                        
                        # Verificar antigüedad solo para hardware NO excluido
                        try:
                            if driver_date != "Desconocida":
                                date_obj = datetime.strptime(driver_date, "%Y-%m-%d")
                                years_old = (datetime.now() - date_obj).days / 365
                                
                                # Solo reportar hardware específico muy antiguo
                                if years_old > 12:
                                    if analyzer.is_critical_hardware(device_name):
                                        system_score = analyzer.calculate_system_score(device_name, driver_date, manufacturer)
                                        
                                        logger.info(f"Evaluando {device_name}: score={system_score}, years_old={years_old:.1f}")
                                        
                                        # MUY estricto: score muy bajo Y fabricante conocido Y no es procesador
                                        if system_score < 15:  # Reducido de 20 a 15
                                            hardware_vendors = ['nvidia', 'amd', 'intel', 'realtek', 'broadcom', 'qualcomm']
                                            vendor_found = any(vendor in device_name.lower() for vendor in hardware_vendors)
                                            is_processor = any(proc in device_name.lower() for proc in ['processor', 'cpu'])
                                            
                                            if vendor_found and not is_processor:
                                                logger.warning(f"Controlador realmente antiguo: {device_name} ({driver_date})")
                                                driver_info["status"] = "Desactualizado"
                                                outdated_drivers.append(driver_info)
                        except Exception as e:
                            logger.error(f"Error al procesar fecha para {device_name}: {str(e)}")
                        
                        drivers_info.append(driver_info)
            except Exception as e:
                logger.error(f"Error al obtener drivers: {str(e)}")
        
        # Resto del código para dispositivos problemáticos...
        try:
            if platform.system() == "Windows":
                cmd = "powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {$_.ConfigManagerErrorCode -ne 0} | Select Caption, ConfigManagerErrorCode, HardwareID | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
                
                if result.returncode == 0 and result.stdout and result.stdout.strip():
                    problem_data = json.loads(result.stdout)
                    
                    if not isinstance(problem_data, list):
                        problem_data = [problem_data]
                    
                    for device in problem_data:
                        device_name = device.get('Caption', 'Dispositivo desconocido')
                        error_code = device.get('ConfigManagerErrorCode', 0)
                        hardware_id = device.get('HardwareID', [])
                        
                        if not analyzer.should_exclude_error(device_name, error_code):
                            if analyzer.is_critical_hardware(device_name) or error_code in [1, 3, 10, 12, 14, 43]:
                                problem_info = {
                                    "name": device_name,
                                    "error_code": error_code,
                                    "hardware_id": hardware_id,
                                    "status": "Error"
                                }
                                problematic_drivers.append(problem_info)
        except Exception as e:
            logger.error(f"Error al obtener dispositivos problemáticos: {str(e)}")
        
        status = "NORMAL"
        issues = []
        
        critical_problems = [p for p in problematic_drivers if p['error_code'] in [1, 3, 10, 12, 14, 43]]
        
        if critical_problems:
            status = "CRITICAL"
            for driver in critical_problems:
                issues.append({
                    "type": "DRIVER",
                    "severity": "HIGH",
                    "description": f"Error crítico en {driver['name']} (Código: {driver['error_code']})",
                    "recommendation": "Reinstale o actualice urgentemente este controlador."
                })
        
        legitimate_outdated = [d for d in outdated_drivers 
                             if not analyzer.should_exclude_driver(d['name'], d['date'], d.get('manufacturer'))]
        
        if legitimate_outdated and status != "CRITICAL":
            status = "WARNING"
            
            for driver in legitimate_outdated[:2]:
                issues.append({
                    "type": "DRIVER", 
                    "severity": "MEDIUM",
                    "description": f"Hardware crítico con controlador muy antiguo: {driver['name']} ({driver['date']})",
                    "recommendation": f"Actualice urgentemente el controlador de {driver['name']} para evitar problemas de compatibilidad."
                })
        
        logger.info(f"Análisis completado: {len(drivers_info)} controladores, {len(legitimate_outdated)} desactualizados, {len(critical_problems)} con problemas")
        
        recommendations = "Todos los controladores críticos están funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        return {
            "status": status,
            "drivers": drivers_info,
            "problematic_drivers": critical_problems,
            "outdated_drivers": legitimate_outdated,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Error general en analyze_drivers: {str(e)}")
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar controladores: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de controladores."
        }

def analyze_software(system_data):
    """Analiza el software instalado en el sistema"""
    try:
        installed_software = []
        large_programs = []
        recently_installed = []
        
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject Win32_Product | Select Name, Vendor, Version, InstallDate | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if result.returncode == 0 and result.stdout:
                    software_data = json.loads(result.stdout)
                    
                    if not isinstance(software_data, list):
                        software_data = [software_data]
                    
                    for program in software_data[:50]:
                        name = program.get('Name', 'Desconocido')
                        vendor = program.get('Vendor', 'Desconocido')
                        version = program.get('Version', 'Desconocido')
                        install_date_str = program.get('InstallDate', '')
                        
                        install_date = "Desconocida"
                        if install_date_str:
                            try:
                                year = install_date_str[:4]
                                month = install_date_str[4:6]
                                day = install_date_str[6:8]
                                install_date = f"{year}-{month}-{day}"
                            except:
                                pass
                        
                        program_info = {
                            "name": name,
                            "vendor": vendor,
                            "version": version,
                            "install_date": install_date
                        }
                        
                        installed_software.append(program_info)
                        
                        try:
                            if install_date != "Desconocida":
                                date_obj = datetime.strptime(install_date, "%Y-%m-%d")
                                days_ago = (datetime.now() - date_obj).days
                                
                                if days_ago <= 7:
                                    recently_installed.append(program_info)
                        except:
                            pass
            except:
                pass
        
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-AppxPackage | Sort-Object -Property Size -Descending | Select-Object -First 10 | Select Name, Version, Size | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
                
                if result.returncode == 0 and result.stdout:
                    appx_data = json.loads(result.stdout)
                    
                    if not isinstance(appx_data, list):
                        appx_data = [appx_data]
                    
                    for app in appx_data:
                        name = app.get('Name', 'Desconocido')
                        size = app.get('Size', 0)
                        
                        if size > 1000000000: 
                            large_programs.append({
                                "name": name,
                                "size": get_size_str(size),
                                "type": "Microsoft Store"
                            })
            except:
                pass
        
        status = "NORMAL"
        issues = []
        
        startup_programs = []
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-CimInstance Win32_StartupCommand | Select Name, Command, Location | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
                
                if result.returncode == 0 and result.stdout:
                    startup_data = json.loads(result.stdout)
                    
                    if not isinstance(startup_data, list):
                        startup_data = [startup_data]
                    
                    startup_programs = startup_data
                    
                    if len(startup_programs) > 10:
                        status = "WARNING"
                        issues.append({
                            "type": "PERFORMANCE",
                            "severity": "MEDIUM",
                            "description": f"Demasiados programas de inicio automático ({len(startup_programs)})",
                            "recommendation": "Reduzca el número de programas que se inician automáticamente para mejorar el tiempo de arranque."
                        })
            except:
                pass
        
        if len(installed_software) > 100:
            if status != "WARNING":
                status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "LOW",
                "description": f"Gran cantidad de programas instalados ({len(installed_software)})",
                "recommendation": "Considere desinstalar aplicaciones que ya no utiliza para liberar espacio y recursos."
            })
        
        if large_programs:
            if status != "WARNING":
                status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "LOW",
                "description": f"Aplicaciones que ocupan mucho espacio ({len(large_programs)})",
                "recommendation": "Considere desinstalar o trasladar a otro disco las aplicaciones de gran tamaño que no utilice frecuentemente."
            })
        
        recommendations = "El software del sistema está en buen estado."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
            
            if startup_programs:
                recommendations += "\n\nProgramas de inicio automático:"
                for prog in startup_programs[:5]:
                    recommendations += f"\n- {prog.get('Name', 'Desconocido')}"
                if len(startup_programs) > 5:
                    recommendations += f"\n...y {len(startup_programs) - 5} más."
            
            if large_programs:
                recommendations += "\n\nProgramas que ocupan más espacio:"
                for prog in large_programs[:3]:
                    recommendations += f"\n- {prog['name']} ({prog['size']})"
        
        return {
            "status": status,
            "installed_count": len(installed_software),
            "recently_installed": recently_installed,
            "large_programs": large_programs,
            "startup_programs": startup_programs,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar software: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de software."
        }

def analyze_security(system_data):
    """Analiza la seguridad del sistema"""
    try:
        status = "NORMAL"
        issues = []
        
        firewall_status = check_firewall_status()
        if not firewall_status["enabled"]:
            status = "CRITICAL"
            issues.append({
                "type": "SECURITY",
                "severity": "HIGH",
                "description": "Firewall desactivado",
                "recommendation": "Active el firewall de Windows para proteger su equipo contra amenazas de red."
            })
        
        antivirus_status = check_antivirus_status()
        if not antivirus_status["enabled"]:
            status = "CRITICAL"
            issues.append({
                "type": "SECURITY",
                "severity": "HIGH",
                "description": "Protección antivirus desactivada",
                "recommendation": "Active la protección antivirus para proteger su equipo contra malware."
            })
        
        updates_status = check_windows_updates() if platform.system() == "Windows" else {"status": "Unknown"}
        if updates_status["status"] == "UpdatesAvailable":
            if status != "CRITICAL":
                status = "WARNING"
            issues.append({
                "type": "SECURITY",
                "severity": "MEDIUM",
                "description": f"Actualizaciones pendientes ({updates_status.get('count', 'varias')})",
                "recommendation": "Instale las actualizaciones de seguridad disponibles para mantener su sistema protegido."
            })
        
        if platform.system() == "Windows":
            uac_status = check_uac_status()
            if not uac_status["enabled"]:
                if status != "CRITICAL":
                    status = "WARNING"
                issues.append({
                    "type": "SECURITY",
                    "severity": "MEDIUM",
                    "description": "Control de cuentas de usuario (UAC) desactivado",
                    "recommendation": "Active el Control de cuentas de usuario para proteger su sistema contra cambios no autorizados."
                })
        
        recommendations = "La seguridad del sistema está en buen estado."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        return {
            "status": status,
            "firewall": firewall_status,
            "antivirus": antivirus_status,
            "updates": updates_status,
            "issues": issues,
            "recommendations": recommendations
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "issues": [{
                "type": "OTHER",
                "severity": "MEDIUM",
                "description": f"Error al analizar seguridad: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de seguridad."
        }

def check_firewall_status():
    """Verifica el estado del firewall"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-NetFirewallProfile | Select Name, Enabled | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                firewall_data = json.loads(result.stdout)
                
                if not isinstance(firewall_data, list):
                    firewall_data = [firewall_data]
                
                enabled = any(profile.get('Enabled', False) for profile in firewall_data)
                
                return {
                    "enabled": enabled,
                    "profiles": firewall_data,
                    "status": "Activo" if enabled else "Inactivo"
                }
        elif platform.system() == "Linux":
            cmd = "sudo ufw status"
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0:
                enabled = "active" in result.stdout.lower() or "activo" in result.stdout.lower()
                return {
                    "enabled": enabled,
                    "status": "Activo" if enabled else "Inactivo"
                }
        
        return {
            "enabled": False,
            "status": "Desconocido"
        }
    except:
        return {
            "enabled": False,
            "status": "Error al verificar"
        }

def check_antivirus_status():
    """Verifica el estado del antivirus"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-MpComputerStatus | Select AntivirusEnabled, RealTimeProtectionEnabled, IoavProtectionEnabled, AntispywareEnabled | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                defender_data = json.loads(result.stdout)
                
                antivirus_enabled = defender_data.get('AntivirusEnabled', False)
                realtime_protection = defender_data.get('RealTimeProtectionEnabled', False)
                
                return {
                    "enabled": antivirus_enabled,
                    "realtime_protection": realtime_protection,
                    "name": "Windows Defender",
                    "status": "Activo" if antivirus_enabled else "Inactivo"
                }
            
            cmd = "powershell \"Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select displayName, productState | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                antivirus_data = json.loads(result.stdout)
                
                if not isinstance(antivirus_data, list):
                    antivirus_data = [antivirus_data]
                
                for av in antivirus_data:
                    name = av.get('displayName', 'Desconocido')
                    product_state = av.get('productState', 0)
                    
                    enabled = (product_state & 0x1000) != 0
                    
                    if enabled:
                        return {
                            "enabled": True,
                            "name": name,
                            "status": "Activo"
                        }
        
        return {
            "enabled": False,
            "name": "No detectado",
            "status": "Inactivo"
        }
    except:
        return {
            "enabled": False,
            "name": "Error al detectar",
            "status": "Error al verificar"
        }

def check_windows_updates():
    """Verifica el estado de actualizaciones de Windows"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Install-Module -Name PSWindowsUpdate -Force -Scope CurrentUser; Get-WindowsUpdate | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0 and result.stdout and "KB" in result.stdout:
                updates_data = json.loads(result.stdout)
                
                if not isinstance(updates_data, list):
                    updates_data = [updates_data]
                
                return {
                    "status": "UpdatesAvailable",
                    "count": len(updates_data),
                    "updates": updates_data
                }
            else:
                return {
                    "status": "UpToDate",
                    "count": 0
                }
        
        return {
            "status": "Unknown",
            "count": 0
        }
    except:
        return {
            "status": "Error",
            "count": 0
        }

def check_uac_status():
    """Verifica el estado del Control de cuentas de usuario"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System' -Name 'EnableLUA' | Select-Object EnableLUA\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and "EnableLUA" in result.stdout:
                for line in result.stdout.split('\n'):
                    if "EnableLUA" in line and ":" in line:
                        value = line.split(':')[1].strip()
                        try:
                            enabled = int(value) == 1
                            return {
                                "enabled": enabled,
                                "status": "Activo" if enabled else "Inactivo"
                            }
                        except:
                            pass
        
        return {
            "enabled": True,
            "status": "Desconocido"
        }
    except:
        return {
            "enabled": True,
            "status": "Error al verificar"
        }

@login_required
@user_passes_test(is_client)
@csrf_exempt
def start_diagnostic_scan(request):
    """API para iniciar un escaneo de diagnóstico"""
    try:
        if request.method == 'POST':
            logger.debug("Iniciando diagnóstico")

            scan_type = request.POST.get("scan_type", "QuickScan")
            components = request.POST.get("components", "[]")

            try:
                components = json.loads(components)
                if not isinstance(components, list):
                    raise ValueError("components debe ser una lista")
            except Exception as e:
                logger.error(f"Error al procesar components: {e}")
                return JsonResponse({"status": "error", "message": "Formato inválido para components"}, status=400)

            logger.debug(f"scan_type: {scan_type}, components: {components}")

            try:
                system_data = get_system_data()
                logger.debug(f"Datos del sistema obtenidos: {system_data}")
            except Exception as e:
                logger.error(f"Error al obtener datos del sistema: {e}")
                return JsonResponse({"status": "error", "message": "Error al obtener datos del sistema"}, status=500)

            try:
                diagnosis = create_diagnosis_entry(request.user, system_data, scan_type)
                logger.debug(f"Diagnóstico creado: {diagnosis}")
            except Exception as e:
                logger.error(f"Error al crear diagnóstico: {e}")
                return JsonResponse({"status": "error", "message": "Error al crear diagnóstico"}, status=500)

            return JsonResponse({
                "status": "success",
                "message": "Diagnóstico iniciado correctamente",
                "diagnosis_id": diagnosis.id
            })
        else:
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
    except Exception as e:
        logger.error(f"Excepción general: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)



@login_required
@user_passes_test(is_client)
def get_diagnostic_progress(request):
    """API para obtener el progreso del diagnóstico actual"""
    try:
        diagnosis_id = request.GET.get('diagnosis_id')
        
        print(f"Solicitud de progreso para diagnosis_id={diagnosis_id}")
        
        if diagnosis_id:
            try:
                diagnosis = Diagnosis.objects.get(id=diagnosis_id, user=request.user)
                report = DiagnosticReport.objects.filter(
                    diagnosis=diagnosis
                ).order_by('-start_time').first()
                
                if report:
                    print(f"Reporte encontrado: id={report.id}, progress={report.progress}, status={report.status}")
                else:
                    print(f"No se encontró reporte para diagnosis_id={diagnosis_id}, verificando si hay un reporte en progreso")
                    report = DiagnosticReport.objects.filter(
                        user=request.user, 
                        status="En progreso"
                    ).order_by('-start_time').first()
                    
                    if report:
                        print(f"Reporte en progreso: id={report.id}, progress={report.progress}")
            except Diagnosis.DoesNotExist:
                print(f"Diagnóstico con id={diagnosis_id} no encontrado")
                report = None
        else:
            report = DiagnosticReport.objects.filter(
                user=request.user
            ).order_by('-start_time').first()
        
        if not report:
            print("No se encontró ningún reporte de diagnóstico")
            return JsonResponse({
                "status": "success",
                "data": {
                    "progress": 0,
                    "status": "No iniciado",
                    "component": ""
                }
            })
        
        response_data = {
            "status": "success",
            "data": {
                "progress": report.progress,
                "status": report.status,
                "component": report.current_component or "",
                "report_id": report.id
            }
        }
        print(f"Respondiendo con: {response_data}")
        return JsonResponse(response_data)
    except Exception as e:
        print(f"Error en get_diagnostic_progress: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def get_diagnostic_report(request, report_id):
    """API para obtener un informe de diagnóstico específico"""
    try:
        report = DiagnosticReport.objects.get(id=report_id, user=request.user)
        
        diagnosis = report.diagnosis
        
        components = SystemComponent.objects.filter(report=report)
        
        issues = DiagnosticIssue.objects.filter(diagnosis=diagnosis)
        
        report_data = {
            "id": report.id,
            "diagnosis_id": diagnosis.id,
            "status": report.status,
            "progress": report.progress,
            "start_time": report.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            "completion_time": report.completion_time.strftime('%Y-%m-%d %H:%M:%S') if report.completion_time else None,
            "components": [],
            "issues": [],
            "summary": {
                "critical_issues": issues.filter(severity="HIGH").count(),
                "warnings": issues.filter(severity="MEDIUM").count(),
                "suggestions": issues.filter(severity="LOW").count(),
                "overall_status": diagnosis.overall_status
            }
        }
        
        for component in components:
            report_data["components"].append({
                "id": component.id,
                "type": component.type,
                "name": component.name,
                "status": component.status,
                "details": component.get_details_as_dict(),
                "recommendations": component.recommendations
            })
        
        for issue in issues:
            report_data["issues"].append({
                "id": issue.id,
                "component": issue.component,
                "type": issue.issue_type,
                "severity": issue.severity,
                "description": issue.description,
                "recommendation": issue.recommendation,
                "is_resolved": issue.is_resolved
            })
        
        return JsonResponse({"status": "success", "data": report_data})
    except DiagnosticReport.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Informe no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def client_comparison(request):
    """API para obtener comparación con diagnósticos previos"""
    try:
        latest_diagnosis = Diagnosis.objects.filter(user=request.user).order_by('-timestamp').first()
        
        if not latest_diagnosis:
            return JsonResponse({
                "status": "success",
                "comparison": {
                    "cpu_change": "Sin datos disponibles",
                    "ram_change": "Sin datos disponibles",
                    "disk_change": "Sin datos disponibles"
                }
            })
        
        previous_diagnosis = Diagnosis.objects.filter(
            user=request.user, 
            timestamp__lt=latest_diagnosis.timestamp
        ).order_by('-timestamp').first()
        
        if not previous_diagnosis:
            return JsonResponse({
                "status": "success",
                "comparison": {
                    "cpu_change": "Sin datos previos",
                    "ram_change": "Sin datos previos",
                    "disk_change": "Sin datos previos"
                }
            })
        
        def calculate_change(latest, previous):
            try:
                latest_value = float(latest.strip('%'))
                previous_value = float(previous.strip('%'))
                change = latest_value - previous_value
                return f"{change:.2f}"
            except (ValueError, AttributeError):
                return "Datos no válidos"
        
        comparison = {
            "cpu_change": calculate_change(latest_diagnosis.cpu_usage, previous_diagnosis.cpu_usage),
            "ram_change": calculate_change(latest_diagnosis.ram_percent, previous_diagnosis.ram_percent),
            "disk_change": calculate_change(latest_diagnosis.disk_percent, previous_diagnosis.disk_percent),
            "previous_date": previous_diagnosis.timestamp.strftime('%Y-%m-%d %H:%M')
        }
        
        return JsonResponse({"status": "success", "comparison": comparison})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    
    
@csrf_exempt
@login_required
@user_passes_test(is_client)
def run_diagnostic_scenario(request, scenario_id):
   """API para ejecutar un escenario de diagnóstico específico"""
   logger = logging.getLogger(__name__)
   logger.info(f"Iniciando escenario {scenario_id}")
   
   try:
       if request.method != 'POST':
           return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
       
       try:
           scenario = DiagnosticScenario.objects.get(id=scenario_id, is_active=True)
           logger.info(f"Escenario encontrado: {scenario.name}")
       except DiagnosticScenario.DoesNotExist:
           logger.error(f"Escenario con ID {scenario_id} no encontrado")
           return JsonResponse({"status": "error", "message": "Escenario no encontrado"}, status=404)
       
       logger.info("Obteniendo datos del sistema...")
       system_data = get_system_data()
       
       logger.info("Creando entrada de diagnóstico...")
       diagnosis = create_diagnosis_entry(request.user, system_data, f"S_{scenario.id}")
       
       logger.info(f"Ejecutando escenario específico: {scenario.name}")
       try:
           results = run_specific_scenario(scenario, system_data, diagnosis)
           logger.info(f"Resultados obtenidos: {results.get('status')}")
       except Exception as scenario_error:
           logger.error(f"Error en run_specific_scenario: {str(scenario_error)}")
           raise scenario_error
       
       logger.info("Guardando resultados en ScenarioRun...")
       scenario_run = ScenarioRun.objects.create(
           user=request.user,
           scenario=scenario,
           results=results,
           issues_found=len(results.get("issues", [])),
           recommendations=results.get("recommendations", "")
       )
       
       logger.info(f"Escenario completado exitosamente, run_id={scenario_run.id}")
       return JsonResponse({
           "status": "success",
           "message": f"Escenario '{scenario.name}' ejecutado correctamente",
           "run_id": scenario_run.id
       })
   except Exception as e:
       logger.error(f"Error global en run_diagnostic_scenario: {str(e)}")
       import traceback
       logger.error(traceback.format_exc())
       
       return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def get_latest_diagnosis_result(request):
    """API para obtener el resultado de diagnóstico más reciente"""
    try:
        scenario_run = ScenarioRun.objects.filter(
            user=request.user
        ).order_by('-timestamp').first()
        
        if scenario_run:
            return JsonResponse({
                "status": "success",
                "scenario_run_id": scenario_run.id,
                "completed": True,
                "timestamp": scenario_run.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            return JsonResponse({
                "status": "success",
                "completed": False,
                "message": "No se encontraron diagnósticos recientes"
            })
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def run_specific_scenario(scenario, system_data, diagnosis):
    """Ejecuta un escenario de diagnóstico específico de forma escalable"""
    logger = logging.getLogger(__name__)
    
    SCENARIO_ANALYZERS = {
        1: {
            'name': 'Pantalla azul',
            'analyzer': analyze_blue_screen_scenario,
            'log_message': 'Ejecutando escenario de pantalla azul'
        },
        2: {
            'name': 'Sistema lento',
            'analyzer': analyze_slow_system_scenario,
            'log_message': 'Ejecutando escenario de sistema lento'
        },
        3: {
            'name': 'Problemas de conectividad',
            'analyzer': analyze_connectivity_scenario,
            'log_message': 'Ejecutando escenario de conectividad'
        },
        4: {
            'name': 'Error de controlador',
            'analyzer': analyze_driver_scenario,
            'log_message': 'Ejecutando escenario de controlador'
        },
        5: {
            'name': 'El sistema no responde',
            'analyzer': analyze_unresponsive_scenario,
            'log_message': 'Ejecutando escenario de sistema que no responde'
        },
        6: {
            'name': 'Tiempo de arranque lento',
            'analyzer': analyze_slow_boot_scenario,
            'log_message': 'Ejecutando escenario de arranque lento'
        },
        7: {
            'name': 'Problemas con la batería',
            'analyzer': analyze_battery_scenario,
            'log_message': 'Ejecutando escenario de batería'
        }
    }
    
    KEYWORD_PATTERNS = [
        {
            'keywords': ['arranque', 'lento'],
            'analyzer': analyze_slow_boot_scenario,
            'log_message': 'Ejecutando escenario de arranque lento (por keywords)'
        },
        {
            'keywords': ['pantalla', 'azul'],
            'analyzer': analyze_blue_screen_scenario,
            'log_message': 'Ejecutando escenario de pantalla azul (por keywords)'
        },
        {
            'keywords': ['no', 'responde'],
            'analyzer': analyze_unresponsive_scenario,
            'log_message': 'Ejecutando escenario de sistema que no responde (por keywords)'
        },
        {
            'keywords': ['controlador'],
            'analyzer': analyze_driver_scenario,
            'log_message': 'Ejecutando escenario de controlador (por keywords)'
        },
        {
            'keywords': ['conectividad'],
            'analyzer': analyze_connectivity_scenario,
            'log_message': 'Ejecutando escenario de conectividad (por keywords)'
        },
        {
            'keywords': ['batería'],
            'analyzer': analyze_battery_scenario,
            'log_message': 'Ejecutando escenario de batería (por keywords)'
        },
        {
            'keywords': ['lento'],
            'analyzer': analyze_slow_system_scenario,
            'log_message': 'Ejecutando escenario de sistema lento (por keywords)'
        }
    ]
    
    logger.info(f"Analizando escenario: ID={scenario.id}, Nombre='{scenario.name}'")
    
    try:
        if scenario.id in SCENARIO_ANALYZERS:
            analyzer_config = SCENARIO_ANALYZERS[scenario.id]
            logger.info(analyzer_config['log_message'])
            return analyzer_config['analyzer'](system_data, diagnosis)
        
        scenario_name = scenario.name.lower()
        logger.info(f"ID {scenario.id} no encontrado en mapeo directo, usando análisis por keywords para: {scenario_name}")
        
        for pattern in KEYWORD_PATTERNS:
            if all(keyword in scenario_name for keyword in pattern['keywords']):
                logger.info(pattern['log_message'])
                return pattern['analyzer'](system_data, diagnosis)
        
        logger.warning(f"Escenario no implementado: ID={scenario.id}, Nombre='{scenario.name}'")
        return _create_unimplemented_scenario_result(scenario)
        
    except Exception as e:
        logger.error(f"Error al ejecutar escenario ID={scenario.id}, Nombre='{scenario.name}': {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        return _create_error_scenario_result(scenario, e)
    
    
def get_system_performance_profile(system_data):
    """Determina el perfil de rendimiento del sistema"""
    ram_gb = system_data.get('ram_total_gb', 8)
    cpu_cores = system_data.get('cpu_cores', 4)
    cpu_usage = float(system_data.get('cpu_usage', '50').replace('%', ''))
    
    if ram_gb >= 20 and cpu_cores >= 8:
        return {
            'profile': 'HIGH_END',
            'startup_threshold': 15,
            'severity_modifier': 'LOW',
            'description': 'Sistema de alto rendimiento'
        }
    elif ram_gb >= 12 and cpu_cores >= 6:
        return {
            'profile': 'MEDIUM_HIGH',
            'startup_threshold': 10,
            'severity_modifier': 'MEDIUM',
            'description': 'Sistema de rendimiento medio-alto'
        }
    elif ram_gb >= 8 and cpu_cores >= 4:
        return {
            'profile': 'MEDIUM',
            'startup_threshold': 6,
            'severity_modifier': 'MEDIUM',
            'description': 'Sistema de rendimiento medio'
        }
    else:
        return {
            'profile': 'LOW_END',
            'startup_threshold': 4,
            'severity_modifier': 'HIGH',
            'description': 'Sistema de recursos limitados'
        }
def calculate_startup_impact(startup_count, performance_profile, startup_programs):
    """Calcula el impacto real de los programas de inicio"""
    
    HIGH_IMPACT_PROGRAMS = [
        'adobe creative cloud', 'photoshop', 'autocad', 'visual studio',
        'vmware', 'virtualbox', 'docker', 'android studio'
    ]
    
    MEDIUM_IMPACT_PROGRAMS = [
        'steam', 'origin', 'battlenet', 'epicgameslauncher', 'discord',
        'spotify', 'chrome', 'firefox'
    ]
    
    LOW_IMPACT_PROGRAMS = [
        'onedrive', 'dropbox', 'windows defender', 'antivirus'
    ]
    
    impact_score = 0
    high_impact_found = []
    
    for program in startup_programs:
        program_lower = program.lower()
        
        if any(high_prog in program_lower for high_prog in HIGH_IMPACT_PROGRAMS):
            impact_score += 3
            high_impact_found.append(program)
        elif any(med_prog in program_lower for med_prog in MEDIUM_IMPACT_PROGRAMS):
            impact_score += 2
        elif any(low_prog in program_lower for low_prog in LOW_IMPACT_PROGRAMS):
            impact_score += 1
        else:
            impact_score += 1.5
    
    return {
        'impact_score': impact_score,
        'high_impact_programs': high_impact_found,
        'estimated_boot_delay': min(impact_score * 2, 60)
    }
    
def format_startup_program_name(program_name):
    """Convierte nombres técnicos de programas a nombres amigables para el usuario"""
    
    PROGRAM_NAME_MAPPING = {
        'microsoftedgeautolaunch': 'Microsoft Edge',
        'microsoft teams': 'Microsoft Teams',
        'skype': 'Skype',
        'onedrive': 'OneDrive',
        'steam': 'Steam',
        'epicgameslauncher': 'Epic Games Launcher',
        'origin': 'Origin (EA)',
        'battlenet': 'Battle.net',
        'discord': 'Discord',
        'adobe updater': 'Adobe Updater',
        'adobe creative cloud': 'Adobe Creative Cloud',
        'wallpaperalive': 'Wallpaper Alive',
        'spotify': 'Spotify',
        'zoom': 'Zoom',
        'teamviewer': 'TeamViewer',
        'dropbox': 'Dropbox',
        'google chrome': 'Google Chrome',
        'firefox': 'Mozilla Firefox',
        'windows defender': 'Windows Defender',
        'malwarebytes': 'Malwarebytes',
        'avast': 'Avast Antivirus',
        'nvidia': 'NVIDIA Graphics',
        'intel': 'Intel Graphics',
        'realtek': 'Realtek Audio',
    }
    
    if not program_name:
        return program_name
    
    clean_name = program_name.lower()
    
    import re
    clean_name = re.sub(r'_[a-f0-9]{32,}', '', clean_name)
    clean_name = re.sub(r'[{}\-\(\)0-9]{10,}', '', clean_name)
    
    for key, friendly_name in PROGRAM_NAME_MAPPING.items():
        if key in clean_name:
            return friendly_name
    
    formatted = program_name.replace('_', ' ').replace('-', ' ')
    formatted = re.sub(r'_[a-f0-9]{32,}', '', formatted)
    
    words = formatted.split()
    formatted_words = []
    for word in words:
        if len(word) > 3:
            formatted_words.append(word.capitalize())
        else:
            formatted_words.append(word.lower())
    
    return ' '.join(formatted_words)

def format_startup_programs_list(programs_list):
    """Formatea una lista de programas para mostrar al usuario"""
    if not programs_list:
        return []
    
    formatted_programs = []
    for program in programs_list:
        friendly_name = format_startup_program_name(program)
        formatted_programs.append(friendly_name)
    
    return sorted(list(set(formatted_programs)))

def _create_unimplemented_scenario_result(scenario):
    """Crea un resultado estándar para escenarios no implementados"""
    return {
        "scenario": scenario.name,
        "status": "UNKNOWN",
        "message": f"Escenario '{scenario.name}' no está implementado",
        "issues": [{
            "type": "SYSTEM",
            "severity": "LOW",
            "description": f"El escenario '{scenario.name}' no está disponible",
            "recommendation": "Este tipo de análisis estará disponible en futuras actualizaciones."
        }],
        "recommendations": "Este escenario de diagnóstico estará disponible próximamente."
    }

def _create_error_scenario_result(scenario, error):
    """Crea un resultado estándar para errores en escenarios"""
    return {
        "scenario": scenario.name,
        "status": "ERROR",
        "message": f"Error al ejecutar escenario: {str(error)}",
        "issues": [{
            "type": "ERROR",
            "severity": "MEDIUM",
            "description": f"Error al ejecutar el análisis: {str(error)}",
            "recommendation": "Contacte con soporte técnico para resolver este problema."
        }],
        "recommendations": "Se produjo un error al analizar este escenario. Por favor, inténtelo de nuevo más tarde."
    }

def register_scenario_analyzer(scenario_id, analyzer_function, name, log_message):
    """Permite registrar nuevos analizadores dinámicamente"""
    pass

def analyze_blue_screen_scenario(system_data, diagnosis):
    """Analiza el escenario de pantalla azul - SIN análisis automático de controladores"""
    logger = logging.getLogger(__name__)
    logger.info("Iniciando análisis de pantalla azul")
    
    issues = []
    
    try:
        logger.info("Verificando eventos de cierre inesperado")
        if platform.system() == "Windows":
            cmd = "powershell \"Get-WinEvent -FilterHashtable @{LogName='System'; ID=41,1001,6008} -MaxEvents 10\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=5)
            
            memory_cmd = "powershell \"Get-WinEvent -FilterHashtable @{LogName='System'; ID=1003} -MaxEvents 5\""
            memory_result = subprocess.run(memory_cmd, capture_output=True, text=True, shell=True, timeout=5)
            
            
            logger.info("Verificando solo controladores críticos para pantallas azules")
            critical_drivers_cmd = "powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {$_.ConfigManagerErrorCode -ne 0 -and $_.Name -match 'Graphics|Video|Display'} | Select-Object Name, ConfigManagerErrorCode\""
            critical_result = subprocess.run(critical_drivers_cmd, capture_output=True, text=True, shell=True, timeout=5)
            
            if critical_result.returncode == 0 and critical_result.stdout:
                issues.append({
                    "type": "DRIVER",
                    "severity": "HIGH",
                    "description": "Se detectaron problemas con controladores gráficos que pueden causar pantallas azules",
                    "recommendation": "Actualice específicamente los controladores de tarjeta gráfica desde el sitio del fabricante."
                })
            
    except Exception as e:
        logger.error(f"Error en análisis de pantalla azul: {str(e)}")
    
    return {
        "scenario": "Error de pantalla azul",
        "status": "WARNING" if issues else "NORMAL",
        "issues": issues,
        "recommendations": "\n".join([issue["recommendation"] for issue in issues])
    }
    
    return result

def analyze_slow_system_scenario(system_data, diagnosis):
    """Analiza el escenario de sistema lento - CORREGIDO"""
    logger = logging.getLogger(__name__)
    logger.info("Iniciando análisis de sistema lento")
    
    issues = []
    
    try:
        if platform.system() == "Windows":
            # NUEVA FORMA: Usar Performance Counters para CPU real
            cmd_processes = '''powershell "
            $processes = Get-Process | Where-Object {$_.ProcessName -notmatch '^(Idle|System)$'} | 
                        Sort-Object CPU -Descending | Select-Object -First 8 Name, Id, WorkingSet
            
            # Obtener porcentajes reales de CPU usando Get-Counter
            $results = @()
            foreach ($proc in $processes) {
                try {
                    # Intentar obtener contador de CPU
                    $cpuCounter = Get-Counter "\\Process($($proc.Name))\\% Processor Time" -ErrorAction SilentlyContinue -SampleInterval 1 -MaxSamples 1
                    $cpuPercent = if ($cpuCounter) { 
                        [math]::Min([math]::Round($cpuCounter.CounterSamples[0].CookedValue / [Environment]::ProcessorCount, 1), 100)
                    } else { 0 }
                    
                    $ramMB = [math]::Round($proc.WorkingSet / 1MB, 1)
                    
                    $results += [PSCustomObject]@{
                        Name = $proc.Name
                        CPU = $cpuPercent
                        WorkingSet = $ramMB
                        Id = $proc.Id
                    }
                } catch {
                    # Si falla el contador, asignar 0
                    $results += [PSCustomObject]@{
                        Name = $proc.Name
                        CPU = 0
                        WorkingSet = [math]::Round($proc.WorkingSet / 1MB, 1)
                        Id = $proc.Id
                    }
                }
            }
            
            $results | Sort-Object CPU -Descending | ConvertTo-Json"'''
            
            proc_result = subprocess.run(cmd_processes, capture_output=True, text=True, shell=True, timeout=10)
            
            if proc_result.returncode == 0 and proc_result.stdout:
                try:
                    processes = json.loads(proc_result.stdout)
                    if not isinstance(processes, list):
                        processes = [processes]
                    
                    high_cpu_processes = []
                    for process in processes:
                        cpu_value = process.get('CPU', 0) or 0
                        ram_mb = process.get('WorkingSet', 0) or 0
                        
                        # Solo considerar procesos con CPU realista (entre 10% y 100%)
                        if 10 <= cpu_value <= 100:
                            high_cpu_processes.append(f"{process.get('Name')}: {cpu_value}% CPU, {ram_mb} MB RAM")
                    
                    if high_cpu_processes:
                        issues.append({
                            "type": "PERFORMANCE",
                            "severity": "HIGH",
                            "description": "Procesos con alto consumo de CPU detectados",
                            "recommendation": f"Considere cerrar estas aplicaciones para mejorar el rendimiento: {', '.join(high_cpu_processes[:3])}"
                        })
                except json.JSONDecodeError:
                    pass
            
            # Resto del análisis (WinSAT, servicios, etc.) - SIN CAMBIOS
            cmd_winsat = "powershell \"Get-CimInstance Win32_WinSAT | Select-Object CPUScore, MemoryScore, DiskScore | ConvertTo-Json\""
            winsat_result = subprocess.run(cmd_winsat, capture_output=True, text=True, shell=True, timeout=5)
            
            if winsat_result.returncode == 0 and winsat_result.stdout:
                try:
                    winsat = json.loads(winsat_result.stdout)
                    if winsat.get('DiskScore', 10) < 5.5:
                        issues.append({
                            "type": "HARDWARE",
                            "severity": "MEDIUM",
                            "description": f"Rendimiento de disco bajo (puntuación: {winsat.get('DiskScore', 'N/A')})",
                            "recommendation": "Considere actualizar a un SSD si está usando un disco duro tradicional (HDD)."
                        })
                    if winsat.get('MemoryScore', 10) < 5.0:
                        issues.append({
                            "type": "HARDWARE",
                            "severity": "MEDIUM",
                            "description": f"Rendimiento de memoria bajo (puntuación: {winsat.get('MemoryScore', 'N/A')})",
                            "recommendation": "Considere aumentar la RAM de su sistema."
                        })
                except json.JSONDecodeError:
                    pass
            
            cmd_services = "powershell \"Get-Service | Where-Object {$_.StartType -eq 'Automatic' -and $_.Status -eq 'Running'} | Measure-Object | Select-Object -ExpandProperty Count\""
            services_result = subprocess.run(cmd_services, capture_output=True, text=True, shell=True, timeout=5)
            
            if services_result.returncode == 0 and services_result.stdout:
                try:
                    service_count = int(services_result.stdout.strip())
                    if service_count > 100:
                        issues.append({
                            "type": "PERFORMANCE",
                            "severity": "MEDIUM",
                            "description": f"Excesivos servicios automáticos ({service_count})",
                            "recommendation": "Deshabilite servicios innecesarios para mejorar el rendimiento."
                        })
                except (ValueError, TypeError):
                    pass
    except Exception as e:
        logger.error(f"Error al analizar sistema lento: {str(e)}")
    
    # Si no hay problemas detectados
    if not issues:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "LOW",
            "description": "No se encontraron problemas de rendimiento evidentes",
            "recommendation": "Su sistema parece estar funcionando correctamente. Para mejorar el rendimiento, considere reiniciar su equipo regularmente y mantener el software actualizado."
        })
    
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Rendimiento",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    logger.info("Análisis de sistema lento completado")
    return {
        "scenario": "Sistema lento",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else 
                  "WARNING" if any(issue["severity"] == "MEDIUM" for issue in issues) else "NORMAL",
        "issues": issues,
        "recommendations": recommendations
    }

def analyze_connectivity_scenario(system_data, diagnosis):
    """Analiza conectividad con lógica inteligente según el uso real"""
    logger = logging.getLogger(__name__)
    logger.info("Iniciando análisis de conectividad con lógica mejorada")
    
    issues = []
    
    internet_status = check_internet_connectivity()
    
    if internet_status["connected"] is False:
        if internet_status.get("total_tests", 0) > 0 and internet_status.get("successful_tests", 0) == 0:
            issues.append({
                "type": "NETWORK",
                "severity": "HIGH",
                "description": "Sin conexión a Internet detectada tras múltiples pruebas",
                "recommendation": "Verifique su conexión de red, router o contacte con su proveedor de servicios de Internet."
            })
        return create_connectivity_result(issues, internet_status, [], [], diagnosis)
    elif internet_status["connected"] is None:
        issues.append({
            "type": "NETWORK",
            "severity": "MEDIUM",
            "description": "No se pudo verificar el estado de conectividad",
            "recommendation": "Verifique su firewall o configuración de red que pueda estar bloqueando las pruebas de conectividad."
        })
    elif internet_status["connected"] and internet_status["ping"] > 500:
        issues.append({
            "type": "NETWORK", 
            "severity": "MEDIUM",
            "description": f"Latencia de red muy alta ({internet_status['ping']} ms)",
            "recommendation": "Latencia excesiva detectada. Verifique si hay aplicaciones consumiendo ancho de banda."
        })
    elif internet_status["connected"] and internet_status["ping"] > 300:  
        issues.append({
            "type": "NETWORK",
            "severity": "LOW",
            "description": f"Latencia de red elevada ({internet_status['ping']} ms)",
            "recommendation": "La latencia es algo alta pero aceptable. Monitoree si empeora."
        })
    
    if internet_status["connected"]:
        try:
            ping_cmd = "ping -n 3 -w 3000 8.8.8.8"
            ping_result = subprocess.run(ping_cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if ping_result.returncode == 0:
                lost_count = 0
                if "perdido = " in ping_result.stdout:
                    try:
                        lost_count = int(ping_result.stdout.split("perdido = ")[1].split(" ")[0])
                    except:
                        pass
                elif "lost = " in ping_result.stdout:
                    try:
                        lost_count = int(ping_result.stdout.split("lost = ")[1].split(" ")[0])
                    except:
                        pass
                
                if lost_count >= 3:
                    issues.append({
                        "type": "NETWORK",
                        "severity": "HIGH",
                        "description": "Pérdida total de paquetes detectada",
                        "recommendation": "Conexión muy inestable. Contacte con su proveedor de Internet."
                    })
                elif lost_count == 2:
                    issues.append({
                        "type": "NETWORK",
                        "severity": "MEDIUM",
                        "description": "Pérdida significativa de paquetes detectada (67%)",
                        "recommendation": "Conexión inestable. Reinicie el router y verifique cables de red."
                    })
                elif lost_count == 1:
                    issues.append({
                        "type": "NETWORK",
                        "severity": "LOW",
                        "description": "Pérdida menor de paquetes detectada (33%)",
                        "recommendation": "Conexión ocasionalmente inestable. Monitoree si persiste."
                    })
        except subprocess.TimeoutExpired:
            issues.append({
                "type": "NETWORK",
                "severity": "LOW",
                "description": "Pruebas adicionales de red tomaron más tiempo del esperado",
                "recommendation": "La conexión funciona pero puede estar lenta. Monitoree el rendimiento."
            })
        except:
            pass
    
    active_adapters = []
    inactive_adapters = []
    network_adapters = []
    
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-NetAdapter | Select Name, InterfaceDescription, Status, LinkSpeed, MediaType | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                adapters_data = json.loads(result.stdout)
                
                if not isinstance(adapters_data, list):
                    adapters_data = [adapters_data]
                
                network_adapters = adapters_data
                
                for adapter in adapters_data:
                    adapter_name = adapter.get('Name', '')
                    adapter_status = adapter.get('Status', '')
                    interface_desc = adapter.get('InterfaceDescription', '')
                    
                    if any(virtual in adapter_name.lower() for virtual in 
                          ['loopback', 'virtual', 'vmware', 'vbox', 'hyper-v', 'miniport']):
                        continue
                    
                    is_wifi = any(wifi_term in adapter_name.lower() or wifi_term in interface_desc.lower() 
                                 for wifi_term in ['wi-fi', 'wifi', 'wireless', 'wlan', '802.11'])
                    is_ethernet = any(eth_term in adapter_name.lower() or eth_term in interface_desc.lower()
                                     for eth_term in ['ethernet', 'realtek', 'intel', 'broadcom'])
                    
                    if adapter_status == 'Up':
                        active_adapters.append({
                            'name': adapter_name,
                            'type': 'Wi-Fi' if is_wifi else 'Ethernet' if is_ethernet else 'Red',
                            'status': adapter_status
                        })
                    elif is_wifi or is_ethernet:
                        inactive_adapters.append({
                            'name': adapter_name,
                            'type': 'Wi-Fi' if is_wifi else 'Ethernet',
                            'status': adapter_status
                        })
        except:
            pass
    
    wifi_active = any(adapter['type'] == 'Wi-Fi' for adapter in active_adapters)
    ethernet_active = any(adapter['type'] == 'Ethernet' for adapter in active_adapters)
    
    for inactive in inactive_adapters:
        if inactive['type'] == 'Ethernet' and wifi_active:
            issues.append({
                "type": "NETWORK",
                "severity": "LOW",
                "description": f"Adaptador Ethernet desactivado (usando Wi-Fi)",
                "recommendation": "Su conexión Wi-Fi funciona correctamente. Ethernet solo es necesario si prefiere conexión por cable."
            })
        elif inactive['type'] == 'Wi-Fi' and ethernet_active:
            issues.append({
                "type": "NETWORK",
                "severity": "LOW",
                "description": f"Adaptador Wi-Fi desactivado (usando Ethernet)",
                "recommendation": "Su conexión Ethernet funciona correctamente. Wi-Fi solo es necesario para movilidad."
            })
        elif inactive['type'] == 'Wi-Fi' and not ethernet_active:
            issues.append({
                "type": "NETWORK",
                "severity": "HIGH",
                "description": f"Adaptador Wi-Fi principal desactivado",
                "recommendation": "Active el adaptador Wi-Fi desde el Panel de control para restaurar conectividad."
            })
        elif inactive['type'] == 'Ethernet' and not wifi_active:
            issues.append({
                "type": "NETWORK",
                "severity": "HIGH",
                "description": f"Adaptador Ethernet principal desactivado",
                "recommendation": "Active el adaptador Ethernet desde el Panel de control para restaurar conectividad."
            })
    
    dns_servers = []
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                dns_servers = [s.strip() for s in result.stdout.split('\n') if s.strip()]
                
                if not dns_servers:
                    issues.append({
                        "type": "NETWORK",
                        "severity": "MEDIUM",
                        "description": "No se encontraron servidores DNS configurados",
                        "recommendation": "Configure servidores DNS manualmente (8.8.8.8 y 8.8.4.4)."
                    })
        except:
            pass
    
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {($_.Name -like '*network*' -or $_.Name -like '*ethernet*' -or $_.Name -like '*wifi*' -or $_.Name -like '*wireless*') -and $_.ConfigManagerErrorCode -ne 0 -and $_.ConfigManagerErrorCode -ne 22 -and $_.ConfigManagerErrorCode -ne 28} | Select-Object Name, ConfigManagerErrorCode | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                problematic_network_drivers = json.loads(result.stdout)
                if not isinstance(problematic_network_drivers, list):
                    problematic_network_drivers = [problematic_network_drivers]
                
                for driver in problematic_network_drivers:
                    error_code = driver.get('ConfigManagerErrorCode', 0)
                    if error_code in [1, 3, 10, 12, 14, 43]: 
                        issues.append({
                            "type": "DRIVER",
                            "severity": "MEDIUM",
                            "description": f"Controlador de red con error crítico: {driver.get('Name', 'Desconocido')}",
                            "recommendation": "Actualice el controlador de red desde el Administrador de dispositivos."
                        })
        except:
            pass
    
    if not issues and (wifi_active or ethernet_active):
        connection_type = "Wi-Fi" if wifi_active else "Ethernet"
        issues.append({
            "type": "NETWORK",
            "severity": "INFO",
            "description": f"Conectividad excelente vía {connection_type}",
            "recommendation": f"Su conexión {connection_type} funciona perfectamente. No se requieren acciones."
        })
    
    return create_connectivity_result(issues, internet_status, network_adapters, dns_servers, diagnosis)

def create_connectivity_result(issues, internet_status, network_adapters, dns_servers, diagnosis):
    if any(issue["severity"] == "HIGH" for issue in issues):
        status = "CRITICAL"
    elif any(issue["severity"] == "MEDIUM" for issue in issues):
        status = "WARNING"  
    else:
        status = "NORMAL"
    
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Red",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "Problemas de conectividad",
        "status": status,
        "issues": issues,
        "internet_status": internet_status,
        "network_adapters": network_adapters,
        "dns_servers": dns_servers,
        "recommendations": recommendations
    }
    
def analyze_driver_scenario(system_data, diagnosis):
    """ÚNICO escenario que debería hacer análisis completo de controladores"""
    logger = logging.getLogger(__name__)
    logger.info("Ejecutando análisis COMPLETO de controladores - Escenario específico")
    
    drivers_result = analyze_drivers(system_data)
    
    return {
        "scenario": "Error de controlador",
        "status": drivers_result.get("status", "UNKNOWN"),
        "issues": drivers_result.get("issues", []),
        "recommendations": drivers_result.get("recommendations", "")
    }

def get_error_code_message(error_code):
    error_codes = {
        1: "El dispositivo no está configurado correctamente",
        2: "Los controladores para este dispositivo no están instalados",
        3: "El controlador para este dispositivo podría estar dañado",
        4: "El dispositivo no funciona correctamente",
        5: "El controlador para este dispositivo requiere un recurso",
        6: "La configuración de arranque de este dispositivo está en conflicto",
        7: "No se puede filtrar",
        8: "Falta el controlador",
        9: "Este dispositivo no funciona correctamente",
        10: "Este dispositivo no puede iniciarse",
        11: "Este dispositivo no funciona correctamente",
        12: "Este dispositivo no encuentra recursos libres",
        13: "Conflicto de recursos",
        14: "El dispositivo no puede funcionar",
        15: "Este dispositivo se está reiniciando",
        16: "El dispositivo no funciona correctamente",
        17: "No se pueden identificar todos los recursos",
        18: "Reinstalar controladores",
        19: "Registro dañado",
        20: "Error de sistema",
        21: "El dispositivo está deshabilitado",
        22: "El dispositivo está ausente, no funciona o no tiene controladores",
        23: "El dispositivo está deshabilitado",
        24: "El dispositivo no está presente",
        25: "Está pendiente para ser terminado",
        26: "Controladores no instalados",
        27: "Controladores dañados",
        28: "El dispositivo está deshabilitado",
        29: "El dispositivo está deshabilitado",
        30: "El dispositivo no puede funcionar",
        31: "El dispositivo está deshabilitado"
    }
    return error_codes.get(error_code, f"Error desconocido (código {error_code})")

def analyze_unresponsive_scenario(system_data, diagnosis):
    logger = logging.getLogger(__name__)
    logger.info("Iniciando análisis inteligente de sistema que no responde")
    
    issues = []
    performance_profile = get_system_performance_profile(system_data)
    
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-WinEvent -FilterHashtable @{LogName='Application'; ID=1002,1001} -MaxEvents 15 | Select-Object TimeCreated, Id, Message, ProviderName | ConvertTo-Json -Depth 3\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                try:
                    events = json.loads(result.stdout)
                    if not isinstance(events, list):
                        events = [events]
                    
                    app_crashes = len([e for e in events if e.get('Id') == 1002])
                    
                    if app_crashes > 0:
                        severity = "MEDIUM" if performance_profile['profile'] == 'HIGH_END' else "HIGH"
                        
                        if app_crashes > 10:
                            description = f"Se detectaron múltiples bloqueos de aplicaciones ({app_crashes} eventos recientes)"
                            recommendation = "Múltiples aplicaciones han dejado de funcionar. Actualice las aplicaciones problemáticas y verifique los controladores."
                        else:
                            description = f"Se encontraron algunos bloqueos de aplicaciones ({app_crashes} eventos)"
                            recommendation = "Monitor de bloqueos detectado. Mantenga las aplicaciones actualizadas y reinicie regularmente."
                        
                        issues.append({
                            "type": "SOFTWARE",
                            "severity": severity,
                            "description": description,
                            "recommendation": recommendation
                        })
                
                except json.JSONDecodeError as e:
                    logger.error(f"Error al decodificar eventos: {str(e)}")
            
            # COMANDO CORREGIDO: Usar Get-Counter para obtener porcentaje real de CPU
            cmd_proc = """powershell "
            $processes = Get-Process | Where-Object {$_.ProcessName -notmatch '^(Idle|System)$'} | 
            Select-Object Name, WorkingSet, @{Name='CPUPercent';Expression={
                $cpu = Get-Counter ('\\Process(' + $_.ProcessName + ')\\% Processor Time') -ErrorAction SilentlyContinue
                if ($cpu) { [math]::Round($cpu.CounterSamples[0].CookedValue, 1) } else { 0 }
            }} | 
            Where-Object {$_.CPUPercent -gt 5 -or $_.WorkingSet -gt 104857600} |
            Sort-Object CPUPercent -Descending | 
            Select-Object -First 8 | 
            ConvertTo-Json
            " """
            
            # ALTERNATIVA MÁS SIMPLE: Usar solo memoria y proceso activos
            cmd_proc_simple = """powershell "
            Get-Process | Where-Object {$_.WorkingSet -gt 50MB} | 
            Sort-Object WorkingSet -Descending | 
            Select-Object -First 8 Name, @{Name='WorkingSetMB';Expression={[math]::Round($_.WorkingSet/1MB,0)}} |
            ConvertTo-Json
            " """
            
            proc_result = subprocess.run(cmd_proc_simple, capture_output=True, text=True, shell=True, timeout=10)
            
            if proc_result.returncode == 0 and proc_result.stdout:
                try:
                    processes = json.loads(proc_result.stdout)
                    if not isinstance(processes, list):
                        processes = [processes]
                    
                    high_memory_processes = []
                    
                    for process in processes:
                        ram_mb = process.get('WorkingSetMB', 0)
                        
                        # Solo procesos que usan más de 200MB (realmente significativos)
                        if ram_mb > 200:
                            process_name = format_process_name(process.get('Name', 'Proceso desconocido'))
                            high_memory_processes.append(f"{process_name} ({int(ram_mb)} MB de RAM)")
                    
                    if high_memory_processes:
                        process_count = len(high_memory_processes)
                        
                        if performance_profile['profile'] == 'HIGH_END':
                            severity = "LOW"
                            description = f"Se detectaron {process_count} aplicaciones usando memoria significativa"
                            recommendation = f"Su sistema maneja bien esta carga: {', '.join(high_memory_processes[:3])}"
                        else:
                            severity = "MEDIUM"
                            description = f"Aplicaciones consumiendo memoria considerable ({process_count} detectadas)"
                            recommendation = f"Considere cerrar aplicaciones no esenciales: {', '.join(high_memory_processes[:3])}"
                        
                        issues.append({
                            "type": "PERFORMANCE",
                            "severity": severity,
                            "description": description,
                            "recommendation": recommendation
                        })
                
                except json.JSONDecodeError as e:
                    logger.error(f"Error al decodificar procesos: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error al analizar sistema que no responde: {str(e)}")
    
    if not issues:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "LOW",
            "description": f"Sistema funcionando normalmente para su {performance_profile['description']}",
            "recommendation": "No se detectaron problemas evidentes de rendimiento o bloqueos."
        })
    
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    simplified_tips = f"""
Consejos para optimizar la respuesta del sistema:
- Use Ctrl+Alt+Supr → Administrador de tareas para cerrar aplicaciones que no respondan
- Reinicie aplicaciones problemáticas en lugar de todo el sistema
- Su sistema de alto rendimiento puede manejar múltiples aplicaciones simultáneamente
    """
    
    recommendations += "\n" + simplified_tips
    
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Respuesta del sistema",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    logger.info(f"Análisis de sistema completado - Perfil: {performance_profile['profile']}")
    return {
        "scenario": "El sistema no responde",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else 
                  "WARNING" if any(issue["severity"] == "MEDIUM" for issue in issues) else "NORMAL",
        "issues": issues,
        "recommendations": recommendations
    }
    
def analyze_slow_boot_scenario(system_data, diagnosis):
    """Analiza arranque lento - DEBE ESTAR SIN analyze_drivers()"""
    logger = logging.getLogger(__name__)
    logger.info("Iniciando análisis inteligente de tiempo de arranque")
    
    issues = []
    
    try:
        if platform.system() == "Windows":
            # SOLO ESTO - NO analyze_drivers()
            logger.info("Analizando programas de inicio")
            cmd_startup = "powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command | ConvertTo-Json\""
            startup_result = subprocess.run(cmd_startup, capture_output=True, text=True, shell=True, timeout=5)
            
            if startup_result.returncode == 0 and startup_result.stdout:
                startup_items = json.loads(startup_result.stdout)
                if not isinstance(startup_items, list):
                    startup_items = [startup_items]
                
                if len(startup_items) > 8:
                    issues.append({
                        "type": "PERFORMANCE",
                        "severity": "MEDIUM", 
                        "description": f"Demasiados programas de inicio ({len(startup_items)})",
                        "recommendation": "Desactive programas innecesarios en Inicio usando msconfig o Administrador de tareas"
                    })
      
            
    except Exception as e:
        logger.error(f"Error en análisis de arranque: {str(e)}")
    
    logger.info("Análisis de arranque completado - Perfil: OPTIMIZADO")
    return {
        "scenario": "Tiempo de arranque lento",
        "status": "WARNING" if issues else "NORMAL", 
        "issues": issues,
        "recommendations": "\n".join([issue["recommendation"] for issue in issues])
    }

    
def format_process_name(process_name):
    """Convierte nombres técnicos de procesos a nombres amigables"""
    
    PROCESS_NAME_MAPPING = {
        'windows error reporting': 'Reporte de errores de Windows',
        'dwm': 'Administrador de ventanas',
        'explorer': 'Explorador de Windows',
        'chrome': 'Google Chrome',
        'firefox': 'Mozilla Firefox',
        'msedge': 'Microsoft Edge',
        'steam': 'Steam',
        'discord': 'Discord',
        'spotify': 'Spotify',
        'teams': 'Microsoft Teams',
        'outlook': 'Microsoft Outlook',
        'word': 'Microsoft Word',
        'excel': 'Microsoft Excel',
        'powerpoint': 'Microsoft PowerPoint',
        'code': 'Visual Studio Code',
        'notepad': 'Bloc de notas',
        'calculator': 'Calculadora',
        'winword': 'Microsoft Word',
        'brave': 'Navegador Brave',
        'audiodg': 'Servicio de audio de Windows',
        'svchost': 'Servicio de Windows',
        'system': 'Sistema de Windows',
        'registry': 'Registro de Windows',
        'rundll32': 'Biblioteca del sistema',
        'conhost': 'Consola del sistema'
    }
    
    if not process_name:
        return process_name
    
    clean_name = process_name.lower()
    
    for key, friendly_name in PROCESS_NAME_MAPPING.items():
        if key in clean_name:
            return friendly_name
    
    formatted = process_name.replace('_', ' ').replace('-', ' ')
    words = formatted.split()
    formatted_words = []
    for word in words:
        if len(word) > 3:
            formatted_words.append(word.capitalize())
        else:
            formatted_words.append(word.lower())
    
    return ' '.join(formatted_words)

def format_resource_usage(cpu_percent, ram_mb):
    """Formatea el uso de recursos de manera comprensible"""
    cpu_rounded = round(float(cpu_percent), 1) if cpu_percent else 0
    ram_rounded = round(float(ram_mb), 0) if ram_mb else 0
    
    if ram_rounded >= 1024:
        ram_display = f"{round(ram_rounded/1024, 1)} GB"
    else:
        ram_display = f"{int(ram_rounded)} MB"
    
    return f"CPU {cpu_rounded}%, RAM {ram_display}"

def analyze_battery_scenario(system_data, diagnosis):
    """Analiza el escenario de batería - VERSIÓN OPTIMIZADA Y CORREGIDA"""
    logger = logging.getLogger(__name__)
    logger.info("Iniciando análisis de batería OPTIMIZADO")
    
    issues = []
    battery_report_path = None
    
    try:
        battery_data = system_data.get('battery')
        if battery_data:
            battery_issues = analyze_battery(system_data).get("issues", [])
            issues.extend(battery_issues)
        
        if platform.system() == "Windows":
            try:
                report_dir = os.path.join(os.environ['TEMP'], 'diagnostics')
                os.makedirs(report_dir, exist_ok=True)
                battery_report_path = os.path.join(report_dir, f'battery_report_{diagnosis.id}.html')
                
                cmd = f'powercfg /batteryreport /output "{battery_report_path}"'
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=5)
                
                if result.returncode == 0 and os.path.exists(battery_report_path):
                    DiagnosticFile.objects.create(
                        diagnosis=diagnosis,
                        file_type="BATTERY_REPORT",
                        file_path=battery_report_path,
                        file_name=f"battery_report_{diagnosis.id}.html"
                    )
            except Exception as e:
                logger.warning(f"No se pudo generar informe de batería: {str(e)}")
            
            try:
                cmd_plan = "powershell \"Get-WmiObject -Namespace root\\cimv2\\power -Class Win32_PowerPlan | Where-Object {$_.IsActive -eq $true} | Select-Object ElementName | ConvertTo-Json\""
                plan_result = subprocess.run(cmd_plan, capture_output=True, text=True, shell=True, timeout=3)
                
                if plan_result.returncode == 0 and plan_result.stdout:
                    plan_data = json.loads(plan_result.stdout)
                    plan_name = plan_data.get('ElementName', '').lower()
                    
                    if "alto rendimiento" in plan_name or "high performance" in plan_name:
                        issues.append({
                            "type": "CONFIGURATION",
                            "severity": "MEDIUM",
                            "description": f"Plan de energía de alto consumo: {plan_data.get('ElementName')}",
                            "recommendation": "Cambie al plan 'Equilibrado' o 'Ahorro de energía' para mejorar la duración de la batería."
                        })
            except Exception as e:
                logger.warning(f"No se pudo verificar plan de energía: {str(e)}")

            try:
                power_analysis = analyze_real_power_consumption_fast()
                
                if power_analysis['high_consumers']:
                    issues.append({
                        "type": "SOFTWARE",
                        "severity": "MEDIUM", 
                        "description": f"Aplicaciones con alto consumo de energía detectadas",
                        "recommendation": f"Cierre estas aplicaciones cuando funcione con batería: {', '.join(power_analysis['high_consumers'][:3])}"
                    })
            except Exception as e:
                logger.warning(f"No se pudo analizar consumo de aplicaciones: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error en análisis de batería: {str(e)}")
    
    if not issues:
        issues.append({
            "type": "HARDWARE",
            "severity": "LOW",
            "description": "No se detectaron problemas específicos con la batería",
            "recommendation": "La batería parece estar funcionando correctamente."
        })
    
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    general_recommendations = """
Recomendaciones generales para mejorar la duración de la batería:
- Reduzca el brillo de la pantalla
- Desactive Wi-Fi y Bluetooth cuando no los use
- Cierre aplicaciones en segundo plano
- Utilice el modo de ahorro de energía
    """
    
    recommendations += "\n" + general_recommendations
    
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Batería",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    logger.info("Análisis de batería completado EXITOSAMENTE")
    return {
        "scenario": "Problemas con la batería",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else 
                  "WARNING" if any(issue["severity"] == "MEDIUM" for issue in issues) else "NORMAL",
        "issues": issues,
        "recommendations": recommendations,
        "report_available": battery_report_path is not None,
        "diagnosis_id": diagnosis.id
    }
        
        
def analyze_real_power_consumption_fast():
    """Versión RÁPIDA y CORREGIDA para analizar consumo de energía"""
    try:
        logger = logging.getLogger(__name__)
        logger.info("Iniciando análisis RÁPIDO de consumo de energía")
        
        if platform.system() != "Windows":
            return {'high_consumers': [], 'efficiency_score': 'N/A'}
        
        high_consumers = []
        
        try:
            logger.info("Usando psutil para obtener procesos")
            
            target_processes = [
                'chrome.exe', 'firefox.exe', 'brave.exe', 'edge.exe', 'opera.exe',
                'spotify.exe', 'discord.exe', 'teams.exe', 'slack.exe', 'zoom.exe',
                'pathoftitans-win64-shipping.exe', 'pathoftitans.exe',
                'steam.exe', 'epicgameslauncher.exe',
                'audiodg.exe', 'dwm.exe'
            ]
            
            found_processes = []
            
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                try:
                    proc_info = proc.info
                    process_name = proc_info['name'].lower() if proc_info['name'] else ''
                    
                    if any(target in process_name for target in target_processes):
                        cpu_percent = proc.cpu_percent(interval=0.1)
                        
                        if 0 <= cpu_percent <= 100 and cpu_percent > 1.0:
                            display_name = proc_info['name'].replace('.exe', '').replace('-win64-shipping', '')
                            found_processes.append({
                                'name': display_name,
                                'cpu': cpu_percent
                            })
                            
                    if len(found_processes) >= 5:  
                        break
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            found_processes.sort(key=lambda x: x['cpu'], reverse=True)
            
            for proc in found_processes[:5]:
                high_consumers.append(f"{proc['name']} ({proc['cpu']:.1f}% CPU)")
            
            logger.info(f"Procesos encontrados: {len(high_consumers)}")
            
        except Exception as psutil_error:
            logger.warning(f"Psutil falló: {str(psutil_error)}, usando fallback")
            
            try:
                cmd = 'tasklist /fi "imagename eq chrome.exe" /fi "imagename eq brave.exe" /fi "imagename eq pathoftitans*.exe" /fo csv'
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=3)
                
                if result.returncode == 0 and result.stdout:
                    lines = result.stdout.strip().split('\n')[1:]  
                    for line in lines[:3]:  
                        if ',' in line:
                            process_name = line.split(',')[0].replace('"', '').replace('.exe', '')
                            high_consumers.append(f"{process_name} (detectado)")
                            
            except Exception as fallback_error:
                logger.warning(f"Fallback también falló: {str(fallback_error)}")
                high_consumers = ["Aplicaciones en segundo plano (análisis limitado)"]
        
        if not high_consumers:
            high_consumers = ["Aplicaciones optimizadas para batería"]
        
        efficiency_score = "Buena" if len(high_consumers) <= 2 else "Mejorable"
        
        logger.info(f"Análisis completado: {len(high_consumers)} aplicaciones encontradas")
        
        return {
            'high_consumers': high_consumers,
            'efficiency_score': efficiency_score
        }
        
    except Exception as e:
        logger.error(f"Error total en analyze_real_power_consumption_fast: {str(e)}")
        return {
            'high_consumers': ['Error al analizar aplicaciones'],
            'efficiency_score': 'No disponible'
        }


def analyze_power_settings():
    """Analiza la configuración de energía del sistema"""
    try:
        if platform.system() != "Windows":
            return {'needs_optimization': False, 'current_plan': 'N/A'}
        
        cmd = 'powershell "Get-WmiObject -Namespace root\\cimv2\\power -Class Win32_PowerPlan | Where-Object {$_.IsActive -eq $true} | Select-Object ElementName"'
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
        
        current_plan = "Desconocido"
        needs_optimization = False
        
        if result.returncode == 0 and result.stdout:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if 'ElementName' in line and ':' in line:
                    current_plan = line.split(':')[1].strip()
                    break
        
        if current_plan.lower() in ['alto rendimiento', 'high performance', 'ultimate performance']:
            needs_optimization = True
        
        return {
            'needs_optimization': needs_optimization,
            'current_plan': current_plan
        }
        
    except Exception as e:
        logger.error(f"Error en analyze_power_settings: {str(e)}")
        return {'needs_optimization': False, 'current_plan': 'Error'}


def analyze_battery_temperature():
    """Analiza la temperatura de la batería"""
    try:
        cmd = 'powershell "Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi | Select-Object CurrentTemperature"'
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
        
        overheating_detected = False
        
        if result.returncode == 0 and result.stdout:
            if "CurrentTemperature" in result.stdout:
                overheating_detected = True 
        
        return {
            'overheating_detected': overheating_detected,
            'temperature_source': 'system_thermal'
        }
        
    except Exception as e:
        return {'overheating_detected': False, 'error': str(e)}


def analyze_charging_patterns():
    """Analiza patrones de carga basado en historial"""
    try:
        return {
            'frequent_full_discharge': False, 
            'optimal_charging': True,
            'pattern_analysis': 'limited_data'
        }
        
    except Exception as e:
        return {'error': str(e)}


def check_battery_calibration_needed(battery_info):
    """Verifica si la batería necesita calibración"""
    try:
        design_capacity = battery_info.get('design_capacity', 0)
        full_charge_capacity = battery_info.get('full_charge_capacity', 0)
        
        if design_capacity > 0 and full_charge_capacity > 0:
            # Si la diferencia es significativa pero no extrema, podría necesitar calibración
            health_ratio = full_charge_capacity / design_capacity
            
            # Entre 60% y 80% podría beneficiarse de calibración
            if 0.6 <= health_ratio <= 0.8:
                return True
        
        return False
        
    except Exception:
        return False


def generate_comprehensive_battery_recommendations(issues, battery_health_data):
    """Genera recomendaciones comprensivas basadas en los problemas encontrados"""
    
    specific_recommendations = []
    for issue in issues:
        specific_recommendations.append(f"• {issue['recommendation']}")
    
    general_recommendations = [
        "• Mantenga la carga entre 20% y 80% para maximizar la vida útil",
        "• Evite temperaturas extremas (muy frío o muy caliente)",
        "• Use el cargador original o uno certificado",
        "• Realice descargas completas solo ocasionalmente (una vez al mes)"
    ]
    
    if battery_health_data.get('health_analysis', {}).get('design_capacity', 0) > 0:
        health_pct = (battery_health_data['health_analysis'].get('full_charge_capacity', 0) / 
                     battery_health_data['health_analysis']['design_capacity']) * 100
        
        if health_pct < 80:
            general_recommendations.append(f"• Su batería tiene {health_pct:.1f}% de salud - considere reemplazo")
    
    all_recommendations = specific_recommendations + general_recommendations
    
    return "\n".join(all_recommendations)

def analyze_real_power_consumption():
    """Analiza el consumo real de energía de aplicaciones - CORREGIDO"""
    try:
        if platform.system() != "Windows":
            return {'high_consumers': [], 'efficiency_score': 'N/A'}
        
        try:
            processes = []
            
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
                try:
                    proc_info = proc.info
                    
                    cpu_percent = proc.cpu_percent(interval=0.5)
                    
                    if proc_info['name'] and cpu_percent > 2.0:
                        processes.append({
                            'name': proc_info['name'],
                            'cpu': cpu_percent,
                            'memory_mb': proc_info['memory_info'].rss / (1024 * 1024) if proc_info['memory_info'] else 0
                        })
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            processes.sort(key=lambda x: x['cpu'], reverse=True)
            
            high_consumers = []
            energy_intensive_apps = [
                'chrome', 'firefox', 'edge', 'opera', 'brave',
                'spotify', 'discord', 'slack', 'teams', 'zoom',
                'photoshop', 'premiere', 'blender', 'unity',
                'steam', 'epicgames', 'pathoftitans',
                'antimalware', 'defender', 'kaspersky'
            ]
            
            for proc in processes[:10]:  
                name = proc['name'].lower()
                cpu = proc['cpu']
                
                if not (0 <= cpu <= 100):
                    continue
                    
                is_energy_app = any(app in name for app in energy_intensive_apps)
                
                if is_energy_app or cpu > 10:
                    display_name = proc['name'].replace('.exe', '').replace('-win64-shipping', '')
                    high_consumers.append(f"{display_name} ({cpu:.1f}% CPU)")
                
                if len(high_consumers) >= 5: 
                    break
            
            efficiency_score = "Buena" if len(high_consumers) <= 2 else "Mejorable" if len(high_consumers) <= 4 else "Mala"
            
            return {
                'high_consumers': high_consumers,
                'efficiency_score': efficiency_score
            }
            
        except Exception as psutil_error:
            logger.error(f"Error con psutil: {str(psutil_error)}")
            return analyze_power_consumption_fallback()
        
    except Exception as e:
        logger.error(f"Error en analyze_real_power_consumption: {str(e)}")
        return analyze_power_consumption_fallback()
    
def analyze_power_consumption_fallback():
    """Método alternativo para obtener consumo cuando falla el principal"""
    try:
        # Método más simple usando tasklist
        cmd = 'tasklist /fo csv | findstr /i "chrome firefox brave steam discord spotify"'
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
        
        detected_consumers = []
        if result.returncode == 0 and result.stdout:
            lines = result.stdout.strip().split('\n')
            for line in lines[:3]:  # Máximo 3
                if ',' in line:
                    process_name = line.split(',')[0].replace('"', '').replace('.exe', '')
                    detected_consumers.append(f"{process_name} (consumo detectado)")
        
        if not detected_consumers:
            # Si no se detecta nada, usar lista genérica
            detected_consumers = ["Aplicaciones en segundo plano (verificación limitada)"]
        
        return {
            'high_consumers': detected_consumers,
            'efficiency_score': 'Verificación básica'
        }
    
    except Exception as e:
        logger.error(f"Error en fallback: {str(e)}")
        return {
            'high_consumers': ['Error al detectar aplicaciones'],
            'efficiency_score': 'No disponible'
        }
        
    
def generate_detailed_battery_report(diagnosis):
    """Genera un informe detallado de batería usando herramientas del sistema"""
    logger = logging.getLogger(__name__)
    
    try:
        if platform.system() != "Windows":
            return {}
        
        report_dir = os.path.join(os.environ.get('TEMP', 'C:\\temp'), 'diagnostics')
        os.makedirs(report_dir, exist_ok=True)
        battery_report_path = os.path.join(report_dir, f'battery_report_{diagnosis.id}.html')
        
        cmd = f'powercfg /batteryreport /output "{battery_report_path}"'
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
        
        if result.returncode != 0:
            logger.warning(f"Error generando informe de batería: {result.stderr}")
        
        battery_info = {}
        
        cmd_capacity = 'powershell "Get-WmiObject -Class BatteryStatus -Namespace root\\wmi | Select-Object -Property DesignedCapacity, FullChargedCapacity"'
        capacity_result = subprocess.run(cmd_capacity, capture_output=True, text=True, shell=True, timeout=10)
        
        if capacity_result.returncode == 0 and capacity_result.stdout:
            try:
                lines = capacity_result.stdout.strip().split('\n')
                for line in lines:
                    if 'DesignedCapacity' in line and ':' in line:
                        designed = line.split(':')[1].strip()
                        battery_info['design_capacity'] = int(designed) if designed.isdigit() else 0
                    elif 'FullChargedCapacity' in line and ':' in line:
                        full_charged = line.split(':')[1].strip()
                        battery_info['full_charge_capacity'] = int(full_charged) if full_charged.isdigit() else 0
            except Exception as e:
                logger.error(f"Error parseando capacidad de batería: {str(e)}")
        
        cmd_cycles = 'powershell "Get-WmiObject -Class BatteryCycleCount -Namespace root\\wmi | Select-Object -Property CycleCount"'
        cycles_result = subprocess.run(cmd_cycles, capture_output=True, text=True, shell=True, timeout=10)
        
        if cycles_result.returncode == 0 and cycles_result.stdout:
            try:
                lines = cycles_result.stdout.strip().split('\n')
                for line in lines:
                    if 'CycleCount' in line and ':' in line:
                        cycles = line.split(':')[1].strip()
                        battery_info['cycle_count'] = int(cycles) if cycles.isdigit() else 0
            except Exception as e:
                logger.error(f"Error obteniendo ciclos de batería: {str(e)}")
        
        html_analysis = {}
        if os.path.exists(battery_report_path):
            try:
                with open(battery_report_path, 'r', encoding='utf-8') as f:
                    report_content = f.read()
                
                html_analysis = analyze_battery_report_content(report_content)
                
                DiagnosticFile.objects.create(
                    diagnosis=diagnosis,
                    file_type="BATTERY_REPORT",
                    file_path=battery_report_path,
                    file_name=f"battery_report_{diagnosis.id}.html"
                )
                
            except Exception as e:
                logger.error(f"Error analizando informe HTML: {str(e)}")
        
        return {
            'report_path': battery_report_path if os.path.exists(battery_report_path) else None,
            'health_analysis': battery_info,
            'cycle_count': battery_info.get('cycle_count', 0),
            'html_analysis': html_analysis,
            'temperature_analysis': analyze_battery_temperature(),
            'charging_pattern': analyze_charging_patterns(),
            'needs_calibration': check_battery_calibration_needed(battery_info)
        }
        
    except Exception as e:
        logger.error(f"Error en generate_detailed_battery_report: {str(e)}")
        return {}

def analyze_battery_report_content(html_content):
    """Analiza el contenido del informe HTML de batería"""
    analysis = {}
    
    try:
        if "DESIGN CAPACITY" in html_content and "FULL CHARGE CAPACITY" in html_content:
            analysis['has_capacity_info'] = True
        
        if "Battery usage" in html_content:
            analysis['has_usage_history'] = True
        
        if "CYCLE COUNT" in html_content or "cycle count" in html_content.lower():
            analysis['has_cycle_info'] = True
        
        if "critical" in html_content.lower() or "warning" in html_content.lower():
            analysis['warnings_found'] = True
        
        return analysis
        
    except Exception as e:
        return {'error': str(e)}
@login_required
@user_passes_test(is_client)
def download_diagnostic_file(request, diagnosis_id, file_type):
    try:
        diagnosis = Diagnosis.objects.get(id=diagnosis_id, user=request.user)
        
        diagnostic_file = DiagnosticFile.objects.get(diagnosis=diagnosis, file_type=file_type)
        
        if not os.path.exists(diagnostic_file.file_path):
            return JsonResponse({"status": "error", "message": "El archivo no existe"}, status=404)
        
        with open(diagnostic_file.file_path, 'rb') as f:
            file_content = f.read()
        
        response = HttpResponse(file_content)
        
        file_ext = os.path.splitext(diagnostic_file.file_name)[1].lower()
        if file_ext == '.html':
            response['Content-Type'] = 'text/html'
        elif file_ext == '.pdf':
            response['Content-Type'] = 'application/pdf'
        else:
            response['Content-Type'] = 'application/octet-stream'
        
        response['Content-Disposition'] = f'attachment; filename="{diagnostic_file.file_name}"'
        
        return response
    except Diagnosis.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Diagnóstico no encontrado"}, status=404)
    except DiagnosticFile.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Archivo no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def get_scenario_result(request, run_id):
    """API para obtener el resultado de una ejecución de escenario"""
    try:
        scenario_run = ScenarioRun.objects.get(id=run_id, user=request.user)
        
        diagnosis = None
        try:
            diagnosis_type = f"S_{scenario_run.scenario.id}"
            diagnosis = Diagnosis.objects.filter(
                user=request.user, 
                scan_type=diagnosis_type
            ).order_by('-timestamp').first()
        except Exception as e:
            print(f"Error al buscar diagnóstico: {str(e)}")
        
        report_available = False
        if diagnosis:
            report_exists = DiagnosticFile.objects.filter(
                diagnosis=diagnosis,
                file_type="BATTERY_REPORT"
            ).exists()
            report_available = report_exists
        
        result_data = scenario_run.get_results_as_dict()
        
        if diagnosis:
            result_data['diagnosis_id'] = diagnosis.id
            result_data['report_available'] = report_available
        
        return JsonResponse({
            "status": "success",
            "data": {
                "id": scenario_run.id,
                "scenario": scenario_run.scenario.name,
                "timestamp": scenario_run.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "issues_found": scenario_run.issues_found,
                "results": result_data,
                "recommendations": scenario_run.recommendations,
                "diagnosis_id": diagnosis.id if diagnosis else None,
                "report_available": report_available
            }
        })
    except ScenarioRun.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Resultado no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def mark_issue_resolved(request, issue_id):
    """API para marcar un problema como resuelto"""
    try:
        if request.method == 'POST':
            issue = DiagnosticIssue.objects.get(id=issue_id, diagnosis__user=request.user)
            issue.is_resolved = True
            issue.save()
            
            return JsonResponse({
                "status": "success",
                "message": "Problema marcado como resuelto"
            })
        else:
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
    except DiagnosticIssue.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Problema no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def defender_status_api(request):
    """API para obtener el estado de Windows Defender"""
    try:
        defender_status = check_antivirus_status()
        return JsonResponse({"status": "success", "data": defender_status})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    
#HISTORIAL DE DIAGNOSTICO
@login_required
@user_passes_test(is_client)
def client_historial(request):
    try:
        historial = Diagnosis.objects.filter(user=request.user).order_by('-timestamp')[:10].values()
        
        return JsonResponse({
            'status': 'success', 
            'historial': list(historial)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)  
        
        
        
#FIX DRIVERS

@login_required
@user_passes_test(is_client)
@csrf_exempt
def fix_driver(request, driver_id):
    """Arregla un controlador específico"""
    try:
        if request.method != 'POST':
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
        
        logger.info(f"Iniciando reparación del controlador: {driver_id}")
        
        if not driver_id:
            return JsonResponse({"status": "error", "message": "ID de controlador no proporcionado"}, status=400)
        
        device_info = get_device_info(driver_id)
        
        if not device_info:
            return JsonResponse({
                "status": "error",
                "message": "No se pudo encontrar información del dispositivo"
            }, status=400)
        
        if platform.system() == "Windows":
            try:
                cmd = f"powershell \"pnputil /scan-devices\""
                scan_result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=60)
                
                if scan_result.returncode != 0:
                    logger.warning(f"Error en escaneo de dispositivos: {scan_result.stderr}")
                
                cmd = f"powershell \"pnputil /disable-device \\\"{driver_id}\\\"\""
                disable_result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if disable_result.returncode != 0:
                    logger.warning(f"Error al deshabilitar dispositivo: {disable_result.stderr}")
                
                time.sleep(2)  
                
                cmd = f"powershell \"pnputil /enable-device \\\"{driver_id}\\\"\""
                enable_result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if enable_result.returncode != 0:
                    logger.warning(f"Error al habilitar dispositivo: {enable_result.stderr}")
                    return JsonResponse({
                        "status": "error",
                        "message": "Error al reiniciar el dispositivo. Se requiere intervención manual."
                    }, status=500)
                
                device_status = check_device_status(driver_id)
                
                if device_status.get('status') == 'OK':
                    return JsonResponse({
                        "status": "success",
                        "message": f"Controlador reparado correctamente. Reinicie el sistema para completar el proceso.",
                        "requires_restart": True
                    })
                else:
                    reinstall_result = reinstall_driver(driver_id)
                    
                    if reinstall_result.get('success'):
                        return JsonResponse({
                            "status": "success",
                            "message": "Controlador reinstalado correctamente. Reinicie el sistema para completar la instalación.",
                            "requires_restart": True
                        })
                    else:
                        return JsonResponse({
                            "status": "warning",
                            "message": "Reparación parcial. Se recomienda actualizar manualmente el controlador a través del Administrador de dispositivos.",
                            "details": reinstall_result.get('message')
                        })
            except Exception as e:
                logger.error(f"Error en la reparación del controlador: {str(e)}")
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al reparar controlador: {str(e)}"
                }, status=500)
        else:
            return JsonResponse({
                "status": "error",
                "message": "Esta funcionalidad solo está disponible en Windows"
            }, status=400)
    except Exception as e:
        logger.error(f"Excepción general en fix_driver: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def get_device_info(device_id):
    """Obtiene información de un dispositivo específico"""
    try:
        if platform.system() == "Windows":
            device_id_escaped = device_id.replace('\\', '\\\\').replace('"', '\\"')
            
            cmd = f'powershell "Get-PnpDevice -InstanceId \'{device_id_escaped}\' | ConvertTo-Json"'
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0 and result.stdout:
                try:
                    return json.loads(result.stdout)
                except json.JSONDecodeError:
                    return None
    except Exception as e:
        logger.error(f"Error al obtener información del dispositivo: {str(e)}")
    return None

def check_device_status(device_id):
    """Verifica el estado actual de un dispositivo"""
    try:
        if platform.system() == "Windows":
            device_id_escaped = device_id.replace('\\', '\\\\').replace('"', '\\"')
            
            cmd = f'powershell "Get-PnpDevice -InstanceId \'{device_id_escaped}\' | Select-Object Status, Problem, ConfigManagerErrorCode | ConvertTo-Json"'
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0 and result.stdout:
                try:
                    data = json.loads(result.stdout)
                    return {
                        'status': data.get('Status'),
                        'problem': data.get('Problem'),
                        'error_code': data.get('ConfigManagerErrorCode')
                    }
                except json.JSONDecodeError:
                    return {'status': 'Unknown', 'error': 'Error al decodificar respuesta'}
    except Exception as e:
        logger.error(f"Error al verificar estado del dispositivo: {str(e)}")
    return {'status': 'Unknown', 'error': 'Error al verificar estado'}

def reinstall_driver(device_id):
    """Reinstala el controlador de un dispositivo"""
    try:
        if platform.system() == "Windows":
            device_id_escaped = device_id.replace('\\', '\\\\').replace('"', '\\"')
            
            cmd = f'powershell "Get-WmiObject Win32_PnPSignedDriver | Where-Object {{ $_.DeviceID -eq \'{device_id_escaped}\' }} | Select-Object DeviceName, DriverVersion, InfName | ConvertTo-Json"'
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0 and result.stdout:
                try:
                    driver_info = json.loads(result.stdout)
                    
                    inf_name = driver_info.get('InfName')
                    if inf_name:
                        cmd = f'powershell "pnputil /add-driver \'{inf_name}\' /install"'
                        reinstall_result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=60)
                        
                        if reinstall_result.returncode == 0:
                            return {'success': True, 'message': 'Controlador reinstalado correctamente'}
                        else:
                            return {'success': False, 'message': f'Error al reinstalar: {reinstall_result.stderr}'}
                except json.JSONDecodeError:
                    return {'success': False, 'message': 'Error al obtener información del controlador'}
            
            cmd = f'powershell "Update-PnpDriver -InstanceId \'{device_id_escaped}\' -Online -Confirm:$false"'
            update_result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=120)
            
            if update_result.returncode == 0:
                return {'success': True, 'message': 'Controlador actualizado correctamente'}
            else:
                return {'success': False, 'message': 'No se pudo actualizar automáticamente'}
    except Exception as e:
        logger.error(f"Error al reinstalar controlador: {str(e)}")
        return {'success': False, 'message': f'Error: {str(e)}'}

@login_required
@user_passes_test(is_client)
@csrf_exempt
def fix_all_drivers(request):
    """Arregla todos los controladores problemáticos - SIN EJECUTAR ESCENARIOS AUTOMÁTICOS"""
    try:
        if request.method != 'POST':
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
        
        problematic_devices = get_problematic_devices()
        
        if not problematic_devices:
            return JsonResponse({
                "status": "success",
                "message": "No se encontraron dispositivos con problemas para reparar"
            })
        
        results = []
        success_count = 0
        
        for device in problematic_devices:
            device_id = device.get('DeviceID')
            device_name = device.get('Caption', 'Dispositivo desconocido')
            
            if device_id:
                repair_result = repair_device(device_id)
                
                results.append({
                    'device': device_name,
                    'success': repair_result.get('success', False),
                    'message': repair_result.get('message', '')
                })
                
                if repair_result.get('success', False):
                    success_count += 1
        
        if success_count == 0:
            message = "No se pudo reparar ningún dispositivo automáticamente. Se requiere intervención manual."
            status = "warning"
        elif success_count == len(problematic_devices):
            message = f"Se repararon todos los {len(problematic_devices)} dispositivos con problemas. Reinicie el sistema para completar el proceso."
            status = "success"
        else:
            message = f"Se repararon {success_count} de {len(problematic_devices)} dispositivos. Algunos requieren intervención manual."
            status = "partial"
        
   
        return JsonResponse({
            "status": status,
            "message": message,
            "results": results,
            "requires_restart": True
        })
        
    except Exception as e:
        logger.error(f"Excepción general en fix_all_drivers: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def get_problematic_devices():
    """Obtiene la lista de dispositivos con problemas - OPTIMIZADA"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-PnpDevice | Where-Object { $_.Status -ne 'OK' } | Select-Object -Property Caption, Status, InstanceId, DeviceID, Problem, Class, HardwareID | ConvertTo-Json -Depth 3\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0 and result.stdout:
                try:
                    devices = json.loads(result.stdout)
                    
                    if not isinstance(devices, list):
                        devices = [devices]
                   
                    devices = [d for d in devices if 
                              d.get('Problem', 0) > 0 and 
                              not (d.get('Caption', '').startswith('WAN Miniport') and d.get('Status') == 'Unknown')]
                    
                    return devices
                except json.JSONDecodeError:
                    logger.error("Error al decodificar JSON de dispositivos problemáticos")
                    return []
    except Exception as e:
        logger.error(f"Error al obtener dispositivos problemáticos: {str(e)}")
    return []

def repair_device(device_id):
    """Intenta reparar un dispositivo específico"""
    try:
        if platform.system() == "Windows":
            # Si es un WAN Miniport, manejo especial
            if "WAN Miniport" in device_id:
                logger.info("Dispositivo WAN Miniport detectado, aplicando manejo especial")
                # Estos dispositivos son virtuales y generalmente no requieren reparación real
                return {
                    'success': True, 
                    'message': 'Dispositivo virtual marcado como reparado. Estos controladores generalmente no requieren reparación.'
                }
            
            # Para dispositivos con Error 43 (controlador desconocido)
            if "USB\\UNKNOWN" in device_id or "HID\\UNKNOWN" in device_id:
                logger.info("Dispositivo desconocido detectado, intentando reinstalación completa")
                
                # Intentar una secuencia más agresiva para dispositivos desconocidos
                try:
                    # Primero desinstalamos completamente el controlador
                    cmd = f"powershell \"pnputil /remove-device \"{device_id}\"\""
                    subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                    
                    # Esperamos un poco
                    time.sleep(5)
                    
                    # Escaneamos para detectar nuevo hardware
                    cmd = f"powershell \"pnputil /scan-devices\""
                    subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=60)
                    
                    return {
                        'success': True,
                        'message': 'Dispositivo desconocido eliminado y reescaneado. Se recomienda reiniciar el sistema.'
                    }
                except Exception as e:
                    logger.error(f"Error en la reinstalación completa: {str(e)}")
                    # Continuamos con el método estándar si el enfoque agresivo falla
            
            # Procedimiento estándar para otros dispositivos
            device_id_escaped = device_id.replace('\\', '\\\\').replace('"', '\\"')
            
            cmd = f"powershell \"pnputil /scan-devices\""
            subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=60)
            
            cmd = f"powershell \"pnputil /disable-device \\\"{device_id_escaped}\\\"\""
            subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            time.sleep(2)  
            
            cmd = f"powershell \"pnputil /enable-device \\\"{device_id_escaped}\\\"\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0:
                device_status = check_device_status(device_id)
                
                if device_status.get('status') == 'OK':
                    return {'success': True, 'message': 'Dispositivo reparado correctamente'}
                else:
                    cmd = f'powershell "Update-PnpDriver -InstanceId \'{device_id_escaped}\' -Online -Confirm:$false"'
                    update_result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=120)
                    
                    if update_result.returncode == 0:
                        return {'success': True, 'message': 'Controlador actualizado correctamente'}
                    else:
                        return {'success': False, 'message': 'No se pudo reparar automáticamente'}
            else:
                return {'success': False, 'message': 'Error al habilitar dispositivo'}
    except Exception as e:
        logger.error(f"Error al reparar dispositivo: {str(e)}")
        return {'success': False, 'message': f'Error: {str(e)}'}
    
    

    
@login_required
@user_passes_test(is_client)
@csrf_exempt
def scan_drivers(request):
    """Escanea los controladores del sistema"""
    try:
        if request.method != 'POST':
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
        
        if platform.system() != "Windows":
            return JsonResponse({
                "status": "error",
                "message": "Esta funcionalidad solo está disponible en Windows"
            }, status=400)
        
        try:
            scan_cmd = 'powershell.exe -Command "& {pnputil /scan-devices}"'
            scan_result = subprocess.run(
                scan_cmd, 
                capture_output=True, 
                text=True, 
                shell=True, 
                timeout=30,
                encoding='utf-8',
                errors='ignore'
            )
            
            logger.info(f"Scan result code: {scan_result.returncode}")
            
        except subprocess.TimeoutExpired:
            logger.error("Timeout en escaneo de dispositivos")
            return JsonResponse({
                "status": "error",
                "message": "Timeout al escanear dispositivos"
            }, status=500)
        except Exception as e:
            logger.error(f"Error ejecutando scan: {str(e)}")
            
        try:
            devices_cmd = 'powershell.exe -Command "& {Get-PnpDevice | Where-Object {$_.Status -ne \'OK\'} | Select-Object Caption, Status, Problem | ConvertTo-Json}"'
            devices_result = subprocess.run(
                devices_cmd, 
                capture_output=True, 
                text=True, 
                shell=True, 
                timeout=20,
                encoding='utf-8',
                errors='ignore'
            )
            
            logger.info(f"Devices result code: {devices_result.returncode}")
            logger.info(f"Devices output length: {len(devices_result.stdout) if devices_result.stdout else 0}")
            
            problem_count = 0
            devices_total = 0
            
            if devices_result.returncode == 0 and devices_result.stdout.strip():
                try:
                    devices_data = json.loads(devices_result.stdout)
                    
                    if not isinstance(devices_data, list):
                        devices_data = [devices_data] if devices_data else []
                    
                    problem_count = len(devices_data)
                    
                    total_cmd = 'powershell.exe -Command "& {(Get-PnpDevice).Count}"'
                    total_result = subprocess.run(
                        total_cmd, 
                        capture_output=True, 
                        text=True, 
                        shell=True, 
                        timeout=10,
                        encoding='utf-8',
                        errors='ignore'
                    )
                    
                    if total_result.returncode == 0 and total_result.stdout.strip():
                        try:
                            devices_total = int(total_result.stdout.strip())
                        except ValueError:
                            devices_total = 100  
                    else:
                        devices_total = 100 
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing JSON: {str(e)}")
                    logger.error(f"Raw output: {devices_result.stdout[:500]}")
                    problem_count = 0
                    devices_total = 100
                except Exception as e:
                    logger.error(f"Error procesando datos de dispositivos: {str(e)}")
                    problem_count = 0
                    devices_total = 100
            else:
                logger.info("No se encontraron dispositivos problemáticos o comando falló")
                problem_count = 0
                devices_total = 100
            
            return JsonResponse({
                "status": "success",
                "message": f"Escaneo completado. Se encontraron {problem_count} dispositivos con problemas.",
                "devices_total": devices_total,
                "problem_count": problem_count
            })
            
        except subprocess.TimeoutExpired:
            logger.error("Timeout obteniendo información de dispositivos")
            return JsonResponse({
                "status": "success",
                "message": "Escaneo completado (timeout en análisis detallado)",
                "devices_total": 100,
                "problem_count": 0
            })
        except Exception as e:
            logger.error(f"Error obteniendo información de dispositivos: {str(e)}")
            return JsonResponse({
                "status": "success",
                "message": "Escaneo completado (error en análisis detallado)",
                "devices_total": 100,
                "problem_count": 0
            })
            
    except Exception as e:
        logger.error(f"Excepción general en scan_drivers: {str(e)}")
        return JsonResponse({
            "status": "error", 
            "message": f"Error interno: {str(e)}"
        }, status=500)
    
@login_required
@user_passes_test(is_client)
def search_and_download_driver(device_info):
    """Busca y descarga el controlador más reciente para un dispositivo"""
    try:
        if platform.system() == "Windows":
            device_id = device_info.get('DeviceID')
            device_name = device_info.get('DeviceName', 'Dispositivo desconocido')
            
            cmd = f"powershell \"Get-WindowsUpdate -Device '{device_id}' -Driver | Select-Object Title, Version, DriverID | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
            
            if result.returncode == 0 and result.stdout:
                updates = json.loads(result.stdout)
                if updates and isinstance(updates, list):
                    latest_update = updates[0]
                    return {
                        "success": True,
                        "download_url": "", 
                        "version": latest_update.get('Version', 'Desconocida'),
                        "message": f"Controlador encontrado para {device_name}"
                    }
            
            return {
                "success": False,
                "message": f"No se encontró controlador actualizado para {device_name}"
            }
        
        return {
            "success": False,
            "message": "Sistema operativo no soportado"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error al buscar controlador: {str(e)}"
        }

def get_driver_by_id(driver_id):
    """Obtiene información detallada de un controlador específico"""
    try:
        if platform.system() == "Windows":
            cmd = f"powershell \"Get-WmiObject Win32_PnPSignedDriver | Where-Object {{ $_.DeviceID -eq '{driver_id}' }} | Select-Object DeviceName, DriverVersion, DriverDate, Manufacturer, DeviceID | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                return json.loads(result.stdout)
        return {}
    except:
        return {}

def get_device_by_id(device_id):
    """Obtiene información de un dispositivo por su ID"""
    try:
        if platform.system() == "Windows":
            cmd = f"powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {{ $_.DeviceID -eq '{device_id}' }} | Select-Object Caption, DeviceID, Name, Status | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                return json.loads(result.stdout)
        return {}
    except:
        return {}

@login_required
@user_passes_test(is_client)
def download_driver(request, device_id):
    """Descarga el controlador más reciente para un dispositivo"""
    try:
        device_info = get_device_by_id(device_id)
        download_result = search_and_download_driver(device_info)
        
        if download_result['success']:
            return JsonResponse({
                "status": "success",
                "message": "Controlador descargado correctamente",
                "download_url": download_result.get('download_url', ''),
                "version": download_result.get('version', '')
            })
        else:
            return JsonResponse({
                "status": "error",
                "message": download_result.get('message', 'No se pudo encontrar el controlador')
            }, status=400)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


def get_problematic_drivers():
    """Obtiene lista de controladores problemáticos"""
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {$_.ConfigManagerErrorCode -ne 0} | Select Caption, ConfigManagerErrorCode, DeviceID | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout:
                problem_data = json.loads(result.stdout)
                
                if not isinstance(problem_data, list):
                    problem_data = [problem_data]
                
                return problem_data
        return []
    except:
        return []

def update_specific_driver(driver_info):
    """Actualiza un controlador específico"""
    try:
        device_id = driver_info.get('DeviceID')
        if not device_id:
            return {"success": False, "message": "ID de dispositivo no válido"}
        
        if platform.system() == "Windows":
            try:
                cmd = f"powershell \"pnputil /scan-devices\""
                subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=60)
                
                cmd = f"powershell \"pnputil /disable-device '{device_id}'\""
                subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                cmd = f"powershell \"pnputil /enable-device '{device_id}'\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if result.returncode == 0:
                    return {"success": True, "message": "Controlador reinstalado correctamente"}
                
                return search_and_update_driver(driver_info)
            except Exception as e:
                return {"success": False, "message": f"Error al actualizar: {str(e)}"}
        
        return {"success": False, "message": "Sistema operativo no soportado"}
    except Exception as e:
        return {"success": False, "message": f"Error general: {str(e)}"}

def search_and_update_driver(driver_info):
    """Busca y actualiza un controlador"""
    try:
  
        device_id = driver_info.get('DeviceID')
        device_name = driver_info.get('DeviceName', 'Dispositivo desconocido')
        
        if platform.system() == "Windows":
            cmd = f"powershell \"Start-Process -FilePath 'pnputil.exe' -ArgumentList '/add-driver C:\\temp\\drivers\\*.inf /subdirs /install' -Verb RunAs -Wait\""
            subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=120)
            
            verify_cmd = f"powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {{ $_.DeviceID -eq '{device_id}' }} | Select-Object ConfigManagerErrorCode | ConvertTo-Json\""
            verify_result = subprocess.run(verify_cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if verify_result.returncode == 0 and verify_result.stdout:
                result_data = json.loads(verify_result.stdout)
                if result_data.get('ConfigManagerErrorCode', -1) == 0:
                    return {"success": True, "message": f"Controlador de {device_name} actualizado correctamente"}
            
            return {"success": False, "message": "No se pudo actualizar automáticamente. Se requiere intervención manual."}
    
    except Exception as e:
        return {"success": False, "message": f"Error en la actualización: {str(e)}"}
      
      
@login_required
@user_passes_test(is_client)
@csrf_exempt
def restart_system(request):
    try:
        if request.method != 'POST':
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
        
        if platform.system() == "Windows":
            # Iniciar reinicio con retraso para permitir que la respuesta se envíe
            subprocess.Popen('shutdown /r /t 5 /c "Reinicio solicitado desde el panel de diagnóstico"', shell=True)
            return JsonResponse({"status": "success", "message": "Reinicio iniciado"})
        else:
            return JsonResponse({"status": "error", "message": "Reinicio solo disponible en Windows"}, status=400)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    
    
#MANTENIMEINTO

@login_required
@user_passes_test(is_client)
def client_repair_disk(request):
    try:
        response = requests.post('http://localhost:5001/repair_disk')
        data = response.json()

        if response.status_code == 200:
            return JsonResponse({"status": data.get("status"), "message": data.get("message")})
        else:
            return JsonResponse({"status": "error", "message": "Error al reparar el disco"}, status=500)

    except Exception as e:
        return JsonResponse({"status": "error", "message": f"Error inesperado: {str(e)}"}, status=500)
    
def get_temp_directories():
    return [
        tempfile.gettempdir(),
        os.getenv('TEMP', '/tmp'),
        os.getenv('TMPDIR', '/tmp'),
        os.path.expanduser('~/.cache'),
        '/var/tmp',
        os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'Temp') if os.name == 'nt' else None,
        os.path.join(os.path.expanduser('~'), 'Library', 'Caches') if os.name == 'darwin' else None,
    ]
    
def is_file_in_use(file_path):
    try:
        with open(file_path, 'rb') as f:
            f.read(1)
        return False
    except (PermissionError, OSError):
        return True
    
def formatear_tamano(bytes_size):
    if bytes_size == 0:
        return "0 B"
        
    unidades = ['B', 'KB', 'MB', 'GB', 'TB']
    for unidad in unidades:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unidad}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} PB"

        
@login_required
@require_POST
@user_passes_test(is_client)
def client_clear_space(request):
    try:
        old_files_hours = 24 
        min_file_size = 1024 
        old_files_threshold = time.time() - (old_files_hours * 60 * 60)

        temp_directories = get_temp_directories()
        temp_directories = [d for d in temp_directories if d and os.path.exists(d) and os.path.isdir(d)]

        total_deleted = 0
        total_failed = 0
        total_bytes_deleted = 0
        total_scanned_files = 0
        total_bytes_scanned = 0
        skipped_files = 0

        failed_files = []
        deleted_files = []
        files_in_use_details = []

        for temp_dir in temp_directories:
            try:
                logger.info(f"Procesando directorio temporal: {temp_dir}")
                for root, _, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        try:
                            if not os.path.isfile(file_path) or not os.path.exists(file_path):
                                continue

                            try:
                                file_size = os.path.getsize(file_path)
                                file_mod_time = os.path.getmtime(file_path)
                            except (OSError, PermissionError):
                                total_failed += 1
                                continue

                            if file_size < min_file_size:
                                skipped_files += 1
                                continue

                            total_scanned_files += 1
                            total_bytes_scanned += file_size

                            if is_file_in_use(file_path):
                                files_in_use_details.append({
                                    'path': file_path,
                                    'size': formatear_tamano(file_size)
                                })
                                total_failed += 1
                                continue

                            if file_mod_time < old_files_threshold:
                                try:
                                    os.remove(file_path)
                                    total_deleted += 1
                                    total_bytes_deleted += file_size
                                    deleted_files.append({
                                        'path': file_path,
                                        'size': formatear_tamano(file_size)
                                    })
                                    logger.info(f"Archivo eliminado: {file_path} ({formatear_tamano(file_size)})")
                                except Exception as e:
                                    logger.error(f"Error al eliminar {file_path}: {str(e)}")
                                    failed_files.append({
                                        'path': file_path,
                                        'size': formatear_tamano(file_size),
                                        'error': str(e)
                                    })
                                    total_failed += 1
                        except Exception as e:
                            logger.error(f"Error procesando {file_path}: {str(e)}")
                            continue
            except Exception as e:
                logger.error(f"Error al procesar directorio {temp_dir}: {str(e)}")
                continue

        tamano_liberado = formatear_tamano(total_bytes_deleted)
        tamano_total_escaneado = formatear_tamano(total_bytes_scanned)

        total_failed_size = 0
        for file in files_in_use_details:
            try:
                if os.path.exists(file['path']) and os.access(file['path'], os.R_OK):
                    total_failed_size += os.path.getsize(file['path'])
            except Exception:
                continue

        porcentaje_eliminados = (
            f"{(total_deleted / total_scanned_files * 100):.1f}%"
            if total_scanned_files > 0 else "0%"
        )

        messageSuccess = (
            f"🧹 <strong>Eliminados:</strong> {total_deleted} de {total_scanned_files} archivos temporales.<br>"
            f"💾 <strong>Tamaño liberado:</strong> {tamano_liberado} de {tamano_total_escaneado} totales ({porcentaje_eliminados}).<br>"
            f"📁 <strong>Archivos en uso no eliminados:</strong> {len(files_in_use_details)}."
        )
        messageInfo = (
            f" No hay archivos para eliminar porque están en uso. <br>"
            f"🧹 <strong>Eliminados:</strong> {total_deleted} de {total_scanned_files} archivos temporales.<br>"
            f"💾 <strong>Tamaño liberado:</strong> {tamano_liberado} de {tamano_total_escaneado} totales.<br>"
            f"📁 <strong>Archivos en uso no eliminados:</strong> {len(files_in_use_details)}."
        )

        response_data = {
            "total_deleted": total_deleted,
            "space_freed": tamano_liberado,
            "total_scanned": total_scanned_files,
            "total_scanned_size": tamano_total_escaneado,
            "files_in_use": len(files_in_use_details),
            "total_failed_size": formatear_tamano(total_failed_size),
            "details": {
                "directories_checked": len(temp_directories),
                "skipped_files": skipped_files,
                "oldest_file_age_hours": old_files_hours,
                "percent_deleted": porcentaje_eliminados
            }
        }

        # Adicionar el tipo de status y message:
        if total_deleted == 0 and total_bytes_deleted == 0:
            response_data["status"] = "info"
            response_data["message"] = messageInfo
        else:
            response_data["status"] = "success"
            response_data["message"] = messageSuccess

        return JsonResponse(response_data)

    except Exception as e:
        logger.error(f"Error en client_clear_space: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": f"Error inesperado: {str(e)}"
        }, status=500)
    
@login_required
@require_GET
@user_passes_test(is_client)
def get_largest_temp_files(request):
    temp_directories = [
        tempfile.gettempdir(),
        os.getenv('TEMP', '/tmp'),
        os.getenv('TMPDIR', '/tmp'),
        os.path.expanduser('~/.cache'),
        '/var/tmp',
        os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'Temp') if os.name == 'nt' else None,
        os.path.join(os.path.expanduser('~'), 'Library', 'Caches') if os.name == 'darwin' else None,
    ]
    
    temp_directories = [d for d in temp_directories if d and os.path.exists(d) and os.path.isdir(d)]
    
    max_files = 20
    largest_files = []
    
    for temp_dir in temp_directories:
        try:
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        if not os.path.isfile(file_path) or not os.path.exists(file_path):
                            continue
                            
                        file_size = os.path.getsize(file_path)
                        
                        if file_size < 1024 * 1024:
                            continue
                            
                        if len(largest_files) < max_files:
                            heapq.heappush(largest_files, (file_size, file_path))
                        elif file_size > largest_files[0][0]:
                            heapq.heappushpop(largest_files, (file_size, file_path))
                    except (OSError, PermissionError):
                        continue
        except Exception:
            continue
    
    large_files_info = []
    largest_files.sort(reverse=True)
    
    for size, path in largest_files:
        large_files_info.append({
            'path': path,
            'size': formatear_tamano(size),
            'size_bytes': size,
            'can_delete': os.access(path, os.W_OK)
        })
    
    return JsonResponse({
        "status": "success",
        "large_files": large_files_info,
        "total_found": len(large_files_info)
    })

@login_required
@require_POST
@user_passes_test(is_client)
def client_clear_specific_temp(request):
    try:
        data = json.loads(request.body)
        file_paths = data.get('file_paths', [])
        
        if not file_paths:
            return JsonResponse({
                "status": "error",
                "message": "No se proporcionaron archivos para eliminar"
            })
        
        deleted = 0
        failed = 0
        total_size_freed = 0
        failed_details = []
        
        for path in file_paths:
            try:
                if os.path.exists(path) and os.path.isfile(path):
                    size = os.path.getsize(path)
                    os.remove(path)
                    deleted += 1
                    total_size_freed += size
                else:
                    failed += 1
                    failed_details.append({
                        "path": path,
                        "reason": "Archivo no encontrado"
                    })
            except Exception as e:
                failed += 1
                failed_details.append({
                    "path": path,
                    "reason": str(e)
                })
        
        return JsonResponse({
            "status": "success",
            "message": f"Archivos eliminados: {deleted}. Espacio liberado: {formatear_tamano(total_size_freed)}",
            "deleted": deleted,
            "failed": failed,
            "space_freed": formatear_tamano(total_size_freed),
            "failed_details": failed_details
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Error al eliminar archivos: {str(e)}"
        }, status=500)

@login_required
@require_GET
def get_system_temp_info(request):
    try:
        temp_directories = [
            tempfile.gettempdir(),
            os.getenv('TEMP', '/tmp'),
            os.getenv('TMPDIR', '/tmp'),
            os.path.expanduser('~/.cache'),
        ]
        
        temp_directories = [d for d in temp_directories if d and os.path.exists(d) and os.path.isdir(d)]
        
        system_info = {
            'temp_directories': temp_directories,
            'disk_usage': {},
            'recommendations': []
        }
        
        for temp_dir in temp_directories:
            try:
                total_size = 0
                file_count = 0
                large_file_count = 0
                
                for root, _, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        try:
                            if os.path.isfile(file_path):
                                size = os.path.getsize(file_path)
                                total_size += size
                                file_count += 1
                                
                                if size > 10 * 1024 * 1024:
                                    large_file_count += 1
                        except (OSError, PermissionError):
                            continue
                
                system_info['disk_usage'][temp_dir] = {
                    'total_size': formatear_tamano(total_size),
                    'total_size_bytes': total_size,
                    'file_count': file_count,
                    'large_file_count': large_file_count
                }
                
                if total_size > 1 * 1024 * 1024 * 1024:
                    system_info['recommendations'].append(
                        f"El directorio {temp_dir} ocupa más de 1GB. Se recomienda limpiarlo con frecuencia."
                    )
                
                if large_file_count > 5:
                    system_info['recommendations'].append(
                        f"Se encontraron {large_file_count} archivos grandes en {temp_dir}. Considere eliminarlos manualmente."
                    )
                
            except Exception:
                continue
        
        return JsonResponse({
            "status": "success",
            "system_info": system_info
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Error al obtener información del sistema: {str(e)}"
        }, status=500)
        
@login_required
@user_passes_test(is_client)
def client_update_software(request):
    """
    Verifica actualizaciones del sistema operativo y, si es Windows,
    redirige a la configuración de Windows Update.
    """
    try:
        system_platform = platform.system().lower()  

        if "windows" in system_platform:
      
            try:
                subprocess.run(
                    ["start", "ms-settings:windowsupdate"],
                    shell=True,
                    check=True
                )
                return JsonResponse({
                    "status": "success",
                    "message": "Búsqueda de actualizaciones realizada. Se abrió Windows Update para más detalles."
                })
            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"No se pudo abrir Windows Update: {str(e)}"
                }, status=500)

        elif "linux" in system_platform:
            # Para Linux, verificamos y mostramos actualizaciones
            check_updates = subprocess.run(
                ["sudo", "apt-get", "update", "-y"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            if check_updates.returncode != 0:
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al verificar actualizaciones: {check_updates.stderr}"
                }, status=500)

            check_upgradable = subprocess.run(
                ["apt", "list", "--upgradable"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            if check_upgradable.returncode != 0:
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al buscar actualizaciones: {check_upgradable.stderr}"
                }, status=500)

            upgradable_packages = check_upgradable.stdout.splitlines()[1:]
            if upgradable_packages:
                return JsonResponse({
                    "status": "success",
                    "message": f"Se encontraron actualizaciones disponibles: {len(upgradable_packages)} paquetes.",
                    "details": upgradable_packages
                })
            else:
                return JsonResponse({
                    "status": "success",
                    "message": "El sistema ya está actualizado.",
                    "details": []
                })

        else:
            return JsonResponse({
                "status": "error",
                "message": "Sistema operativo no soportado para actualizaciones automáticas."
            }, status=500)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Error inesperado: {str(e)}"
        }, status=500)

@login_required
@user_passes_test(is_client)
def client_defragment_disk(request):
    """
    Desfragmenta el disco basado en el sistema operativo, con validaciones adicionales:
    - Detecta si el disco es un SSD para evitar desfragmentaciones innecesarias.
    - Verifica que la unidad esté disponible.
    """
    try:
        system_platform = platform.system().lower()  
        drive = request.GET.get("drive", "C:")  

        if "windows" in system_platform:
            # Validar que la unidad esté disponible en Windows
            try:
                check_drive = subprocess.run(
                    ["fsutil", "fsinfo", "drives"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=True
                )
                if check_drive.returncode != 0 or f"{drive}\\" not in check_drive.stdout:
                    return JsonResponse({
                        "status": "error",
                        "message": f"La unidad {drive} no está disponible."
                    }, status=500)

            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al verificar la unidad {drive}: {str(e)}"
                }, status=500)

            try:
                disk_check = subprocess.run(
                    ["wmic", "diskdrive", "get", "model,mediaType"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=True
                )
                if disk_check.returncode == 0 and "SSD" in disk_check.stdout:
                    return JsonResponse({
                        "status": "success",
                        "message": f"La unidad {drive} es un SSD. No se requiere desfragmentación."
                    })
            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"No se pudo determinar si la unidad {drive} es un SSD: {str(e)}"
                }, status=500)

            # Ejecutar desfragmentación en Windows
            try:
                result = subprocess.run(
                    ["defrag", drive, "/U", "/V"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=True
                )
                if result.returncode == 0:
                    return JsonResponse({
                        "status": "success",
                        "message": f"Desfragmentación de la unidad {drive} completada.",
                        "details": result.stdout
                    })
                else:
                    return JsonResponse({
                        "status": "error",
                        "message": f"Error al desfragmentar la unidad {drive}: {result.stderr}",
                        "details": result.stderr
                    }, status=500)

            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al ejecutar la desfragmentación en Windows: {str(e)}"
                }, status=500)

        elif "linux" in system_platform:
            # Verificar si `e4defrag` está disponible en Linux
            try:
                check_tool = subprocess.run(
                    ["which", "e4defrag"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                if check_tool.returncode != 0:
                    return JsonResponse({
                        "status": "error",
                        "message": "El comando e4defrag no está disponible en el sistema."
                    }, status=500)

            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al verificar e4defrag: {str(e)}"
                }, status=500)

            # Ejecutar desfragmentación en Linux
            drive_path = request.GET.get("drive", "/")  
            try:
                result = subprocess.run(
                    ["e4defrag", drive_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                if result.returncode == 0:
                    return JsonResponse({
                        "status": "success",
                        "message": f"Desfragmentación del disco en {drive_path} completada.",
                        "details": result.stdout
                    })
                else:
                    return JsonResponse({
                        "status": "error",
                        "message": f"Error al desfragmentar el disco en {drive_path}: {result.stderr}",
                        "details": result.stderr
                    }, status=500)

            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"Error al ejecutar la desfragmentación en Linux: {str(e)}"
                }, status=500)

        else:
            return JsonResponse({
                "status": "error",
                "message": "Sistema operativo no soportado para desfragmentación automática."
            }, status=500)

    except Exception as e:
        # Captura de errores generales
        return JsonResponse({
            "status": "error",
            "message": f"Error inesperado: {str(e)}"
        }, status=500)
        

def client_learning_center(request):
    """
    Muestra los videos disponibles en el Centro de Aprendizaje con búsqueda y paginación.
    """
    query = request.GET.get('q', '')  # Obtener el término de búsqueda
    videos = LearningVideo.objects.all()[:3]

    # Filtrar videos por título o descripción si hay una búsqueda
    # if query:
    #     videos = videos.filter(
    #         Q(title__icontains=query) | Q(description__icontains=query)
    #     )

    # Paginación: 6 videos por página
    # paginator = Paginator(videos, 3)
    # page_number = request.GET.get('page')
    # videos = paginator.get_page(page_number)
    video_list = [
        {
            'id': video.id,
            'title': video.title,
            'description': video.description,
            'youtube_url': video.youtube_url,
            'embed_url': video.get_embed_url(),
            'created_at': video.created_at.isoformat()
        }
        for video in videos
    ]

    return JsonResponse({'videos': video_list})

# Admin dashboard
@login_required
@user_passes_test(is_admin)
def admin_inicio(request):
    return render(request, 'dashboard/admin/admin_inicio.html')

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    technicians_count = User.objects.filter(role='tech').count()
    clients_count = User.objects.filter(role='client').count()
    admins_count = User.objects.filter(role='admin').count()
    tickets_count = Ticket.objects.count()

    # Filtrar por fechas si se han proporcionado
    start_date = request.GET.get('startDate', None)
    end_date = request.GET.get('endDate', None)

    tickets_per_month = (
        Ticket.objects.annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(total=Count('id'))
        .order_by('month')
    )

    if start_date:
        start_date = parse_date(start_date)
        tickets_per_month = tickets_per_month.filter(month__gte=start_date)
    if end_date:
        end_date = parse_date(end_date)
        tickets_per_month = tickets_per_month.filter(month__lte=end_date)

    tickets_per_month = {t['month'].strftime('%Y-%m'): t['total'] for t in tickets_per_month}

    # Filtrar por técnico si se ha proporcionado
    technician = request.GET.get('technician', None)
    cases_by_technician = (
        Ticket.objects.values('assigned_to__username')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    if technician:
        cases_by_technician = cases_by_technician.filter(assigned_to__username=technician)

    cases_by_technician = {t['assigned_to__username']: t['total'] for t in cases_by_technician if t['assigned_to__username']}

    context = {
        'technicians_count': technicians_count,
        'clients_count': clients_count,
        'admins_count': admins_count,  
        'tickets_count': tickets_count,
        'tickets_per_month': json.dumps(tickets_per_month),  
        'cases_by_technician': json.dumps(cases_by_technician),  
    }
    return render(request, 'dashboard/admin/admin_dashboard.html', context)

@login_required
@user_passes_test(is_admin)
def video_list(request):
    """
    Vista para listar todos los videos en el Centro de Aprendizaje.
    """
    videos = LearningVideo.objects.all()
    return render(request, 'dashboard/admin/video_list.html', {'videos': videos})


@login_required
@user_passes_test(is_admin)
def video_create(request):
    """
    Vista para crear un nuevo video.
    """
    video_title = "Agregar Video" 

    if request.method == 'POST':
        form = LearningVideoForm(request.POST)
        if form.is_valid():
            new_video = form.save()
            video_title = new_video.title  
            messages.success(request, "El video se agregó correctamente.")
            return redirect('video_list')
        else:
            messages.error(request, "Hubo un error al agregar el video. Verifica los datos ingresados.")
    else:
        form = LearningVideoForm()

    return render(request, 'dashboard/admin/video_form.html', {'form': form, 'video_title': video_title})


@login_required
@user_passes_test(is_admin)
def video_update(request, pk):
    """
    Vista para actualizar un video existente.
    """
    video = get_object_or_404(LearningVideo, pk=pk)
    if request.method == 'POST':
        form = LearningVideoForm(request.POST, instance=video)
        if form.is_valid():
            form.save()
            messages.success(request, "El video se actualizó correctamente.")
            return redirect('video_list')
        else:
            messages.error(request, "Hubo un error al actualizar el video. Verifica los datos ingresados.")
    else:
        form = LearningVideoForm(instance=video)

    return render(request, 'dashboard/admin/video_form.html', {'form': form, 'video': video})


@login_required
@user_passes_test(is_admin)
def video_delete(request, pk):
    """
    Vista para eliminar un video existente.
    """
    video = get_object_or_404(LearningVideo, pk=pk)
    if request.method == 'POST':
        video.delete()
        messages.success(request, "El video se eliminó correctamente.")
        return redirect('video_list')
    return render(request, 'dashboard/admin/video_confirm_delete.html', {'video': video})

#tech dashboard
def is_technician(user):
    return user.role == 'tech'
@login_required
@user_passes_test(is_technician)
def tech_dashboard(request):
    # Redirigir directamente a los casos asignados
    return redirect('tech_cases')

@login_required
@user_passes_test(is_technician)
def tech_cases(request):
    # Filtrar tickets asignados al técnico y ordenarlos por fecha de creación (o actualización)
    tickets_list = Ticket.objects.filter(assigned_to=request.user).order_by('-created_at')  # Ordenar de más reciente a más antiguo

    # Paginación: mostrar 10 tickets por página
    paginator = Paginator(tickets_list, 10)

    page = request.GET.get('page')
    try:
        tickets_asignados = paginator.page(page)
    except PageNotAnInteger:
        tickets_asignados = paginator.page(1)
    except EmptyPage:
        tickets_asignados = paginator.page(paginator.num_pages)

    # Actualizar estado del ticket cuando se envía el formulario
    if request.method == 'POST':
        ticket_id = request.POST.get('ticket_id')
        estado = request.POST.get('estado')
        ticket = get_object_or_404(Ticket, id=ticket_id, assigned_to=request.user)
        ticket.status = estado
        ticket.save()
        messages.success(request, 'Estado del ticket actualizado correctamente.')
        return redirect(f'{request.path}?success=Estado del ticket actualizado correctamente.')

    context = {
        'tickets_asignados': tickets_asignados,
    }
    return render(request, 'dashboard/tech/tech_cases.html', context)


@login_required
@user_passes_test(is_technician)
def change_connection_status(request):
    tecnico = request.user.profile
    if request.method == 'POST':
        estado = request.POST.get('estado_conexion')
        tecnico.estado_conexion = estado
        tecnico.save()
        return JsonResponse({'status': 'success', 'estado_conexion': estado})
    return render(request, 'dashboard/tech/change_connection_status.html', {'tecnico': tecnico})

@login_required
@user_passes_test(lambda u: u.role == 'tech')
def tech_profile(request):
    tecnico = get_object_or_404(UserProfile, user=request.user)

    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=tecnico)
        if form.is_valid():
            form.save()
            messages.success(request, 'Perfil actualizado correctamente.')
            return redirect('tech_profile')
        else:
            messages.error(request, 'Error al actualizar el perfil. Por favor, revisa los campos.')
    else:
        form = UserProfileForm(instance=tecnico)

    # Convert messages to JSON
    messages_list = []
    for message in messages.get_messages(request):
        messages_list.append({
            'level': message.level_tag,
            'message': message.message
        })

    context = {
        'form': form,
        'tecnico': tecnico,
        'messages_json': mark_safe(json.dumps(messages_list))
    }

    return render(request, 'dashboard/tech/tech_profile.html', context)
@login_required
def update_ticket_status(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    if request.method == 'POST':
        form = TicketStatusForm(request.POST, instance=ticket)
        if form.is_valid():
            form.save()
            messages.success(request, 'Estado del ticket actualizado correctamente.')
            return redirect('ticket_detail', ticket_id=ticket.id)
        else:
            messages.error(request, 'Error al actualizar el estado del ticket.')
    else:
        form = TicketStatusForm(instance=ticket)
    
    return render(request, 'tickets/ticket_detail.html', {'form': form, 'ticket': ticket})


@login_required
@user_passes_test(is_technician)
def tech_reports(request):
    historial_list = Ticket.objects.filter(assigned_to=request.user)
    paginator = Paginator(historial_list, 10)  # Mostrar 10 tickets por página

    page = request.GET.get('page')
    try:
        historial_tickets = paginator.page(page)
    except PageNotAnInteger:
        historial_tickets = paginator.page(1)
    except EmptyPage:
        historial_tickets = paginator.page(paginator.num_pages)

    context = {
        'historial_tickets': historial_tickets,
    }
    return render(request, 'dashboard/tech/tech_reports.html', context)

def serve_media_file(request, path):
    """Vista para servir archivos de media directamente"""
    full_path = os.path.join(settings.MEDIA_ROOT, path)
    if os.path.exists(full_path):
        return FileResponse(open(full_path, 'rb'))
    raise Http404(f"Media file not found: {path}")

# Client dashboard
def client_dashboard(request):
    # Obtener categorías y productos de la app users
    categorias = Categoria.objects.filter(estadoCategoria=True)
    productos_por_categoria = {}
    
    for categoria in categorias:
        productos = Producto.objects.filter(
            idCategoria=categoria,
            estadoProducto=True
        )[:3]
        productos_por_categoria[categoria.idCategoria] = productos
    
    context = {
        'categorias': categorias,
        'productos_por_categoria': productos_por_categoria,
    }
    
    return render(request, 'dashboard/client/inicio.html', context)

#Listar clientes
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def read_client(request):
    """Vista para gestionar usuarios con búsqueda y paginación."""
    query = request.GET.get('q', '')
    current_user = request.user  # Obtener el usuario logueado
    users = User.objects.filter(role='client', is_active=True).exclude(id=current_user.id)
    if query:
        users = users.filter(username__icontains=query) | users.filter(email__icontains=query)
    users = users.order_by('id')
    paginator = Paginator(users, 7)  # 7 usuarios por página
    form = CustomUserCreationForm()
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {'page_obj': page_obj, 'query': query, 'form': form}
    return render(request, 'dashboard/admin/read_client.html', context)

# Agregar cliente
@user_passes_test(lambda u: u.role == 'admin')
def add_client(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = 'client'  # Asigna el rol si corresponde
            user.save()

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'message': 'Cliente agregado exitosamente.'})
            else:
                messages.success(request, 'Cliente agregado exitosamente.')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                errors = form.errors.as_json()
                return JsonResponse({'errors': errors}, status=400)
            else:
                messages.error(request, 'Hubo errores en el formulario. Corrígelos e intenta de nuevo.')
                return redirect('read_client')
    return redirect('read_client')

#Actualizar clientes
@user_passes_test(lambda u: u.role == 'admin')
def update_client(request, pk):
    user = get_object_or_404(User, pk=pk, role='client')

    # Petición GET vía AJAX para llenar el formulario
    if request.method == 'GET' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
            'telefono': user.telefono,
        })

    # Petición POST para guardar
    elif request.method == 'POST':
        form = CustomUserCreationForm(request.POST, instance=user)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = 'client'
            user.first_name = form.cleaned_data.get('first_name')
            user.last_name = form.cleaned_data.get('last_name')
            user.username = form.cleaned_data.get('username')
            user.email = form.cleaned_data.get('email')
            user.telefono = form.cleaned_data.get('telefono')
            user.save()
            return JsonResponse({'message': 'Cliente actualizado exitosamente.'})
        else:
            return JsonResponse({'errors': form.errors}, status=400)

    return HttpResponseBadRequest('Método no soportado o petición no válida')
# Listar técnicos tabla:
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def read_technician(request):
    query = request.GET.get('q', '')
    current_user = request.user
    users = User.objects.filter(role='tech', is_active=True).exclude(id=current_user.id).order_by('-date_joined')

    if query:
        users = users.filter(username__icontains=query) | users.filter(email__icontains=query)

    paginator = Paginator(users, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Obtener lista de países para el modal
    country_list = []
    try:
        response = requests.get('https://restcountries.com/v3.1/independent?status=true', timeout=10)
        response.raise_for_status()
        countries = response.json()
        country_list = [country['name']['common'] for country in countries if 'name' in country and 'common' in country['name']]
    except requests.RequestException as e:
        messages.error(request, f'Error al obtener los países: {e}')

    form = CreateTechForm()

    context = {
        'page_obj': page_obj,
        'query': query,
        'form': form,
        'countries': country_list,
    }
    return render(request, 'dashboard/admin/read_technician.html', context)
##Add tech:
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def add_technician(request):
    if request.method == 'POST':
        form = CreateTechForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = 'tech'
            user.is_staff = True
            user.save()

            try:
                latitude = float(request.POST.get('latitude', 0))
                longitude = float(request.POST.get('longitude', 0))
            except ValueError:
                latitude, longitude = 0, 0

            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = "technician"
            profile.full_name = form.cleaned_data.get('full_name')
            profile.phone_number = form.cleaned_data.get('phone_number')
            profile.address = form.cleaned_data.get('address')
            profile.certifications = form.cleaned_data.get('certifications')
            profile.schedule_start = form.cleaned_data.get('schedule_start')
            profile.schedule_end = form.cleaned_data.get('schedule_end')
            profile.specialty = form.cleaned_data.get('specialty')
            profile.country_name = request.POST.get('country')
            profile.department_name = request.POST.get('department')
            profile.province_name = request.POST.get('province')
            profile.district_name = request.POST.get('city')
            profile.latitude = latitude
            profile.longitude = longitude
            profile.photo = form.cleaned_data.get('photo')
            profile.save()

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'message': 'Técnico agregado exitosamente.'})
            else:
                messages.success(request, 'Técnico agregado exitosamente.')
                return redirect('read_technician')

        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                errors = form.errors.as_json()
                return JsonResponse({'errors': errors}, status=400)
            else:
                messages.error(request, 'Corrige los errores en el formulario.')
                return redirect('read_technician')
    return redirect('read_technician')
# Update tech
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def update_technician(request, pk):
    user = get_object_or_404(User, pk=pk, role='tech')
    profile, created = UserProfile.objects.get_or_create(user=user)

    if request.method == 'POST':
        form = CreateTechForm(request.POST, request.FILES, instance=user)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = 'tech'
            user.save()

            try:
                latitude = float(request.POST.get('latitude', 0))
                longitude = float(request.POST.get('longitude', 0))
            except ValueError:
                latitude, longitude = 0, 0

            profile.full_name = form.cleaned_data.get('full_name')
            profile.phone_number = form.cleaned_data.get('phone_number')
            profile.address = form.cleaned_data.get('address')
            profile.certifications = form.cleaned_data.get('certifications')
            profile.schedule_start = form.cleaned_data.get('schedule_start')
            profile.schedule_end = form.cleaned_data.get('schedule_end')
            profile.specialty = form.cleaned_data.get('specialty')
            profile.country_name = request.POST.get('country')
            profile.department_name = request.POST.get('department')
            profile.province_name = request.POST.get('province')
            profile.district_name = request.POST.get('city')
            profile.latitude = latitude
            profile.longitude = longitude
            if request.FILES.get('photo'):
                profile.photo = request.FILES['photo']
            profile.save()

            return JsonResponse({'message': 'Técnico actualizado exitosamente.'})
        else:
            return JsonResponse({'errors': form.errors}, status=400)

    # GET: enviar datos del técnico en JSON
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = {
            'username': user.username,
            'email': user.email,
            'specialty': profile.specialty,
            'full_name': profile.full_name,
            'phone_number': profile.phone_number,
            'address': profile.address,
            'certifications': profile.certifications,
            'schedule_start': profile.schedule_start.strftime('%H:%M') if profile.schedule_start else '',
            'schedule_end': profile.schedule_end.strftime('%H:%M') if profile.schedule_end else '',
            'country': profile.country_name,
            'department': profile.department_name,
            'province': profile.province_name,
            'city': profile.district_name,
            'latitud': profile.latitude,
            'longitude': profile.longitude,
            'photo': profile.photo.url if profile.photo else '',
        }
        return JsonResponse(data)

    return HttpResponseBadRequest("Solicitud inválida.")

# Conteo Técnicos Disponibles - Asignados
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def count_tech(request):
    try:
        count_TechDisponible = UserProfile.objects.filter(estado_conexion='online',user__is_active=True).count() #filtra cuyo usuario relacionado (user) esté activo (is_active=True)
        count_TechAsignado = UserProfile.objects.filter(estado_conexion='offline',user__is_active=True).count()
        #equivalente a :SELECT * FROM soporte_tecnico_v3.users_user ta inner join soporte_tecnico_v3.users_userprofile t on ta.id = t.user_id WHERE ta.is_active= 1;
        data = {
            'tech_Disp': count_TechDisponible,
            'tech_Asig': count_TechAsignado,
        }
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({'error': 'Ocurrió un error al contar los técnicos', 'detalle': str(e)}, status=500)

# Listar técnicos:
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def list_technician(request):
    try:
        list_tech = User.objects.filter(profile__latitude__isnull=False, profile__longitude__isnull=False, is_active=True).order_by('-date_joined').values('id', 'username', 'profile__latitude', 'profile__longitude') # Ordenar por fecha de creación (más reciente primero)
        return JsonResponse({'listaTech':list(list_tech)})
    except Exception as e:
        return JsonResponse({'error': 'Ocurrió un error al listar los técnicos', 'detalle': str(e)}, status=500)
    
# Estado de tickets
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def status_tickets(request,year,idTech=None):
    try:
        count_tickets_client = Ticket.objects.filter(updated_at__year=year, status__in=['open', 'in_progress']).count()
        count_clientes = User.objects.filter(role='client', is_active=True, last_login__year=year).count()
        meses_es = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }
      # Con id
        if idTech:
            count_pendiente = Ticket.objects.filter(assigned_to_id=idTech, status='open', updated_at__year=year).count() 
            count_progreso = Ticket.objects.filter(assigned_to_id=idTech, status='in_progress', updated_at__year=year).count()
            count_resuelto = Ticket.objects.filter(assigned_to_id=idTech, status='resolved', updated_at__year=year).count()
            servicios_completados = (Ticket.objects.filter(assigned_to_id=idTech, status='resolved', updated_at__year=year)
                                .annotate(mes=ExtractMonth('updated_at'))
                                .values('mes')
                                .annotate(total=Count('status'))
                                .order_by('mes'))
            data_service = [
                {'mes': meses_es[item['mes']], 'total': item['total']}
                for item in servicios_completados
            ]
        #Sin id
        else:
            count_pendiente = Ticket.objects.filter(status='open', updated_at__year=year).count()
            count_progreso = Ticket.objects.filter(status='in_progress', updated_at__year=year).count()
            count_resuelto = Ticket.objects.filter(status='resolved', updated_at__year=year).count()
            servicios_completados = (Ticket.objects.filter(status='resolved', updated_at__year=year)
                                .annotate(mes=ExtractMonth('updated_at'))
                                .values('mes')
                                .annotate(total=Count('status'))
                                .order_by('mes'))
            data_service = [
                {'mes': meses_es[item['mes']], 'total': item['total']}
                for item in servicios_completados
            ]
        status_data = {
            'count_pendiente': count_pendiente,
            'count_progreso': count_progreso,
            'count_resuelto': count_resuelto,
            'count_ticketsTotal': count_tickets_client,
            'count_clientes': count_clientes,
            'service_complete': data_service,
        }
        return JsonResponse(status_data)

    except Exception as e:
        return JsonResponse({
            'error': 'Ocurrió un error al obtener el estado de los tickets',
            'detalle': str(e)
        }, status=500)
# Add admin 
@login_required
@user_passes_test(is_admin)
def add_admin(request):
    if not request.user.can_add_admin:
        return JsonResponse({'error': 'No tienes permiso para agregar administradores.'}, status=403)

    if request.method == 'POST':
        form = CreateAdminForm(request.POST)
        if form.is_valid():
            admin = form.save(commit=False)
            admin.role = 'admin'
            admin.is_staff = True
            admin.is_superuser = True
            admin.can_add_admin = form.cleaned_data.get('can_add_admin', False)
            admin.save()

            try:
                latitude = float(request.POST.get('latitude', 0))
                longitude = float(request.POST.get('longitude', 0))
            except ValueError:
                latitude, longitude = 0, 0  

 
            profile, created = UserProfile.objects.get_or_create(user=admin)
            profile.role = "admin"
            profile.full_name = request.POST.get('full_name', '')
            profile.phone_number = request.POST.get('phone_number', '')
            profile.address = request.POST.get('address', '')
            profile.country_name = request.POST.get('country', '')
            profile.department_name = request.POST.get('department', '')
            profile.province_name = request.POST.get('province', '')
            profile.district_name = request.POST.get('district', '')
            profile.latitude = latitude
            profile.longitude = longitude
            profile.save()

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':  
                return JsonResponse({'message': f"Administrador '{admin.username}' agregado exitosamente."})
            else:
                messages.success(request, f"Administrador '{admin.username}' agregado exitosamente.")
                return redirect('admin_dashboard')

        else:
            errors = {field: error.get_json_data() for field, error in form.errors.items()}
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':  
                return JsonResponse({'error': 'Formulario inválido', 'errors': errors}, status=400)
            else:
                messages.error(request, 'Por favor corrige los errores en el formulario.')

    else:
        form = CreateAdminForm()

    countries = []
    try:
        response = requests.get(f"{GEONAMES_BASE_URL}/countryInfoJSON", params={
            'username': GEONAMES_USERNAME,
            'type': 'json',
        }, timeout=10)
        response.raise_for_status()
        data = response.json()
        countries = [country['countryName'] for country in data.get('geonames', [])]
    except requests.RequestException as e:
        messages.error(request, f"Error al cargar la lista de países: {e}")

    return render(request, 'dashboard/admin/add_admin.html', {'form': form, 'countries': countries})


# Cargar países
def load_countries(request):
    try:
        response = requests.get(f"{GEONAMES_BASE_URL}/countryInfoJSON", params={
            'username': GEONAMES_USERNAME,
            'type': 'json',
        }, timeout=10)
        response.raise_for_status()
        data = response.json()
        # Devuelve una lista con el nombre del país y su código ISO
        countries = [{'name': country['countryName'], 'code': country['countryCode']} for country in data.get('geonames', [])]
        return JsonResponse(countries, safe=False)
    except requests.RequestException as e:
        print(f"Error al cargar países: {e}")
        return JsonResponse([], safe=False)
    
# Cargar departamentos (nivel administrativo 1)
def load_departments(request):
    country = request.GET.get('country')
    try:
        # Convertimos el nombre del país al código ISO
        country_code = country.upper() if len(country) == 2 else country  # Convertir a ISO si no es ya un código.
        
        response = requests.get(
            f'{GEONAMES_BASE_URL}/searchJSON',
            params={
                'country': country_code,
                'featureCode': 'ADM1',  # Nivel administrativo 1 (departamentos)
                'username': GEONAMES_USERNAME,
                'maxRows': 50,
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        # Agregamos un log de depuración
        print(f"Response from GeoNames for departments: {data}")

        # Formateamos los datos para el frontend
        departments = [{'name': item.get('name', ''), 'code': item.get('adminCode1', '')} for item in data.get('geonames', [])]
        
        return JsonResponse(departments, safe=False)
    except requests.RequestException as e:
        print(f"Error al obtener departamentos: {e}")
        return JsonResponse([], safe=False)

# Cargar provincias (nivel administrativo 2)
def load_provinces(request):
    country = request.GET.get('country')  # Código ISO del país
    department = request.GET.get('department')  # adminCode1
    try:
        if not country or not department:
            return JsonResponse([], safe=False)  # Validar parámetros

        response = requests.get(
            f'{GEONAMES_BASE_URL}/searchJSON',
            params={
                'country': country.upper(),
                'adminCode1': department,
                'featureCode': 'ADM2',  # Provincias
                'username': GEONAMES_USERNAME,
                'maxRows': 50,
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        print(f"Response from GeoNames for provinces: {response.text}")

        provinces = [{'name': item.get('name', ''), 'code': item.get('adminCode2', '')} for item in data.get('geonames', [])]
        return JsonResponse(provinces, safe=False)
    except requests.RequestException as e:
        print(f"Error al obtener provincias: {e}")
        return JsonResponse([], safe=False)

# Cargar distritos
def load_districts(request):
    country = request.GET.get('country')
    province = request.GET.get('province')  # adminCode2

    try:
        # Limpia el nombre de la provincia eliminando sufijos no necesarios
        cleaned_province = province.replace(" Province", "").strip()

        # Realizar la consulta a Nominatim
        response = requests.get(
            f'https://nominatim.openstreetmap.org/search',
            params={
                'country': country,
                'state': cleaned_province,  # Nombre limpio de la provincia
                'format': 'json',
                'addressdetails': 1,
                'polygon_geojson': 0,
                'extratags': 1,
            },
            headers={
                'User-Agent': 'YourAppName/1.0 (atuncarfloresg@gmail.com)'  # Reemplaza con datos reales
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        # Log para depuración
        print(f"Response from Nominatim for districts: {data}")

        # Formatear los distritos devueltos
        districts = [{'name': item.get('display_name', '')} for item in data]
        return JsonResponse(districts, safe=False)
    except requests.RequestException as e:
        print(f"Error al obtener distritos: {e}")
        return JsonResponse([], safe=False)

def fetch_online_users(request):
    """Calcula los usuarios activos en los últimos 5 minutos."""
    threshold_time = now() - timedelta(minutes=5)
    online_users_count = User.objects.filter(last_login__gte=threshold_time).count()
    return JsonResponse({"count": online_users_count})


@login_required
@user_passes_test(is_admin)
def toggle_user_status(request, user_id):
    """Activar o desactivar un usuario."""
    user = get_object_or_404(User, id=user_id)
    user.is_active = not user.is_active  # Alterna el estado activo
    user.save()
    return JsonResponse({'status': 'success', 'message': f'Usuario {"activado" if user.is_active else "desactivado"} exitosamente.'})

@login_required
@user_passes_test(is_admin)
def delete_user(request, user_id):
    """Eliminar un usuario (solo permite POST y devuelve JSON correctamente)."""
    if request.method != "POST":
        return JsonResponse({'status': 'error', 'message': 'Método no permitido.'}, status=405)

    try:
        user = get_object_or_404(User, id=user_id)
        user.delete()
        return JsonResponse({'status': 'success', 'message': 'Usuario eliminado exitosamente.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error al eliminar usuario: {str(e)}'}, status=500)
    
@login_required
@user_passes_test(is_admin)
def inactive_users(request):
    """Vista para mostrar usuarios inactivos (sin login en los últimos 30 días)."""
    threshold_date = now() - timedelta(days=30)
    inactive_users = User.objects.filter(last_login__lt=threshold_date, is_active=True)

    context = {'inactive_users': inactive_users}
    return render(request, 'dashboard/admin/inactive_users.html', context)

@login_required
@user_passes_test(is_admin)
def delete_inactive_user(request, user_id):
    """Eliminar un usuario inactivo."""
    user = get_object_or_404(User, id=user_id, is_active=True)
    user.delete()
    return JsonResponse({'status': 'success', 'message': 'Usuario eliminado exitosamente.'})
    
@login_required
@user_passes_test(is_admin)
def deactivate_user(request, user_id):
    """Desactivar usuario."""
    user = get_object_or_404(User, id=user_id)
    user.is_active = False
    user.save()
    return JsonResponse({'status': 'success', 'message': 'Usuario desactivado exitosamente.'})

# Logout
# @login_required
# def user_logout(request):
#     logout(request)
#     return redirect('users:inicio')

