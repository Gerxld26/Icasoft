from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth import get_user_model
import logging

User = get_user_model()

logger = logging.getLogger(__name__)
from .models import Ticket
from .forms import TicketRequestForm
from users.models import UserProfile
from geopy.distance import geodesic
from django.contrib import messages
from django.http import JsonResponse, HttpResponseNotAllowed

@login_required
@user_passes_test(lambda user: user.role == "client")
def request_assistance(request):
    if request.method == "POST":
        form = TicketRequestForm(request.POST)
        if form.is_valid():
            ticket = form.save(commit=False)
            ticket.client = request.user
            assigned_tech = assign_nearest_technician(ticket)
            ticket.assigned_to = assigned_tech if assigned_tech else None
            ticket.save()

            return JsonResponse({
                "status": "success",
                "message": "¡Solicitud enviada correctamente!",
                "redirect_url": reverse('client_diagnosis')  
            })
        return JsonResponse({
            "status": "error",
            "message": "Error en el formulario",
            "errors": form.errors
        })
    
    # Obtener técnicos online más cercanos
    ticket = Ticket()  
    client_location = (ticket.latitude, ticket.longitude)  

    # Filtrar técnicos online
    technicians = UserProfile.objects.filter(
        user__role="tech", estado_conexion="online", latitude__isnull=False, longitude__isnull=False
    )

    technician_distances = []
    for tech in technicians:
        tech_location = (tech.latitude, tech.longitude)
        distance = geodesic(client_location, tech_location).km
        technician_distances.append({
            'technician': tech.user,
            'distance': round(distance, 2), 
            'district_name': tech.district_name  
        })

    technician_distances = sorted(technician_distances, key=lambda x: x['distance'])

    return render(request, 'tickets/request_assistance.html', {
        'form': TicketRequestForm(),
        'technicians': technician_distances
    })
    
    
    
def assign_nearest_technician(ticket):
    """
    Encuentra y retorna el técnico más cercano al cliente, solo considerando técnicos 'online'.
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
        tech_location = (tech.latitude, tech.longitude)
        client_location = (ticket.latitude, ticket.longitude)
        distance = geodesic(client_location, tech_location).km

        if distance < min_distance:
            min_distance = distance
            nearest_technician = tech.user

    return nearest_technician

@login_required
@user_passes_test(lambda user: user.role == "client")
def assign_selected_technician(request, ticket_id):
    ticket = Ticket.objects.get(id=ticket_id)

    if request.method == "POST":
        technician_id = request.POST.get("technician")
        technician = User.objects.get(id=technician_id)

        # Asignar el técnico seleccionado al ticket
        ticket.assigned_to = technician
        ticket.save()

        return redirect('ticket_detail', ticket_id=ticket.id)

    return redirect('choose_technician', ticket_id=ticket.id)