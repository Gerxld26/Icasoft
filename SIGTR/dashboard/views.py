from django.http import JsonResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import logout, authenticate, login
from django.contrib import messages
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
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, user_passes_test
from openai import OpenAI
import psutil
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
import speedtest
from django.utils.dateparse import parse_date
from .models import LearningVideo
from .forms import LearningVideoForm
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.utils.safestring import mark_safe
from django.middleware.csrf import get_token

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .utils import perform_speed_test

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


# Vista para el Chat del Cliente
@login_required
@user_passes_test(is_client)
def client_chat(request):
    if request.method == "GET":

        return render(request, "dashboard/client/client_chat.html")



#View del wifi
@require_http_methods(["GET", "POST"])
def speed_test(request):
    """
    Vista de prueba de velocidad con manejo explícito de autenticación
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'status': 'error',
            'message': 'No autenticado',
            'csrf_token': get_token(request)
        }, status=401)
    
    # Realizar prueba de velocidad
    try:
        st = speedtest.Speedtest()
        
        server = st.get_best_server()
        
        #velocidad de descarga
        st.download()
        download_speed = st.results.download / 1_000_000 
        
        # velocidad de subida
        st.upload()
        upload_speed = st.results.upload / 1_000_000  
        
        ping = st.results.ping
        
        return JsonResponse({
            'status': 'success',
            'user': {
                'username': request.user.username,
                'email': request.user.email,
                'role': request.user.role
            },
            'data': {
                'download_speed': round(download_speed, 2),
                'upload_speed': round(upload_speed, 2),
                'ping': round(ping, 2),
                'server': {
                    'name': server.get('sponsor', 'Desconocido'),
                    'location': server.get('name', 'Sin ubicación')
                }
            }
        })
    
    except Exception as e:
        logger.error(f"Error en prueba de velocidad: {str(e)}")
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)



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
                continue  

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
    

# Diagnóstico del sistema (incluye CPU, RAM, Disco, y GPU)
@login_required
@user_passes_test(is_client)
def client_diagnosis_data(request):
    try:
        scan_type = request.GET.get("scan_type", "QuickScan")
        custom_path = request.GET.get("custom_path", "")

        # Obtener datos del sistema
        cpu_percent = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Obtener información de GPU con GPUtil
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_data = {
                    "name": gpus[0].name,
                    "usage": f"{gpus[0].load * 100:.2f}%",
                    "temperature": f"{gpus[0].temperature} °C",
                }
            else:
                gpu_data = {"name": "No GPU detectada", "usage": "N/A", "temperature": "N/A"}
        except Exception:
            gpu_data = {"name": "Error al obtener GPU", "usage": "N/A", "temperature": "N/A"}

        # Guardar diagnóstico en la base de datos
        diagnosis = Diagnosis.objects.create(
            user=request.user,
            cpu_usage=f"{cpu_percent}%",
            ram_total=f"{ram.total / (1024 ** 3):.2f} GB",
            ram_used=f"{ram.used / (1024 ** 3):.2f} GB",
            ram_percent=f"{ram.percent}%",
            disk_total=f"{disk.total / (1024 ** 3):.2f} GB",
            disk_used=f"{disk.used / (1024 ** 3):.2f} GB",
            disk_free=f"{disk.free / (1024 ** 3):.2f} GB",
            disk_percent=f"{disk.percent}%",
        )

        # Preparar respuesta con los datos del diagnóstico
        diagnosis_data = {
            "cpu_usage": diagnosis.cpu_usage,
            "ram_usage": {
                "total": diagnosis.ram_total,
                "used": diagnosis.ram_used,
                "percent": diagnosis.ram_percent,
            },
            "disk_usage": {
                "total": diagnosis.disk_total,
                "used": diagnosis.disk_used,
                "free": diagnosis.disk_free,
                "percent": diagnosis.disk_percent,
            },
            "gpu_usage": gpu_data,
        }

        return JsonResponse({"status": "success", "data": diagnosis_data})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

    

# Vista para obtener el progreso del análisis
@login_required
@user_passes_test(is_client)
def get_scan_progress(request):
    try:
        command = "Get-MpScan | ConvertTo-Json"
        result = subprocess.run(["powershell", "-Command", command], capture_output=True, text=True)
        if result.returncode == 0:
            return JsonResponse({"status": "success", "data": json.loads(result.stdout)})
        return JsonResponse({"status": "error", "message": "No se pudo obtener el progreso del análisis"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    


# Función para verificar el estado de Microsoft Defender
def check_defender_status():
    try:
        command = "Get-MpComputerStatus | ConvertTo-Json"
        result = subprocess.run(["powershell", "-Command", command], capture_output=True, text=True)
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"error": "No se pudo obtener el estado de Microsoft Defender"}
    except Exception as e:
        return {"error": str(e)}


# Función para ejecutar un escaneo con Microsoft Defender
def run_defender_scan(scan_type, custom_path=None):
    try:
        # Determinar el comando según el tipo de escaneo
        if scan_type == "FullScan":
            command = "Start-MpScan -ScanType FullScan"
        elif scan_type == "CustomScan" and custom_path:
            command = f"Start-MpScan -ScanType CustomScan -ScanPath {custom_path}"
        else:
            command = "Start-MpScan -ScanType QuickScan"

        # Ejecutar escaneo en segundo plano
        process = subprocess.Popen(["powershell", "-Command", command], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return {"status": f"Escaneo {scan_type} iniciado correctamente en segundo plano"}
    except Exception as e:
        return {"error": str(e)}


# Vista para la comparación del diagnóstico actual con diagnósticos previos
@csrf_exempt
@login_required
@user_passes_test(is_client)
def client_comparison(request):
    try:
        # Obtener el diagnóstico más reciente
        latest_diagnosis = Diagnosis.objects.filter(user=request.user).latest('timestamp')
        previous_diagnoses = Diagnosis.objects.filter(user=request.user).exclude(id=latest_diagnosis.id)

        if previous_diagnoses.exists():
            # Obtener el diagnóstico previo más reciente
            previous = previous_diagnoses.latest('timestamp')

            # Calcular diferencias de manera segura
            def calculate_change(latest, previous):
                try:
                    latest_value = float(latest.strip('%'))
                    previous_value = float(previous.strip('%'))
                    return f"{latest_value - previous_value:.2f}"
                except (ValueError, AttributeError):
                    return "Datos no válidos"

            comparison = {
                "cpu_change": calculate_change(latest_diagnosis.cpu_usage, previous.cpu_usage),
                "ram_change": calculate_change(latest_diagnosis.ram_percent, previous.ram_percent),
                "disk_change": calculate_change(latest_diagnosis.disk_percent, previous.disk_percent),
            }
        else:
            comparison = {
                "cpu_change": "Sin datos previos",
                "ram_change": "Sin datos previos",
                "disk_change": "Sin datos previos",
            }

        return JsonResponse({"status": "success", "comparison": comparison})

    except Diagnosis.DoesNotExist:
        return JsonResponse({
            "status": "success",
            "comparison": {
                "cpu_change": "Sin datos disponibles",
                "ram_change": "Sin datos disponibles",
                "disk_change": "Sin datos disponibles",
            }
        })

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)



@login_required
@user_passes_test(is_client)
def defender_status_api(request):
    try:
        defender_status = check_defender_status()

        # Procesar datos relevantes de la respuesta
        if "CimInstanceProperties" in defender_status:
            relevant_data = {}
            for prop in defender_status["CimInstanceProperties"]:
                if prop["Name"] in ["AntivirusEnabled", "AntivirusSignatureVersion", "RealTimeProtectionEnabled",
                                    "AntispywareEnabled", "IsTamperProtected", "AMEngineVersion", "AMServiceVersion"]:
                    relevant_data[prop["Name"]] = prop["Value"]
        else:
            return JsonResponse({"status": "error", "message": "No se pudieron procesar los datos del estado de Defender."})

        return JsonResponse({"status": "success", "data": relevant_data})
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

from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
import os

def formatear_tamano(bytes_size):
    for unidad in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024:
            return f"{bytes_size:.2f} {unidad}"
        bytes_size /= 1024
    return f"{bytes_size:.2f} PB"

@login_required
@user_passes_test(is_client)
def client_clear_space(request):
    """
    Limpia archivos temporales para liberar espacio en el sistema.
    """
    try:
        # Directorios de archivos temporales comunes
        temp_directories = [
            os.getenv('TEMP', '/tmp'),
            os.path.expanduser('~/.cache'),
        ]

        total_deleted = 0
        total_failed = 0
        total_bytes_deleted = 0
        failed_files = []

        for temp_dir in temp_directories:
            if os.path.exists(temp_dir):
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        try:
                            if os.path.isfile(file_path):
                                total_bytes_deleted += os.path.getsize(file_path)
                                os.remove(file_path)
                                total_deleted += 1
                        except Exception as e:
                            total_failed += 1
                            failed_files.append(file_path)
                            print(f"Error al eliminar {file_path}: {e}")

        tamano_legible = formatear_tamano(total_bytes_deleted)

        message = (
            f"Archivos eliminados: {total_deleted}.<br>"
            f"Tamaño liberado: {tamano_legible}.<br>"
        )
        if total_failed > 0:
            message += f"Archivos en uso no eliminados: {total_failed}."

        return JsonResponse({
            "status": "success",
            "message": message,
            "failed_files": failed_files,
            "total_deleted": total_deleted,
            "space_freed": tamano_legible
        })

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Error inesperado: {str(e)}"
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
        # Capturamos errores inesperados
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

            # Verificar si la unidad es un SSD
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
def client_tamano_temp(request):
    temp_dir = tempfile.gettempdir()
    total_tamano = 0

    for archivo in os.listdir(temp_dir):
        ruta = os.path.join(temp_dir, archivo)
        if os.path.isfile(ruta):
            total_tamano += os.path.getsize(ruta)

    tamano_legible = formatear_tamano(total_tamano)

    return JsonResponse({
        'tamano_total': tamano_legible
    })

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
@csrf_exempt
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
@login_required
def user_logout(request):
    logout(request)
    return redirect('users:login')

