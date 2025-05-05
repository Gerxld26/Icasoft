from django.http import JsonResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import authenticate, login 
from django.views.decorators.http import require_GET, require_POST
from django.contrib import messages
import heapq
import re
from django.db.models import Count, F, Func, Value
from django.db.models.functions import TruncMonth
from users.models import User, UserProfile
from tickets.models import Ticket
from .forms import CreateTechForm, CreateAdminForm
import requests
from django.utils.timezone import now
from datetime import timedelta
from django.core.paginator import Paginator
from django.shortcuts import render, get_object_or_404
import logging
import os
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
import os
import random
import shutil
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, user_passes_test
from openai import OpenAI
import psutil
import speedtest 
import platform
import logging
import time
import tempfile
import cpuinfo
import subprocess  
from .models import Diagnosis
import subprocess
import json
import GPUtil 
from users.models import UserProfile
from .forms import UserProfileForm
from .forms import TicketStatusForm
from django.core.exceptions import PermissionDenied
from virustotal_python import Virustotal
from django.utils.dateparse import parse_date
from .models import LearningVideo
from .forms import LearningVideoForm
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.utils.safestring import mark_safe
import traceback
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET
import tempfile
import time
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .utils import perform_speed_test
from dotenv import load_dotenv

from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required, user_passes_test
import psutil
import subprocess
import platform
import time
import shutil
import threading
from datetime import datetime, timedelta


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
            'solution': 'Usa el módulo de Análisis Completo del Sistema para diagnosticar problemas de rendimiento.'
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
            'solution': 'Utiliza el módulo de Mantenimiento para optimizar tu sistema.'
        },
        'red': {
            'keywords': ['wifi', 'internet', 'conexion', 'red'],
            'solution': 'Usa la herramienta de Comprobación de Red para diagnosticar problemas de conectividad.'
        }
    }

    @classmethod
    def get_tool_recommendation(cls, user_input):
        user_input = user_input.lower()
        
        for tool, details in cls.TOOLS.items():
            if any(keyword in user_input for keyword in details['keywords']):
                return details['solution']
        
        return 'Explora las herramientas de ICASOFT en el menú principal para encontrar la solución.'

