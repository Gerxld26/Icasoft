from django.db import models
from users.models import User, UserProfile
from geopy.distance import geodesic  # Para calcular distancias entre cliente y técnicos

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Abierto'),
        ('in_progress', 'En Progreso'),
        ('resolved', 'Resuelto'),
        ('closed', 'Cerrado'),
        ('pending_assignment', 'Pendiente de Asignación'),
    ]

    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    client = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,  
        related_name='tickets_created'
    )
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='tickets_assigned'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Agregar las coordenadas de ubicación
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    class Meta:
        db_table = 'tickets_ticket'  

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Tag(models.Model):
    """
    Modelo para etiquetas asociadas a tickets.
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="Etiqueta")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    class Meta:
        ordering = ['name']
        verbose_name = "Etiqueta"
        verbose_name_plural = "Etiquetas"
        db_table = 'tickets_tag' 
        
    def __str__(self):
        return self.name
