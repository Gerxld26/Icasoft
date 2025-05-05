from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth import get_user_model
import logging
import json

User = get_user_model()

logger = logging.getLogger(__name__)
from .models import Ticket
from .forms import TicketRequestForm
from users.models import UserProfile
from geopy.distance import geodesic
from django.http import JsonResponse, HttpResponseNotAllowed

# Definir constantes para la lógica de proximidad - Un solo límite
MAX_DISTANCE_KM = 20  # Distancia máxima para considerar a un técnico como "cercano" y permitir crear tickets
@login_required
@user_passes_test(lambda user: user.role == "client")
def asistencia(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Datos inválidos."}, status=400)

        required_fields = ["descripcion", "latitud", "longitud", "tecnico"]
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
                    "message": f"El técnico seleccionado está a {distance:.1f} km, lo cual excede el límite permitido de {MAX_DISTANCE_KM} km."
                })

            # Crear el ticket
            ticket = Ticket.objects.create(
                client=request.user,
                assigned_to=technician,
                description=data["descripcion"],
                latitude=latitude,
                longitude=longitude
            )

            return JsonResponse({
                "status": "success",
                "message": "¡Solicitud enviada correctamente!",
            })

        except User.DoesNotExist:
            return JsonResponse({
                "status": "error",
                "message": "El técnico seleccionado no existe."
            })

        except UserProfile.DoesNotExist:
            return JsonResponse({
                "status": "error",
                "message": "El técnico no tiene un perfil válido."
            })

        except Exception as e:
            logger.error(f"Error en la creación del ticket: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Ocurrió un error al procesar tu solicitud."
            })


@login_required
@user_passes_test(lambda user: user.role == "client")
def get_nearby_technicians_view(request):
    """
    Endpoint AJAX para obtener técnicos cercanos a una ubicación específica
    """
    if request.method != "GET":
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        lat = float(request.GET.get('lat', 0))
        lon = float(request.GET.get('lon', 0))
        
        client_location = (lat, lon)
        technicians_data = get_nearby_technicians_list(client_location)
        
        # Formatear para la respuesta JSON
        technicians_list = []
        for tech in technicians_data:
            technicians_list.append({
                'id': tech['technician'].id,
                'username': tech['technician'].username,
                'distance': tech['distance'],
                'district_name': tech['district_name'],
                'latitude': float(tech['latitude']),
                'longitude': float(tech['longitude']),
                'is_nearby': tech['is_nearby']
            })
        
        return JsonResponse({
            'technicians': technicians_list,
            'has_nearby_technicians': any(tech['is_nearby'] for tech in technicians_list),
            'max_distance': MAX_DISTANCE_KM
        })
    except Exception as e:
        logger.error(f"Error al obtener técnicos cercanos: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

def get_nearby_technicians_list(client_location):
    """
    Función auxiliar para obtener técnicos cercanos
    Clasifica los técnicos como "cercanos" si están dentro de la distancia máxima
    """
    # Filtrar técnicos online
    technicians = UserProfile.objects.filter(
        user__role="tech", estado_conexion="online", latitude__isnull=False, longitude__isnull=False
    )

    technician_distances = []
    for tech in technicians:
        try:
            tech_location = (float(tech.latitude), float(tech.longitude))
            distance = geodesic(client_location, tech_location).km
            
            # Determinar si el técnico está realmente cerca
            is_nearby = distance <= MAX_DISTANCE_KM
            
            technician_distances.append({
                'technician': tech.user,
                'distance': round(distance, 2), 
                'district_name': tech.district_name or "Desconocido",
                'latitude': tech.latitude,
                'longitude': tech.longitude,
                'is_nearby': is_nearby
            })
        except (ValueError, TypeError) as e:
            logger.error(f"Error al calcular distancia para técnico {tech.user.username}: {str(e)}")
            continue

    # Ordenar por distancia
    return sorted(technician_distances, key=lambda x: x['distance'])
    
def assign_nearest_technician(ticket):
    """
    Encuentra y retorna el técnico más cercano al cliente, solo considerando técnicos 'online'.
    Aplica la lógica de distancia máxima.
    """
    if not ticket.latitude or not ticket.longitude:
        return None

    # Filtrar técnicos que estén online y tengan coordenadas
    technicians = UserProfile.objects.filter(
        user__role="tech", 
        estado_conexion="online",  
        latitude__isnull=False, 
        longitude__isnull=False
    )

    nearest_technician = None
    min_distance = float("inf")

    for tech in technicians:
        try:
            tech_location = (float(tech.latitude), float(tech.longitude))
            client_location = (float(ticket.latitude), float(ticket.longitude))
            distance = geodesic(client_location, tech_location).km

            # Solo considerar técnicos que estén dentro del límite permitido
            if distance < min_distance and distance <= MAX_DISTANCE_KM:
                min_distance = distance
                nearest_technician = tech.user
        except (ValueError, TypeError) as e:
            logger.error(f"Error al calcular distancia para técnico {tech.user.username}: {str(e)}")
            continue

    # Si no se encontró un técnico dentro del límite permitido, return None
    if not nearest_technician:
        logger.warning(f"No se encontró ningún técnico dentro del límite permitido de {MAX_DISTANCE_KM} km")
    
    return nearest_technician

@login_required
@user_passes_test(lambda user: user.role == "client")
def assign_selected_technician(request, ticket_id):
    try:
        ticket = Ticket.objects.get(id=ticket_id, client=request.user)

        if request.method == "POST":
            technician_id = request.POST.get("technician")
            try:
                technician = User.objects.get(id=technician_id, role="tech")
                tech_profile = UserProfile.objects.get(user=technician)
                
                # Verificar la distancia
                client_location = (float(ticket.latitude), float(ticket.longitude))
                tech_location = (float(tech_profile.latitude), float(tech_profile.longitude))
                distance = geodesic(client_location, tech_location).km
                
                if distance > MAX_DISTANCE_KM:
                    messages.error(request, f"El técnico seleccionado está a {distance:.1f} km de distancia, lo cual excede el límite permitido de {MAX_DISTANCE_KM} km.")
                    return redirect('client_tickets')
                
                # Asignar el técnico seleccionado al ticket
                ticket.assigned_to = technician
                ticket.save()
                
                messages.success(request, f"Técnico {technician.username} asignado correctamente al ticket.")
                return redirect('ticket_detail', ticket_id=ticket.id)
            except User.DoesNotExist:
                messages.error(request, "El técnico seleccionado no existe.")
            except UserProfile.DoesNotExist:
                messages.error(request, "El técnico seleccionado no tiene un perfil válido.")
            except Exception as e:
                logger.error(f"Error al asignar técnico: {str(e)}")
                messages.error(request, "Error al procesar la solicitud. Por favor, inténtelo de nuevo.")
    except Ticket.DoesNotExist:
        messages.error(request, "El ticket solicitado no existe o no tienes permisos para verlo.")
    
    return redirect('client_tickets')