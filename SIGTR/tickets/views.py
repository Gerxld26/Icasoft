from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.urls import reverse
from twilio.rest import Client
from django.conf import settings
from django.contrib.auth import get_user_model
import logging
import json

User = get_user_model()

logger = logging.getLogger(__name__)
from .models import Ticket, TipoAsistencia
from .forms import TicketRequestForm
from users.models import UserProfile
from geopy.distance import geodesic
from django.http import JsonResponse, HttpResponseNotAllowed

# Definir constantes para la lógica de proximidad - Un solo límite
MAX_DISTANCE_KM = 2  # Distancia máxima para considerar a un técnico como "cercano" y permitir crear tickets

@login_required
@user_passes_test(lambda user: user.role == "client")
def asistencia(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Datos inválidos."}, status=400)

        required_fields = ["latitud", "longitud", "tecnico"]
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return JsonResponse({
                "status": "error",
                "message": f"Faltan los siguientes campos requeridos: {', '.join(missing)}"
            })

        try:
            latitude = float(data["latitud"])
            longitude = float(data["longitud"])
        except ValueError:
            return JsonResponse({
                "status": "error",
                "message": "Las coordenadas deben ser valores numéricos válidos."
            })

        technician_id = data["tecnico"]
        tipo_asistencia_id = int(data["tipoAsistencia"])

        try:
            technician = User.objects.get(id=technician_id)
            tech_profile = UserProfile.objects.get(user=technician)

            if not all([tech_profile.latitude, tech_profile.longitude]):
                return JsonResponse({
                    "status": "error",
                    "message": "No se pueden determinar las coordenadas del técnico."
                })

            client_location = (latitude, longitude)
            tech_location = (float(tech_profile.latitude), float(tech_profile.longitude))
            distance = geodesic(client_location, tech_location).km

            if distance > MAX_DISTANCE_KM:
                return JsonResponse({
                    "status": "error",
                    "message": f"El técnico está a {distance:.1f} km, fuera del rango permitido."
                })

            try:
                tipo_asistencia = TipoAsistencia.objects.get(id=tipo_asistencia_id)
            except TipoAsistencia.DoesNotExist:
                return JsonResponse({
                    "status": "error",
                    "message": "El tipo de asistencia seleccionado no existe."
                })

            ticket = Ticket.objects.create(
                client=request.user,
                assigned_to=technician,
                description=data["descripcion"],
                latitude=latitude,
                longitude=longitude,
                tipo_asistencia=tipo_asistencia
            )

            # Enviar mensaje por WhatsApp al cliente
            numero_cliente = User.objects.filter(
                id=request.user.id,
                is_active=True,
                role='client'
            ).values_list('telefono', flat=True).first()

            if numero_cliente:
                client_twilio = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                mensaje = f"Hola {request.user.username}, tu solicitud fue registrada. Un técnico te contactará pronto."
                client_twilio.messages.create(
                    body=mensaje,
                    from_='whatsapp:+14155238886',
                    to=f'whatsapp:{numero_cliente}'
                )

            return JsonResponse({
                "status": "success",
                "message": "¡Solicitud enviada correctamente!",
            })

        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "El técnico no existe."})
        except UserProfile.DoesNotExist:
            return JsonResponse({"status": "error", "message": "El técnico no tiene un perfil válido."})
        except Exception as e:
            logger.error(f"Error en la creación del ticket: {str(e)}")
            return JsonResponse({"status": "error", "message": "Ocurrió un error al procesar tu solicitud."})

@login_required
@user_passes_test(lambda user: user.role == "client")
def tipo_asistencia(request):
    try:
        tipos_asistencia = TipoAsistencia.objects.all()  # Retorna: status='open'
        return JsonResponse({"status": "success", "tipo_asistencia": list(tipos_asistencia.values())})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@login_required
@user_passes_test(lambda user: user.role == "client")
def listar_tecnicos_cercanos(request):
    try:
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        
        if not lat or not lon:
            return JsonResponse({"status": "error", "message": "Faltan parámetros de latitud o longitud."}, status=400)

        locacion_cliente = (float(lat), float(lon))

        technicians = UserProfile.objects.filter(
            user__role="tech",
            estado_conexion="online",
            latitude__isnull=False,
            longitude__isnull=False
        )

        technician_distances = []
        for tecnico in technicians:
            locacion_tecnico = (float(tecnico.latitude), float(tecnico.longitude))
            distancia = geodesic(locacion_cliente, locacion_tecnico).km
            localizacion = distancia <= MAX_DISTANCE_KM

            technician_distances.append({
                'technician_id': tecnico.user.id,
                'technician_name': tecnico.full_name or tecnico.user.username,
                'distance_km': round(distancia, 2),
                'province_name': tecnico.province_name, 
                'latitude': tecnico.latitude,
                'longitude': tecnico.longitude,
                'localizacion': localizacion
            })

        return JsonResponse({"status": "success", "tecnicos_cercanos": technician_distances})
    
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    