class ConversationManager:
    def __init__(self):
        self.conversation_history = [
            {
                "role": "system", 
                "content": """
                Eres el Asistente Virtual de ICASOFT Ingeniería 21. 
                Características:
                - Respuestas breves y precisas
                - Siempre recomienda herramientas específicas de ICASOFT
                - Usa un tono profesional y amigable
                - Enfócate en soluciones prácticas
                - Si no hay solución específica, dirige al usuario a Asistencia Técnica
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

            full_response = f"{assistant_response} {tool_recommendation}"
            
            self.add_message("assistant", full_response)

            return full_response

        except Exception as e:
            print(f"Error en generación de respuesta: {str(e)}")
            return "Te recomendamos contactar a Asistencia Técnica de ICASOFT para resolver tu problema."

conversation_manager = ConversationManager()
    
#CHAT IA
@csrf_exempt
@require_http_methods(["POST"])
def chatIA(request):
    try:
        data = json.loads(request.body)
        user_input = data.get('message', '').strip()

        if not user_input:
            return JsonResponse({
                'response': 'Por favor, escribe tu consulta.'
            })

        response = conversation_manager.generate_response(user_input)
        
        return JsonResponse({
            'response': response
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'response': 'Hubo un problema al procesar tu solicitud.'
        }, status=400)
    
    except Exception as e:
        print(f"Error en chatIA: {str(e)}")
        return JsonResponse({
            'response': 'Te recomendamos contactar a Asistencia Técnica de ICASOFT.'
        }, status=500)
    
    
# Vista para el Chat del Cliente
@login_required
@user_passes_test(is_client)
def client_chat(request):
    if request.method == "GET":
        return render(request, "dashboard/client/client_chat.html")


@login_required
@user_passes_test(lambda user: user.role == 'client')
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
            'scan_logs': []  # Nuevo campo para logs detallados
        }

        scan_paths = [
            os.path.expanduser('~'),
            os.path.join(os.path.expanduser('~'), 'Downloads'),
            os.path.join(os.path.expanduser('~'), 'Documents'),
        ]

        def get_files_to_scan(directory, max_files=10):
            files_to_scan = []
            try:
                for root, _, files in os.walk(directory):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if os.path.getsize(file_path) < 32 * 1024 * 1024:
                            files_to_scan.append(file_path)
                            if len(files_to_scan) >= max_files:
                                break
                    if len(files_to_scan) >= max_files:
                        break
            except Exception as e:
                logger.warning(f"Error escaneando directorio {directory}: {str(e)}")
            return files_to_scan

        for path in scan_paths:
            if os.path.exists(path):
                files_to_scan = get_files_to_scan(path)
                
                for file_path in files_to_scan:
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
                                    log_entry['details'] = f"Amenazas detectadas: {analysis_results['positives']} de {analysis_results['total']} motores"
                                    
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

# Vista adicional para obtener detalles del sistema
@login_required
@require_http_methods(["GET"])
def system_security_info(request):
    """
    Obtener información de seguridad básica del sistema
    """
    try:
        # Información de procesos
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'status']):
            try:
                processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'status': proc.info['status']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass

        # Información de red
        network_connections = []
        for conn in psutil.net_connections():
            try:
                network_connections.append({
                    'fd': conn.fd,
                    'family': str(conn.family),
                    'type': str(conn.type),
                    'laddr': str(conn.laddr),
                    'raddr': str(conn.raddr),
                    'status': conn.status
                })
            except Exception:
                pass

        return JsonResponse({
            'status': 'success',
            'system_info': {
                'total_processes': len(processes),
                'network_connections': len(network_connections)
            },
            'processes': processes[:20],  
            'network_connections': network_connections[:20]  
        })

    except Exception as e:
        logger.error(f"Error obteniendo información del sistema: {str(e)}")
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)

@login_required
@user_passes_test(is_client)
def diagnostics_dashboard(request):
    """Renderiza el dashboard principal de diagnósticos"""
    # Obtener el diagnóstico más reciente
    latest_diagnosis = Diagnosis.objects.filter(user=request.user).order_by('-timestamp').first()
    
    # Obtener escenarios de diagnóstico disponibles
    scenarios = DiagnosticScenario.objects.filter(is_active=True)
    
    # Obtener historial de diagnósticos (últimos 5)
    diagnosis_history = Diagnosis.objects.filter(user=request.user).order_by('-timestamp')[:5]
    
    # Obtener historial de ejecuciones de escenarios (últimos 5)
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
        
        # Datos del sistema operativo
        system_info = {
            'system': platform.system(),
            'version': platform.version(),
            'release': platform.release(),
            'machine': platform.machine(),
            'processor': platform.processor()
        }
        
        # Temperatura de CPU (si está disponible)
        cpu_temp = "N/A"
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    if entries:
                        cpu_temp = f"{entries[0].current:.1f}°C"
                        break
        
        # Obtener información de GPU
        gpu_info = get_gpu_info()
        
        # Construir respuesta completa
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
            # Intentar obtener información de GPU en Windows
            cmd = "powershell \"Get-WmiObject Win32_VideoController | Select Name, AdapterRAM, DriverVersion | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
            
            if result.returncode == 0 and result.stdout:
                gpu_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(gpu_data, list):
                    gpu_data = [gpu_data]
                
                gpus = []
                for gpu in gpu_data:
                    # Convertir RAM a formato legible si existe
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
            # Intentar obtener información de GPU en Linux
            try:
                # Comprobar si nvidia-smi está disponible (tarjetas NVIDIA)
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
            
            # Si no es NVIDIA, intentar con lspci
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
        
        # Si no se pudo obtener información específica
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
    """Obtiene los procesos que más recursos consumen"""
    try:
        processes = []
        for proc in sorted(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']), 
                        key=lambda x: x.info['cpu_percent'] or 0, 
                        reverse=True)[:limit]:
            try:
                processes.append({
                    'pid': proc.info['pid'],
                    'name': proc.info['name'],
                    'cpu_percent': f"{proc.info['cpu_percent'] or 0:.1f}%",
                    'memory_percent': f"{proc.info['memory_percent'] or 0:.1f}%"
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        return processes
    except Exception as e:
        return [{"name": f"Error al obtener procesos: {str(e)}"}]

def create_diagnosis_entry(user, system_data, scan_type):
    """Crea un registro de diagnóstico en la base de datos"""
    try:
        # Extraer datos relevantes
        cpu_usage = system_data.get('cpu_usage', 'N/A')
        cpu_temp = system_data.get('cpu_temp', 'N/A')
        
        ram_data = system_data.get('ram_usage', {})
        ram_total = ram_data.get('total', 'N/A')
        ram_used = ram_data.get('used', 'N/A')
        ram_percent = ram_data.get('percent', 'N/A')
        
        # Para simplificar, usamos la primera partición para los datos de disco
        disk_data = system_data.get('disk_usage', {}).get('partitions', [{}])[0]
        disk_total = disk_data.get('total', 'N/A')
        disk_used = disk_data.get('used', 'N/A')
        disk_free = disk_data.get('free', 'N/A')
        disk_percent = disk_data.get('percent', 'N/A')
        
        network_data = system_data.get('network', {})
        network_sent = network_data.get('bytes_sent', 'N/A')
        network_recv = network_data.get('bytes_recv', 'N/A')
        
        # Datos del sistema
        sys_info = system_data.get('system_info', {})
        os_name = f"{sys_info.get('system', '')} {sys_info.get('release', '')}"
        os_version = sys_info.get('version', 'N/A')
        
        # GPU (tomamos la primera si hay varias)
        gpu_data = system_data.get('gpu_info', [{}])[0]
        gpu_model = gpu_data.get('name', 'N/A')
        gpu_memory = gpu_data.get('memory', 'N/A')
        gpu_driver = gpu_data.get('driver', 'N/A')
        
        # Determinar estado general basado en umbrales
        overall_status = "Normal"
        issues_count = 0
        warnings_count = 0
        
        # Verificar CPU
        cpu_value = float(cpu_usage.replace('%', '')) if '%' in cpu_usage else 0
        if cpu_value > 90:
            overall_status = "Crítico"
            issues_count += 1
        elif cpu_value > 75:
            if overall_status == "Normal":
                overall_status = "Advertencia"
            warnings_count += 1
        
        # Verificar RAM
        ram_value = float(ram_percent.replace('%', '')) if '%' in ram_percent else 0
        if ram_value > 90:
            overall_status = "Crítico"
            issues_count += 1
        elif ram_value > 80:
            if overall_status == "Normal":
                overall_status = "Advertencia"
            warnings_count += 1
        
        # Verificar Disco
        disk_value = float(disk_percent.replace('%', '')) if '%' in disk_percent else 0
        if disk_value > 95:
            overall_status = "Crítico"
            issues_count += 1
        elif disk_value > 85:
            if overall_status == "Normal":
                overall_status = "Advertencia"
            warnings_count += 1
        
        # Crear entrada de diagnóstico
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
        
        # Iniciar análisis detallado en segundo plano si es un escaneo completo
        if scan_type in ["FullScan", "CustomScan"]:
            threading.Thread(target=run_detailed_analysis, args=(user, diagnosis, system_data)).start()
        
        return diagnosis
    except Exception as e:
        raise Exception(f"Error al crear diagnóstico: {str(e)}")

def run_detailed_analysis(user, diagnosis, system_data=None):
    """Ejecuta un análisis detallado en segundo plano"""
    try:
        # Crear reporte de diagnóstico
        report = DiagnosticReport.objects.create(
            user=user,
            diagnosis=diagnosis,
            status="En progreso"
        )
        
        # Si no tenemos datos del sistema, obtenerlos
        if not system_data:
            system_data = get_system_data()
        
        # Componentes a analizar
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
        
        # Analizar cada componente
        for i, component in enumerate(components):
            # Actualizar progreso
            progress = int((i / total_components) * 100)
            report.progress = progress
            report.current_component = component["name"]
            report.save()
            
            # Analizar componente específico
            try:
                result = component["function"](system_data)
                
                # Guardar resultado del componente
                SystemComponent.objects.create(
                    report=report,
                    type=component["type"],
                    name=component["name"],
                    status=result.get("status", "UNKNOWN"),
                    details=result,
                    recommendations=result.get("recommendations", "")
                )
                
                # Si hay problemas, registrarlos
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
                # Registrar error en el análisis de este componente
                SystemComponent.objects.create(
                    report=report,
                    type=component["type"],
                    name=component["name"],
                    status="ERROR",
                    details={"error": str(e)},
                    recommendations="Error al analizar este componente. Por favor, inténtelo de nuevo."
                )
        
        # Finalizar reporte
        report.progress = 100
        report.status = "Completado"
        report.completion_time = datetime.now()
        report.save()
        
        # Actualizar diagnóstico con contador de problemas
        issues_count = DiagnosticIssue.objects.filter(diagnosis=diagnosis).count()
        diagnosis.issues_count = issues_count
        diagnosis.save()
        
    except Exception as e:
        if report:
            report.status = "Error"
            report.error_message = str(e)
            report.save()

def analyze_cpu(system_data):
    """Analiza el procesador del sistema"""
    try:
        cpu_usage = system_data.get('cpu_usage', 'N/A')
        cpu_temp = system_data.get('cpu_temp', 'N/A')
        cpu_freq = system_data.get('cpu_freq', 'N/A')
        cpu_cores = system_data.get('cpu_cores', 0)
        
        # Convertir valores a números para comparación
        cpu_usage_value = float(cpu_usage.replace('%', '')) if '%' in cpu_usage else 0
        cpu_temp_value = float(cpu_temp.replace('°C', '')) if '°C' in cpu_temp else 0
        
        # Determinar estado
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
        
        # Verificar temperatura si está disponible
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
        
        # Generar recomendaciones generales
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
        
        # Convertir valores a números para comparación
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
        
        # Verificar memoria virtual (swap)
        if swap_total != "N/A" and swap_total != "0.00 B" and swap_percent_value > 75:
            if status != "CRITICAL":
                status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "MEDIUM",
                "description": f"Uso elevado de memoria virtual ({swap_percent})",
                "recommendation": "El sistema está utilizando mucha memoria virtual, lo que puede reducir el rendimiento. Considere cerrar aplicaciones o ampliar la RAM física."
            })
        
        # Obtener procesos que más memoria consumen
        top_processes = system_data.get('top_processes', [])
        memory_intensive_processes = []
        for process in top_processes:
            memory_percent = process.get('memory_percent', '0%')
            memory_value = float(memory_percent.replace('%', '')) if '%' in memory_percent else 0
            if memory_value > 10:  # Procesos que usan más del 10% de RAM
                memory_intensive_processes.append(process)
        
        # Generar recomendaciones
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
        
        # Determinar estado
        status = "NORMAL"
        issues = []
        critical_partitions = []
        warning_partitions = []
        
        for partition in partitions:
            device = partition.get('device', 'Desconocido')
            mountpoint = partition.get('mountpoint', 'Desconocido')
            percent = partition.get('percent', '0%')
            
            # Convertir a valor numérico
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
        
        # Analizar fragmentación (solo en Windows)
        fragmentation_data = None
        if platform.system() == "Windows":
            try:
                # Solo analizamos el disco C: para no sobrecargar el análisis
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
        
        # Verificar salud del disco en Windows
        disk_health_data = None
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject -Namespace root\\wmi -Class MSStorageDriver_FailurePredictStatus | Select InstanceName, PredictFailure, Reason | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and result.stdout:
                    health_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
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
        
        # Generar recomendaciones
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
        
        # Determinar estado
        status = "NORMAL"
        issues = []
        
        # Comprobar conectividad a Internet
        internet_status = check_internet_connectivity()
        if not internet_status["connected"]:
            status = "CRITICAL"
            issues.append({
                "type": "NETWORK",
                "severity": "HIGH",
                "description": "Sin conexión a Internet",
                "recommendation": "Verifique su conexión de red, router o contacte con su proveedor de servicios de Internet."
            })
        
        # Comprobar latencia
        if internet_status["connected"] and internet_status["ping"] > 150:
            if status != "CRITICAL":
                status = "WARNING"
            issues.append({
                "type": "NETWORK",
                "severity": "MEDIUM",
                "description": f"Latencia de red alta ({internet_status['ping']} ms)",
                "recommendation": "La velocidad de respuesta de su conexión es lenta. Verifique si hay otras aplicaciones usando el ancho de banda o contacte con su proveedor de Internet."
            })
        
                        # Verificar estado del adaptador Wi-Fi en Windows
        wifi_status = None
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-NetAdapter | Where-Object {$_.InterfaceDescription -match 'wireless|wi-fi|wifi|wlan|802.11'} | Select Name, Status, LinkSpeed | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and result.stdout:
                    wifi_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
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
        
        # Generar recomendaciones
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
        
        # Determinar estado
        status = "NORMAL"
        issues = []
        
        # Verificar controladores de GPU en Windows
        if platform.system() == "Windows":
            for gpu in gpu_info:
                gpu_name = gpu.get('name', 'Desconocido')
                gpu_driver = gpu.get('driver', 'Desconocido')
                
                # Verificar si es un controlador genérico o básico
                if "básico" in gpu_name.lower() or "basic" in gpu_name.lower() or "Microsoft" in gpu_driver:
                    status = "WARNING"
                    issues.append({
                        "type": "DRIVER",
                        "severity": "MEDIUM",
                        "description": f"Controlador genérico o básico para {gpu_name}",
                        "recommendation": "Instale el controlador específico del fabricante para mejorar el rendimiento y funcionalidad de su tarjeta gráfica."
                    })
                
                # Intentar obtener información de actualizaciones disponibles
                try:
                    # Esto es una simulación, en un entorno real se consultaría un servicio
                    if gpu_driver != "Desconocido" and ("NVIDIA" in gpu_name or "AMD" in gpu_name or "Intel" in gpu_name):
                        # Simulamos que hay una versión más reciente
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
        
        # Generar recomendaciones
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
        
        # Determinar estado
        status = "NORMAL"
        issues = []
        
        battery_percent = battery_data.get('percent', '0%')
        power_plugged = battery_data.get('power_plugged', False)
        secsleft = battery_data.get('secsleft')
        
        # Convertir a valor numérico
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
        
        # Comprobar estado de salud de la batería en Windows
        battery_health = None
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject Win32_Battery | Select DesignCapacity, FullChargeCapacity | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
                
                if result.returncode == 0 and result.stdout:
                    health_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
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
        
        # Generar recomendaciones
        recommendations = "La batería está funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
        
        # Calcular tiempo restante en formato legible
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

def analyze_drivers(system_data):
    """Analiza los controladores del sistema"""
    try:
        # Obtener información de controladores
        drivers_info = []
        outdated_drivers = []
        problematic_drivers = []
        
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject Win32_PnPSignedDriver | Select DeviceName, DriverVersion, DriverDate | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if result.returncode == 0 and result.stdout:
                    drivers_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
                    if not isinstance(drivers_data, list):
                        drivers_data = [drivers_data]
                    
                    # Limitar a 20 controladores para no sobrecargar
                    for driver in drivers_data[:20]:
                        device_name = driver.get('DeviceName', 'Desconocido')
                        driver_version = driver.get('DriverVersion', 'Desconocido')
                        driver_date_str = driver.get('DriverDate', '')
                        
                        # Convertir fecha si está disponible
                        driver_date = "Desconocida"
                        if driver_date_str:
                            try:
                                # Formato típico: AAAAMMDDHHmmss.ffffff+ZZZ
                                date_parts = driver_date_str.split('.')[0]
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
                            "status": "Normal"
                        }
                        
                        # Verificar si el controlador podría estar desactualizado
                        try:
                            if driver_date != "Desconocida":
                                date_obj = datetime.strptime(driver_date, "%Y-%m-%d")
                                years_old = (datetime.now() - date_obj).days / 365
                                
                                if years_old > 3:
                                    driver_info["status"] = "Desactualizado"
                                    outdated_drivers.append(driver_info)
                        except:
                            pass
                        
                        drivers_info.append(driver_info)
            except:
                pass
        
        # Verificar problemas de controladores
        try:
            if platform.system() == "Windows":
                cmd = "powershell \"Get-WmiObject Win32_PnPEntity | Where-Object {$_.ConfigManagerErrorCode -ne 0} | Select Caption, ConfigManagerErrorCode | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
                
                if result.returncode == 0 and result.stdout and result.stdout.strip() != "":
                    problem_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
                    if not isinstance(problem_data, list):
                        problem_data = [problem_data]
                    
                    for device in problem_data:
                        device_name = device.get('Caption', 'Dispositivo desconocido')
                        error_code = device.get('ConfigManagerErrorCode', 0)
                        
                        problem_info = {
                            "name": device_name,
                            "error_code": error_code,
                            "status": "Error"
                        }
                        
                        problematic_drivers.append(problem_info)
        except:
            pass
        
        # Determinar estado general
        status = "NORMAL"
        issues = []
        
        if problematic_drivers:
            status = "CRITICAL"
            for driver in problematic_drivers:
                issues.append({
                    "type": "DRIVER",
                    "severity": "HIGH",
                    "description": f"Problema en el controlador de {driver['name']}",
                    "recommendation": "Reinstale o actualice el controlador del dispositivo para resolver el problema."
                })
        
        if outdated_drivers:
            if status != "CRITICAL":
                status = "WARNING"
            
            for driver in outdated_drivers[:3]:
                issues.append({
                    "type": "DRIVER",
                    "severity": "MEDIUM",
                    "description": f"Controlador desactualizado: {driver['name']} ({driver['date']})",
                    "recommendation": f"Actualice el controlador de {driver['name']} para mejorar la compatibilidad y rendimiento."
                })
        
        recommendations = "Todos los controladores están funcionando correctamente."
        if issues:
            recommendations = "\n".join([issue["recommendation"] for issue in issues])
            if len(outdated_drivers) > 3:
                recommendations += f"\n\nSe encontraron {len(outdated_drivers)} controladores desactualizados en total. Considere actualizar todos los controladores para un rendimiento óptimo."
        
        return {
            "status": status,
            "drivers": drivers_info,
            "problematic_drivers": problematic_drivers,
            "outdated_drivers": outdated_drivers,
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
                "description": f"Error al analizar controladores: {str(e)}",
                "recommendation": "Inténtelo de nuevo o contacte con soporte técnico."
            }],
            "recommendations": "No se pudo completar el análisis de controladores."
        }

def analyze_software(system_data):
    """Analiza el software instalado en el sistema"""
    try:
        # Obtener información de programas instalados
        installed_software = []
        large_programs = []
        recently_installed = []
        
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-WmiObject Win32_Product | Select Name, Vendor, Version, InstallDate | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                
                if result.returncode == 0 and result.stdout:
                    software_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
                    if not isinstance(software_data, list):
                        software_data = [software_data]
                    
                    # Limitar a 50 programas para no sobrecargar
                    for program in software_data[:50]:
                        name = program.get('Name', 'Desconocido')
                        vendor = program.get('Vendor', 'Desconocido')
                        version = program.get('Version', 'Desconocido')
                        install_date_str = program.get('InstallDate', '')
                        
                        # Convertir fecha si está disponible
                        install_date = "Desconocida"
                        if install_date_str:
                            try:
                                # Formato típico: AAAAMMDD
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
                        
                        # Verificar si es reciente (últimos 7 días)
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
        
        # Obtener programas que ocupan más espacio
        if platform.system() == "Windows":
            try:
                # Usando Get-AppxPackage para aplicaciones de Microsoft Store
                cmd = "powershell \"Get-AppxPackage | Sort-Object -Property Size -Descending | Select-Object -First 10 | Select Name, Version, Size | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
                
                if result.returncode == 0 and result.stdout:
                    appx_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
                    if not isinstance(appx_data, list):
                        appx_data = [appx_data]
                    
                    for app in appx_data:
                        name = app.get('Name', 'Desconocido')
                        size = app.get('Size', 0)
                        
                        if size > 1000000000:  # Más de 1 GB
                            large_programs.append({
                                "name": name,
                                "size": get_size_str(size),
                                "type": "Microsoft Store"
                            })
            except:
                pass
        
        # Determinar estado
        status = "NORMAL"
        issues = []
        
        # Verificar programas potencialmente innecesarios de inicio automático
        startup_programs = []
        if platform.system() == "Windows":
            try:
                cmd = "powershell \"Get-CimInstance Win32_StartupCommand | Select Name, Command, Location | ConvertTo-Json\""
                result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
                
                if result.returncode == 0 and result.stdout:
                    startup_data = json.loads(result.stdout)
                    
                    # Convertir a lista si es un solo objeto
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
        
        # Verificar si hay demasiados programas instalados
        if len(installed_software) > 100:
            if status != "WARNING":
                status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "LOW",
                "description": f"Gran cantidad de programas instalados ({len(installed_software)})",
                "recommendation": "Considere desinstalar aplicaciones que ya no utiliza para liberar espacio y recursos."
            })
        
        # Verificar aplicaciones que consumen mucho espacio
        if large_programs:
            if status != "WARNING":
                status = "WARNING"
            issues.append({
                "type": "PERFORMANCE",
                "severity": "LOW",
                "description": f"Aplicaciones que ocupan mucho espacio ({len(large_programs)})",
                "recommendation": "Considere desinstalar o trasladar a otro disco las aplicaciones de gran tamaño que no utilice frecuentemente."
            })
        
        # Generar recomendaciones
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
        # Determinar estado
        status = "NORMAL"
        issues = []
        
        # Verificar estado del firewall
        firewall_status = check_firewall_status()
        if not firewall_status["enabled"]:
            status = "CRITICAL"
            issues.append({
                "type": "SECURITY",
                "severity": "HIGH",
                "description": "Firewall desactivado",
                "recommendation": "Active el firewall de Windows para proteger su equipo contra amenazas de red."
            })
        
        # Verificar estado del antivirus
        antivirus_status = check_antivirus_status()
        if not antivirus_status["enabled"]:
            status = "CRITICAL"
            issues.append({
                "type": "SECURITY",
                "severity": "HIGH",
                "description": "Protección antivirus desactivada",
                "recommendation": "Active la protección antivirus para proteger su equipo contra malware."
            })
        
        # Verificar actualizaciones pendientes
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
        
        # Verificar protecciones específicas en Windows
        if platform.system() == "Windows":
            # Comprobar estado de UAC
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
        
        # Generar recomendaciones
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
                
                # Convertir a lista si es un solo objeto
                if not isinstance(firewall_data, list):
                    firewall_data = [firewall_data]
                
                # Verificar si al menos un perfil está habilitado
                enabled = any(profile.get('Enabled', False) for profile in firewall_data)
                
                return {
                    "enabled": enabled,
                    "profiles": firewall_data,
                    "status": "Activo" if enabled else "Inactivo"
                }
        elif platform.system() == "Linux":
            # Verificar UFW en Linux
            cmd = "sudo ufw status"
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0:
                enabled = "active" in result.stdout.lower() or "activo" in result.stdout.lower()
                return {
                    "enabled": enabled,
                    "status": "Activo" if enabled else "Inactivo"
                }
        
        # Por defecto, asumir que está deshabilitado
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
            # Verificar Windows Defender
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
            
            # También verificar antivirus de terceros
            cmd = "powershell \"Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select displayName, productState | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                antivirus_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(antivirus_data, list):
                    antivirus_data = [antivirus_data]
                
                for av in antivirus_data:
                    name = av.get('displayName', 'Desconocido')
                    product_state = av.get('productState', 0)
                    
                    # Verificar si está activo (bit a bit)
                    # 266240 = UP-TO-DATE & ENABLED
                    # Otros valores indican diferentes estados
                    enabled = (product_state & 0x1000) != 0
                    
                    if enabled:
                        return {
                            "enabled": True,
                            "name": name,
                            "status": "Activo"
                        }
        
        # Por defecto, asumir que está deshabilitado
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
                
                # Convertir a lista si es un solo objeto
                if not isinstance(updates_data, list):
                    updates_data = [updates_data]
                
                return {
                    "status": "UpdatesAvailable",
                    "count": len(updates_data),
                    "updates": updates_data
                }
            else:
                # Si no hay actualizaciones o el comando falló
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
                # Extraer valor
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
        
        # Por defecto, asumir que está habilitado
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
            scan_type = request.POST.get("scan_type", "QuickScan")
            components = request.POST.get("components", "")
            
            if components:
                try:
                    components = json.loads(components)
                except:
                    components = []
            
            # Obtener datos del sistema
            system_data = get_system_data()
            
            # Crear diagnóstico
            diagnosis = create_diagnosis_entry(request.user, system_data, scan_type)
            
            # Devolver respuesta
            return JsonResponse({
                "status": "success",
                "message": "Diagnóstico iniciado correctamente",
                "diagnosis_id": diagnosis.id
            })
        else:
            return JsonResponse({"status": "error", "message": "Método no permitido"}, status=405)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def get_diagnostic_progress(request):
    """API para obtener el progreso del diagnóstico actual"""
    try:
        # Obtener el informe de diagnóstico más reciente
        report = DiagnosticReport.objects.filter(
            user=request.user
        ).order_by('-start_time').first()
        
        if not report:
            return JsonResponse({
                "status": "success",
                "data": {
                    "progress": 0,
                    "status": "No iniciado",
                    "component": ""
                }
            })
        
        # Devolver datos de progreso
        return JsonResponse({
            "status": "success",
            "data": {
                "progress": report.progress,
                "status": report.status,
                "component": report.current_component or "",
                "report_id": report.id
            }
        })
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def get_diagnostic_report(request, report_id):
    """API para obtener un informe de diagnóstico específico"""
    try:
        # Obtener el informe solicitado
        report = DiagnosticReport.objects.get(id=report_id, user=request.user)
        
        # Obtener diagnóstico asociado
        diagnosis = report.diagnosis
        
        # Obtener componentes analizados
        components = SystemComponent.objects.filter(report=report)
        
        # Obtener problemas detectados
        issues = DiagnosticIssue.objects.filter(diagnosis=diagnosis)
        
        # Preparar datos del informe
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
        
        # Agregar datos de componentes
        for component in components:
            report_data["components"].append({
                "id": component.id,
                "type": component.type,
                "name": component.name,
                "status": component.status,
                "details": component.get_details_as_dict(),
                "recommendations": component.recommendations
            })
        
        # Agregar datos de problemas
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
        # Obtener el diagnóstico más reciente
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
        
        # Obtener diagnóstico anterior para comparar
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
        
        # Calcular cambios de manera segura
        def calculate_change(latest, previous):
            try:
                latest_value = float(latest.strip('%'))
                previous_value = float(previous.strip('%'))
                change = latest_value - previous_value
                return f"{change:.2f}"
            except (ValueError, AttributeError):
                return "Datos no válidos"
        
        # Comparar valores
        comparison = {
            "cpu_change": calculate_change(latest_diagnosis.cpu_usage, previous_diagnosis.cpu_usage),
            "ram_change": calculate_change(latest_diagnosis.ram_percent, previous_diagnosis.ram_percent),
            "disk_change": calculate_change(latest_diagnosis.disk_percent, previous_diagnosis.disk_percent),
            "previous_date": previous_diagnosis.timestamp.strftime('%Y-%m-%d %H:%M')
        }
        
        return JsonResponse({"status": "success", "comparison": comparison})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(is_client)
def run_diagnostic_scenario(request, scenario_id):
    """API para ejecutar un escenario de diagnóstico específico"""
    try:
        # Obtener el escenario solicitado
        scenario = DiagnosticScenario.objects.get(id=scenario_id, is_active=True)
        
        # Obtener datos del sistema
        system_data = get_system_data()
        
        # Crear diagnóstico básico
        diagnosis = create_diagnosis_entry(request.user, system_data, f"Scenario_{scenario.name}")
        
        # Ejecutar el escenario específico
        results = run_specific_scenario(scenario, system_data, diagnosis)
        
        # Guardar resultados de ejecución del escenario
        scenario_run = ScenarioRun.objects.create(
            user=request.user,
            scenario=scenario,
            results=results,
            issues_found=len(results.get("issues", [])),
            recommendations=results.get("recommendations", "")
        )
        
        return JsonResponse({
            "status": "success",
            "message": f"Escenario '{scenario.name}' ejecutado correctamente",
            "run_id": scenario_run.id
        })
    except DiagnosticScenario.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Escenario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def run_specific_scenario(scenario, system_data, diagnosis):
    """Ejecuta un escenario de diagnóstico específico"""
    scenario_name = scenario.name.lower()
    
    # Ejecutar análisis según el escenario
    if "pantalla azul" in scenario_name:
        return analyze_blue_screen_scenario(system_data, diagnosis)
    elif "lento" in scenario_name:
        return analyze_slow_system_scenario(system_data, diagnosis)
    elif "conectividad" in scenario_name:
        return analyze_connectivity_scenario(system_data, diagnosis)
    elif "controlador" in scenario_name:
        return analyze_driver_scenario(system_data, diagnosis)
    elif "no responde" in scenario_name:
        return analyze_unresponsive_scenario(system_data, diagnosis)
    elif "arranque" in scenario_name:
        return analyze_slow_boot_scenario(system_data, diagnosis)
    elif "batería" in scenario_name:
        return analyze_battery_scenario(system_data, diagnosis)
    else:
        # Escenario genérico
        return {
            "scenario": scenario.name,
            "status": "UNKNOWN",
            "message": "Escenario no implementado",
            "issues": [],
            "recommendations": "Este escenario de diagnóstico no está implementado."
        }

def analyze_blue_screen_scenario(system_data, diagnosis):
    """Analiza el escenario de pantalla azul"""
    # Esta es una implementación simplificada
    # En un sistema real, se analizarían archivos de volcado de memoria, registros, etc.
    
    issues = []
    
    # Verificar controladores problemáticos
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-WinEvent -FilterHashtable @{LogName='System'; ID=41,1001,6008} -MaxEvents 10 | Select-Object TimeCreated, Id, Message | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout and "TimeCreated" in result.stdout:
                crash_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(crash_data, list):
                    crash_data = [crash_data]
                
                if crash_data:
                    issues.append({
                        "type": "HARDWARE",
                        "severity": "HIGH",
                        "description": f"Se encontraron {len(crash_data)} eventos de cierre inesperado del sistema",
                        "recommendation": "Verifique la temperatura del sistema, la estabilidad de la memoria RAM y actualice los controladores."
                    })
                    
                    # Buscar controladores problemáticos
                    drivers_result = analyze_drivers(system_data)
                    if drivers_result.get("problematic_drivers"):
                        issues.append({
                            "type": "DRIVER",
                            "severity": "HIGH",
                            "description": f"Se encontraron controladores con problemas que podrían causar pantallas azules",
                            "recommendation": "Actualice o reinstale los controladores problemáticos, especialmente de tarjeta gráfica, red o almacenamiento."
                        })
    except:
        pass
    
    # Verificar problemas de memoria
    try:
        if platform.system() == "Windows":
            cmd = "powershell \"Get-WmiObject Win32_ReliabilityRecords | Where-Object {$_.SourceName -eq 'Memory' -or $_.Message -match 'memory'} | Select-Object TimeGenerated, SourceName, Message | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout and "TimeGenerated" in result.stdout:
                memory_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(memory_data, list):
                    memory_data = [memory_data]
                
                if memory_data:
                    issues.append({
                        "type": "HARDWARE",
                        "severity": "HIGH",
                        "description": f"Se encontraron {len(memory_data)} errores relacionados con la memoria RAM",
                        "recommendation": "Ejecute un diagnóstico completo de memoria RAM (Windows Memory Diagnostic) y considere reemplazar los módulos de memoria si continúan los problemas."
                    })
    except:
        pass
    
    # Si no se encontraron problemas específicos
    if not issues:
        issues.append({
            "type": "OTHER",
            "severity": "MEDIUM",
            "description": "No se encontraron indicios claros de pantallas azules recientes",
            "recommendation": "Si experimenta pantallas azules, anote el código de error cuando aparezca y ejecute un análisis más detallado."
        })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    # Crear problema en la base de datos
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Sistema",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "Error de pantalla azul",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "recommendations": recommendations
    }

def analyze_slow_system_scenario(system_data, diagnosis):
    """Analiza el escenario de sistema lento"""
    issues = []
    
    # Verificar uso de CPU
    cpu_usage = system_data.get('cpu_usage', 'N/A')
    cpu_value = float(cpu_usage.replace('%', '')) if '%' in cpu_usage else 0
    
    if cpu_value > 80:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "HIGH",
            "description": f"Uso de CPU extremadamente alto ({cpu_usage})",
            "recommendation": "Identifique y cierre aplicaciones que consumen muchos recursos de CPU."
        })
    
    # Verificar uso de RAM
    ram_data = system_data.get('ram_usage', {})
    ram_percent = ram_data.get('percent', 'N/A')
    ram_value = float(ram_percent.replace('%', '')) if '%' in ram_percent else 0
    
    if ram_value > 85:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "HIGH",
            "description": f"Uso de memoria RAM muy alto ({ram_percent})",
            "recommendation": "Cierre aplicaciones innecesarias o considere ampliar la RAM de su equipo."
        })
    
    # Verificar espacio en disco
    disk_data = system_data.get('disk_usage', {}).get('partitions', [{}])[0]
    disk_percent = disk_data.get('percent', 'N/A')
    disk_value = float(disk_percent.replace('%', '')) if '%' in disk_percent else 0
    
    if disk_value > 90:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "HIGH",
            "description": f"Espacio en disco casi lleno ({disk_percent})",
            "recommendation": "Libere espacio en disco eliminando archivos innecesarios, use la herramienta de limpieza de disco o considere ampliar el almacenamiento."
        })
    
    # Verificar fragmentación del disco (solo Windows)
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
                            if frag_value > 20:
                                issues.append({
                                    "type": "PERFORMANCE",
                                    "severity": "MEDIUM",
                                    "description": f"Disco fragmentado ({frag_value}%)",
                                    "recommendation": "Ejecute el desfragmentador de disco para mejorar el rendimiento."
                                })
                        except:
                            pass
                        break
        except:
            pass
    
    # Verificar programas de inicio
    startup_programs = []
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-CimInstance Win32_StartupCommand | Select Name, Command, Location | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout:
                startup_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(startup_data, list):
                    startup_data = [startup_data]
                
                startup_programs = startup_data
                
                if len(startup_programs) > 10:
                    issues.append({
                        "type": "PERFORMANCE",
                        "severity": "MEDIUM",
                        "description": f"Demasiados programas de inicio ({len(startup_programs)})",
                        "recommendation": "Desactive programas de inicio innecesarios a través del Administrador de tareas."
                    })
        except:
            pass
    
    # Verificar procesos con alto consumo
    top_processes = system_data.get('top_processes', [])
    high_cpu_processes = []
    
    for process in top_processes:
        cpu_percent = process.get('cpu_percent', '0%')
        cpu_value = float(cpu_percent.replace('%', '')) if '%' in cpu_percent else 0
        
        if cpu_value > 15:
            high_cpu_processes.append(process)
    
    if high_cpu_processes:
        process_names = ", ".join([p.get('name', 'Desconocido') for p in high_cpu_processes[:3]])
        issues.append({
            "type": "PERFORMANCE",
            "severity": "MEDIUM",
            "description": f"Procesos con alto consumo de CPU: {process_names}",
            "recommendation": "Considere cerrar o actualizar estas aplicaciones para mejorar el rendimiento."
        })
    
    # Si no se encontraron problemas específicos
    if not issues:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "LOW",
            "description": "No se encontraron problemas de rendimiento evidentes",
            "recommendation": "Su sistema parece estar funcionando correctamente. Para mejorar el rendimiento, considere reiniciar su equipo regularmente y mantener el software actualizado."
        })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    if high_cpu_processes:
        recommendations += "\n\nProcesos con alto consumo:"
        for proc in high_cpu_processes[:3]:
            recommendations += f"\n- {proc.get('name', 'Desconocido')}: CPU {proc.get('cpu_percent', 'N/A')}, RAM {proc.get('memory_percent', 'N/A')}"
    
    # Crear problema en la base de datos
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Rendimiento",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "Sistema lento",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "high_cpu_processes": high_cpu_processes,
        "startup_programs": startup_programs[:5] if startup_programs else [],
        "recommendations": recommendations
    }

def analyze_connectivity_scenario(system_data, diagnosis):
    """Analiza el escenario de problemas de conectividad"""
    issues = []
    
    # Verificar conectividad a Internet
    internet_status = check_internet_connectivity()
    if not internet_status["connected"]:
        issues.append({
            "type": "NETWORK",
            "severity": "HIGH",
            "description": "Sin conexión a Internet",
            "recommendation": "Verifique su conexión de red, router o contacte con su proveedor de servicios de Internet."
        })
    elif internet_status["ping"] > 150:
        issues.append({
            "type": "NETWORK",
            "severity": "MEDIUM",
            "description": f"Latencia de red alta ({internet_status['ping']} ms)",
            "recommendation": "La velocidad de respuesta de su conexión es lenta. Verifique si hay otras aplicaciones usando el ancho de banda o contacte con su proveedor de Internet."
        })
    
    # Verificar adaptadores de red
    network_adapters = []
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-NetAdapter | Select Name, InterfaceDescription, Status, LinkSpeed, MediaType | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                adapters_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(adapters_data, list):
                    adapters_data = [adapters_data]
                
                network_adapters = adapters_data
                
                for adapter in network_adapters:
                    if adapter.get('Status') != 'Up' and ('Wi-Fi' in adapter.get('Name', '') or 'Ethernet' in adapter.get('Name', '')):
                        issues.append({
                            "type": "NETWORK",
                            "severity": "HIGH",
                            "description": f"Adaptador {adapter.get('Name', 'Desconocido')} desactivado",
                            "recommendation": "Active el adaptador de red o verifique si hay problemas físicos con la conexión."
                        })
        except:
            pass
    
    # Verificar DNS
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
                        "recommendation": "Configure los servidores DNS manualmente (por ejemplo, 8.8.8.8 y 8.8.4.4 de Google)."
                    })
        except:
            pass
    
    # Verificar controladores de red
    drivers_info = analyze_drivers(system_data)
    network_drivers = []
    
    if drivers_info.get("drivers"):
        for driver in drivers_info.get("drivers"):
            if 'network' in driver.get('name', '').lower() or 'ethernet' in driver.get('name', '').lower() or 'wifi' in driver.get('name', '').lower() or 'wireless' in driver.get('name', '').lower():
                network_drivers.append(driver)
                
                if driver.get('status') == 'Desactualizado':
                    issues.append({
                        "type": "DRIVER",
                        "severity": "MEDIUM",
                        "description": f"Controlador de red desactualizado: {driver.get('name', 'Desconocido')}",
                        "recommendation": "Actualice el controlador para mejorar la estabilidad de la conexión."
                    })
    
    # Si no se encontraron problemas específicos
    if not issues:
        if internet_status["connected"]:
            issues.append({
                "type": "NETWORK",
                "severity": "LOW",
                "description": "No se encontraron problemas de conectividad",
                "recommendation": "Su conexión de red parece estar funcionando correctamente."
            })
        else:
            issues.append({
                "type": "NETWORK",
                "severity": "HIGH",
                "description": "Problemas de conectividad no identificados",
                "recommendation": "Reinicie su router/módem, verifique cables de red, o contacte a su proveedor de servicios de Internet."
            })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    # Crear problema en la base de datos
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
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "internet_status": internet_status,
        "network_adapters": network_adapters,
        "dns_servers": dns_servers,
        "recommendations": recommendations
    }

def analyze_driver_scenario(system_data, diagnosis):
    """Analiza el escenario de problemas de controladores"""
    issues = []
    
    # Obtener información de controladores
    drivers_result = analyze_drivers(system_data)
    
    problematic_drivers = drivers_result.get("problematic_drivers", [])
    outdated_drivers = drivers_result.get("outdated_drivers", [])
    
    # Verificar controladores problemáticos
    if problematic_drivers:
        for driver in problematic_drivers:
            issues.append({
                "type": "DRIVER",
                "severity": "HIGH",
                "description": f"Problema en el controlador de {driver.get('name', 'Desconocido')}",
                "recommendation": "Reinstale o actualice el controlador para resolver el problema."
            })
    
    # Verificar controladores desactualizados
    if outdated_drivers:
        for driver in outdated_drivers[:3]:  # Limitar a 3 para no saturar
            issues.append({
                "type": "DRIVER",
                "severity": "MEDIUM",
                "description": f"Controlador desactualizado: {driver.get('name', 'Desconocido')}",
                "recommendation": f"Actualice el controlador para mejorar la compatibilidad y rendimiento."
            })
    
    # Verificar eventos relacionados con controladores en el registro
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-WinEvent -FilterHashtable @{LogName='System'; ID=219,7023,11,4,1} -MaxEvents 20 | Where-Object {$_.Message -match 'driver|controlador'} | Select-Object TimeCreated, Id, Message | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout and "TimeCreated" in result.stdout:
                driver_events = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(driver_events, list):
                    driver_events = [driver_events]
                
                if driver_events:
                    driver_issues_count = len(driver_events)
                    issues.append({
                        "type": "DRIVER",
                        "severity": "MEDIUM",
                        "description": f"Se encontraron {driver_issues_count} eventos relacionados con controladores en el registro del sistema",
                        "recommendation": "Revise el Visor de eventos para identificar controladores problemáticos específicos y actualícelos."
                    })
        except:
            pass
    
    # Si no se encontraron problemas específicos
    if not issues:
        issues.append({
            "type": "DRIVER",
            "severity": "LOW",
            "description": "No se encontraron problemas con los controladores",
            "recommendation": "Los controladores del sistema parecen estar funcionando correctamente. Para mantener un rendimiento óptimo, considere verificar actualizaciones periódicamente."
        })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    # Agregar información adicional
    if len(outdated_drivers) > 3:
        recommendations += f"\n\nSe encontraron {len(outdated_drivers)} controladores desactualizados en total. Considere actualizarlos todos para un rendimiento óptimo."
    
    # Crear problema en la base de datos
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Controladores",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "Error del controlador",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "problematic_drivers": problematic_drivers,
        "outdated_drivers": outdated_drivers,
        "recommendations": recommendations
    }

def analyze_unresponsive_scenario(system_data, diagnosis):
    """Analiza el escenario de sistema que no responde"""
    issues = []
    
    # Verificar uso de recursos
    cpu_usage = system_data.get('cpu_usage', 'N/A')
    cpu_value = float(cpu_usage.replace('%', '')) if '%' in cpu_usage else 0
    
    ram_data = system_data.get('ram_usage', {})
    ram_percent = ram_data.get('percent', 'N/A')
    ram_value = float(ram_percent.replace('%', '')) if '%' in ram_percent else 0
    
    if cpu_value > 90:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "HIGH",
            "description": f"Uso de CPU extremadamente alto ({cpu_usage})",
            "recommendation": "Identifique y cierre procesos que consumen muchos recursos usando el Administrador de tareas."
        })
    
    if ram_value > 95:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "HIGH",
            "description": f"Memoria RAM casi agotada ({ram_percent})",
            "recommendation": "Cierre aplicaciones para liberar memoria o amplíe la RAM de su equipo."
        })
    
    # Verificar procesos con alto consumo
    top_processes = system_data.get('top_processes', [])
    high_resource_processes = []
    
    for process in top_processes:
        cpu_percent = process.get('cpu_percent', '0%')
        memory_percent = process.get('memory_percent', '0%')
        
        cpu_value = float(cpu_percent.replace('%', '')) if '%' in cpu_percent else 0
        memory_value = float(memory_percent.replace('%', '')) if '%' in memory_percent else 0
        
        if cpu_value > 25 or memory_value > 25:
            high_resource_processes.append(process)
    
    if high_resource_processes:
        process_names = ", ".join([p.get('name', 'Desconocido') for p in high_resource_processes[:2]])
        issues.append({
            "type": "PERFORMANCE",
            "severity": "HIGH",
            "description": f"Procesos con consumo excesivo de recursos: {process_names}",
            "recommendation": "Cierre estas aplicaciones o reinícielas si son necesarias."
        })
    
    # Verificar espacio en disco
    disk_data = system_data.get('disk_usage', {}).get('partitions', [{}])[0]
    disk_percent = disk_data.get('percent', 'N/A')
    disk_value = float(disk_percent.replace('%', '')) if '%' in disk_percent else 0
    
    if disk_value > 98:
        issues.append({
            "type": "HARDWARE",
            "severity": "CRITICAL",
            "description": f"Disco prácticamente lleno ({disk_percent})",
            "recommendation": "Libere espacio urgentemente. Un disco completamente lleno puede causar que el sistema deje de responder."
        })
    
    # Verificar eventos de bloqueo en aplicaciones
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-WinEvent -FilterHashtable @{LogName='Application'; ID=1000,1002} -MaxEvents 10 | Select-Object TimeCreated, Id, Message | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout and "TimeCreated" in result.stdout:
                crash_events = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(crash_events, list):
                    crash_events = [crash_events]
                
                if crash_events:
                    issues.append({
                        "type": "SOFTWARE",
                        "severity": "MEDIUM",
                        "description": f"Se encontraron {len(crash_events)} bloqueos recientes de aplicaciones",
                        "recommendation": "Actualice las aplicaciones que presentan bloqueos frecuentes o reinstálelas si el problema persiste."
                    })
        except:
            pass
    
    # Si no se encontraron problemas específicos
    if not issues:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "MEDIUM",
            "description": "No se encontraron causas evidentes para que el sistema no responda",
            "recommendation": "Si el sistema deja de responder frecuentemente, considere reiniciar en modo seguro para descartar problemas con software de terceros."
        })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    if high_resource_processes:
        recommendations += "\n\nProcesos con alto consumo de recursos:"
        for proc in high_resource_processes[:3]:
            recommendations += f"\n- {proc.get('name', 'Desconocido')}: CPU {proc.get('cpu_percent', 'N/A')}, RAM {proc.get('memory_percent', 'N/A')}"
    
    # Agregar recomendaciones generales
    recommendations += "\n\nRecomendaciones generales para un sistema que no responde:"
    recommendations += "\n- Pulse Ctrl+Alt+Del y use el Administrador de tareas para cerrar aplicaciones bloqueadas."
    recommendations += "\n- Reinicie su equipo regularmente para limpiar la memoria y recursos."
    recommendations += "\n- Mantenga actualizado el sistema operativo y controladores."
    
    # Crear problema en la base de datos
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Sistema",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "El sistema no responde",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "high_resource_processes": high_resource_processes,
        "recommendations": recommendations
    }

def analyze_slow_boot_scenario(system_data, diagnosis):
    """Analiza el escenario de tiempo de arranque lento"""
    issues = []
    
    # Verificar programas de inicio
    startup_programs = []
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-CimInstance Win32_StartupCommand | Select Name, Command, Location | ConvertTo-Json\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=15)
            
            if result.returncode == 0 and result.stdout:
                startup_data = json.loads(result.stdout)
                
                # Convertir a lista si es un solo objeto
                if not isinstance(startup_data, list):
                    startup_data = [startup_data]
                
                startup_programs = startup_data
                
                if len(startup_programs) > 8:
                    issues.append({
                        "type": "PERFORMANCE",
                        "severity": "HIGH",
                        "description": f"Demasiados programas de inicio ({len(startup_programs)})",
                        "recommendation": "Reduzca el número de programas que se inician automáticamente a través del Administrador de tareas > Inicio."
                    })
        except:
            pass
    
    # Verificar servicios innecesarios
    services_count = 0
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-Service | Where-Object {$_.Status -eq 'Running'} | Measure-Object | Select-Object -ExpandProperty Count\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                services_count = int(result.stdout.strip())
                
                if services_count > 100:
                    issues.append({
                        "type": "PERFORMANCE",
                        "severity": "MEDIUM",
                        "description": f"Excesivo número de servicios en ejecución ({services_count})",
                        "recommendation": "Considere deshabilitar servicios innecesarios a través de la aplicación Servicios."
                    })
        except:
            pass
    
    # Verificar fragmentación del disco
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
                            if frag_value > 20:
                                issues.append({
                                    "type": "PERFORMANCE",
                                    "severity": "MEDIUM",
                                    "description": f"Disco fragmentado ({frag_value}%)",
                                    "recommendation": "Ejecute el desfragmentador de disco para mejorar el tiempo de arranque."
                                })
                        except:
                            pass
                        break
        except:
            pass
    
    # Verificar estado del disco
    disk_data = system_data.get('disk_usage', {}).get('partitions', [{}])[0]
    disk_percent = disk_data.get('percent', 'N/A')
    disk_value = float(disk_percent.replace('%', '')) if '%' in disk_percent else 0
    
    if disk_value > 90:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "MEDIUM",
            "description": f"Poco espacio libre en disco ({disk_percent} lleno)",
            "recommendation": "Libere espacio en el disco principal para mejorar el rendimiento durante el arranque."
        })
    
    # Verificar actualizaciones pendientes
    if platform.system() == "Windows":
        updates_status = check_windows_updates()
        if updates_status["status"] == "UpdatesAvailable" and updates_status["count"] > 5:
            issues.append({
                "type": "SOFTWARE",
                "severity": "MEDIUM",
                "description": f"Varias actualizaciones pendientes ({updates_status['count']})",
                "recommendation": "Instale las actualizaciones pendientes, ya que pueden incluir mejoras de rendimiento."
            })
    
    # Si no se encontraron problemas específicos
    if not issues:
        issues.append({
            "type": "PERFORMANCE",
            "severity": "LOW",
            "description": "No se encontraron causas específicas de arranque lento",
            "recommendation": "Considere reiniciar su equipo regularmente y mantener el software actualizado para un rendimiento óptimo."
        })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    # Agregar recomendaciones generales
    recommendations += "\n\nRecomendaciones generales para mejorar el tiempo de arranque:"
    recommendations += "\n- Utilice el inicio rápido de Windows (si está disponible)."
    recommendations += "\n- Considere usar un disco SSD si actualmente tiene un HDD."
    recommendations += "\n- Desinstale software que no utilice para reducir la carga del sistema."
    
    if startup_programs:
        recommendations += "\n\nProgramas de inicio que puede considerar deshabilitar:"
        for prog in startup_programs[:5]:
            recommendations += f"\n- {prog.get('Name', 'Desconocido')}"
    
    # Crear problema en la base de datos
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Rendimiento",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "Tiempo de arranque lento",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "startup_programs_count": len(startup_programs),
        "services_count": services_count,
        "recommendations": recommendations
    }

def analyze_battery_scenario(system_data, diagnosis):
    """Analiza el escenario de problemas con la batería"""
    issues = []
    
    # Obtener información de batería
    battery_data = system_data.get('battery')
    
    if not battery_data:
        return {
            "scenario": "Problemas con la batería",
            "status": "UNKNOWN",
            "message": "No se detectó batería en el sistema",
            "issues": [{
                "type": "HARDWARE",
                "severity": "LOW",
                "description": "No se detectó batería",
                "recommendation": "Este dispositivo no tiene batería o no se pudo detectar."
            }],
            "recommendations": "Este dispositivo no tiene batería o no se pudo detectar."
        }
    
    # Analizar estado de la batería
    battery_result = analyze_battery(system_data)
    battery_issues = battery_result.get("issues", [])
    
    # Incluir todos los problemas detectados
    issues.extend(battery_issues)
    
    # Verificar desgaste de la batería
    battery_health = battery_result.get("health")
    if battery_health and "health_percent" in battery_health:
        health_percent_str = battery_health["health_percent"]
        health_percent = float(health_percent_str.replace('%', '')) if '%' in health_percent_str else 0
        
        if health_percent < 60 and not any(issue["description"].startswith("Salud de batería") for issue in issues):
            issues.append({
                "type": "HARDWARE",
                "severity": "MEDIUM",
                "description": f"Salud de batería deteriorada ({health_percent_str})",
                "recommendation": "La capacidad de su batería está significativamente reducida. Considere reemplazarla para mejorar la autonomía."
            })
    
    # Verificar configuración de energía en Windows
    power_plan = None
    if platform.system() == "Windows":
        try:
            cmd = "powershell \"Get-WmiObject -Class Win32_PowerPlan -Namespace root\\cimv2\\power -Filter 'IsActive=True' | Select-Object ElementName\""
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=10)
            
            if result.returncode == 0 and result.stdout:
                for line in result.stdout.split('\n'):
                    if "ElementName" in line:
                        power_plan = line.split(':')[1].strip()
                        break
                
                if power_plan and ("alto rendimiento" in power_plan.lower() or "high performance" in power_plan.lower()):
                    issues.append({
                        "type": "CONFIGURATION",
                        "severity": "MEDIUM",
                        "description": f"Plan de energía de alto rendimiento activo ({power_plan})",
                        "recommendation": "Este plan consume más batería. Cambie a 'Equilibrado' o 'Ahorro de energía' para mejorar la duración de la batería."
                    })
        except:
            pass
    
    # Verificar aplicaciones que consumen batería
    try:
        high_power_apps = []
        
        for process in system_data.get('top_processes', []):
            cpu_percent = process.get('cpu_percent', '0%')
            cpu_value = float(cpu_percent.replace('%', '')) if '%' in cpu_percent else 0
            
            if cpu_value > 15 and len(high_power_apps) < 3:
                high_power_apps.append(process.get('name', 'Desconocido'))
        
        if high_power_apps:
            issues.append({
                "type": "SOFTWARE",
                "severity": "MEDIUM",
                "description": f"Aplicaciones con alto consumo de energía: {', '.join(high_power_apps)}",
                "recommendation": "Cierre estas aplicaciones cuando funcione con batería para prolongar su duración."
            })
    except:
        pass
    
    # Si no se encontraron problemas específicos adicionales
    if not issues:
        issues.append({
            "type": "HARDWARE",
            "severity": "LOW",
            "description": "No se detectaron problemas específicos con la batería",
            "recommendation": "La batería parece estar funcionando correctamente."
        })
    
    # Generar recomendaciones
    recommendations = "\n".join([issue["recommendation"] for issue in issues])
    
    # Agregar recomendaciones generales para mejorar la duración de la batería
    recommendations += "\n\nRecomendaciones generales para mejorar la duración de la batería:"
    recommendations += "\n- Reduzca el brillo de la pantalla."
    recommendations += "\n- Desactive Wi-Fi y Bluetooth cuando no los use."
    recommendations += "\n- Cierre aplicaciones en segundo plano."
    recommendations += "\n- Utilice el modo de ahorro de energía."
    recommendations += "\n- Evite temperaturas extremas que puedan dañar la batería."
    
    # Crear problema en la base de datos
    for issue in issues:
        DiagnosticIssue.objects.create(
            diagnosis=diagnosis,
            component="Batería",
            issue_type=issue["type"],
            severity=issue["severity"],
            description=issue["description"],
            recommendation=issue["recommendation"]
        )
    
    return {
        "scenario": "Problemas con la batería",
        "status": "CRITICAL" if any(issue["severity"] == "HIGH" for issue in issues) else "WARNING",
        "issues": issues,
        "battery_info": battery_result,
        "power_plan": power_plan,
        "recommendations": recommendations
    }

@login_required
@user_passes_test(is_client)
def get_scenario_result(request, run_id):
    """API para obtener el resultado de una ejecución de escenario"""
    try:
        scenario_run = ScenarioRun.objects.get(id=run_id, user=request.user)
        
        return JsonResponse({
            "status": "success",
            "data": {
                "id": scenario_run.id,
                "scenario": scenario_run.scenario.name,
                "timestamp": scenario_run.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                "issues_found": scenario_run.issues_found,
                "results": scenario_run.get_results_as_dict(),
                "recommendations": scenario_run.recommendations
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
        # Obtener los últimos 10 registros de diagnóstico para el usuario actual
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
@require_GET
def get_temp_size(request):
    try:
        # Usar la función común para obtener los directorios temporales
        temp_directories = get_temp_directories()
        temp_directories = [d for d in temp_directories if d and os.path.exists(d) and os.path.isdir(d)]

        total_temp_size = 0
        total_temp_files = 0
        files_in_use_size = 0
        files_in_use_count = 0

        for temp_dir in temp_directories:
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    try:
                        if os.path.isfile(file_path) and os.path.getsize(file_path) > 0:
                            file_size = os.path.getsize(file_path)
                            
                            # Usar la función común para verificar si el archivo está en uso
                            if is_file_in_use(file_path):
                                files_in_use_size += file_size
                                files_in_use_count += 1
                            else:
                                total_temp_size += file_size
                                total_temp_files += 1
                    except Exception:
                        continue

        return JsonResponse({
            "status": "success",
            "total_temp_size": formatear_tamano(total_temp_size),
            "total_temp_files": total_temp_files,
            "files_in_use_size": formatear_tamano(files_in_use_size),
            "files_in_use_count": files_in_use_count
        })

    except Exception as e:
        logger.error(f"Error en get_temp_size: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

        
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
        failed_files = []
        deleted_files = []
        files_in_use_details = []
        skipped_files = 0
        
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
        
        total_failed_size = 0
        for file in files_in_use_details:
            try:
                if os.path.exists(file['path']) and os.access(file['path'], os.R_OK):
                    total_failed_size += os.path.getsize(file['path'])
            except Exception:
                continue
        
        message = f"Archivos eliminados: {total_deleted}.<br>Tamaño liberado: {tamano_liberado}.<br>Archivos en uso no eliminados: {len(files_in_use_details)}."
        
        logger.info(f"Limpieza completada: {message}")
        
        return JsonResponse({
            "status": "success",
            "message": message,
            "total_deleted": total_deleted,
            "space_freed": tamano_liberado,
            "files_in_use": len(files_in_use_details),
            "total_failed_size": formatear_tamano(total_failed_size),
            "details": {
                "directories_checked": len(temp_directories),
                "skipped_files": skipped_files,
                "oldest_file_age_hours": old_files_hours
            }
        })
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
        
@login_required
@user_passes_test(is_client)
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
    # return render(request, "dashboard/client/inicio.html", {
    #     "videos": videos,
    #     # "query": query  
    # })

# Admin dashboard
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

# Client dashboard
@login_required
@user_passes_test(is_client)
def client_dashboard(request):
    return render(request, 'dashboard/client/inicio.html')

# Add technician
@login_required
@user_passes_test(lambda u: u.role == 'admin')
def add_technician(request):
    country_list = []
    try:
        response = requests.get('https://restcountries.com/v3.1/independent?status=true', timeout=10)
        response.raise_for_status()
        countries = response.json()
        country_list = [country['name']['common'] for country in countries if 'name' in country and 'common' in country['name']]
    except requests.RequestException as e:
        messages.error(request, f'Error al obtener los países: {e}')

    if request.method == 'POST':
        form = CreateTechForm(request.POST, request.FILES)
        if form.is_valid():
            # Guardar usuario
            user = form.save(commit=False)
            user.role = 'tech'  # Aseguramos que tenga el rol correcto
            user.is_staff = True
            user.save()

            # Convertir latitud y longitud a float para evitar errores en la base de datos
            try:
                latitude = float(request.POST.get('latitude', 0))
                longitude = float(request.POST.get('longitude', 0))
            except ValueError:
                latitude, longitude = 0, 0  # Valores por defecto si no son válidos

            # Crear o actualizar UserProfile con el rol correcto
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

            messages.success(request, 'Técnico agregado exitosamente.')
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Corrige los errores en el formulario.')
    else:
        form = CreateTechForm()

    return render(request, 'dashboard/admin/add_technician.html', {'form': form, 'countries': country_list})

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
def manage_users(request):
    """Vista para gestionar usuarios con búsqueda y paginación."""
    query = request.GET.get('q', '')
    current_user = request.user  # Obtener el usuario logueado
    users = User.objects.exclude(id=current_user.id)  # Excluir el usuario actual
    if query:
        users = users.filter(username__icontains=query) | users.filter(email__icontains=query)

    paginator = Paginator(users, 10)  # 10 usuarios por página
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {'page_obj': page_obj, 'query': query}
    return render(request, 'dashboard/admin/manage_users.html', context)

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

