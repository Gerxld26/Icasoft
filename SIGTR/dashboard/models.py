from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
import json
from datetime import datetime

class Diagnosis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diagnoses")
    timestamp = models.DateTimeField(auto_now_add=True)
    scan_type = models.CharField(max_length=20, default="QuickScan")
    
    # Datos CPU
    cpu_usage = models.CharField(max_length=10)
    cpu_temp = models.CharField(max_length=20, default="N/A")
    cpu_model = models.CharField(max_length=200, null=True, blank=True)
    cpu_cores = models.IntegerField(default=0)
    cpu_speed = models.CharField(max_length=20, null=True, blank=True)
    
    # Datos RAM
    ram_total = models.CharField(max_length=20)
    ram_used = models.CharField(max_length=20)
    ram_percent = models.CharField(max_length=10)
    ram_type = models.CharField(max_length=50, null=True, blank=True)
    ram_speed = models.CharField(max_length=20, null=True, blank=True)
    
    # Datos de disco
    disk_total = models.CharField(max_length=20)
    disk_used = models.CharField(max_length=20)
    disk_free = models.CharField(max_length=20)
    disk_percent = models.CharField(max_length=10)
    disk_type = models.CharField(max_length=50, null=True, blank=True)
    disk_model = models.CharField(max_length=200, null=True, blank=True)
    disk_health = models.CharField(max_length=20, null=True, blank=True)
    
    # Datos de red
    network_sent = models.CharField(max_length=20, default="N/A")
    network_recv = models.CharField(max_length=20, default="N/A")
    network_speed = models.CharField(max_length=20, null=True, blank=True)
    network_adapter = models.CharField(max_length=200, null=True, blank=True)
    
    # Datos de GPU
    gpu_name = models.CharField(max_length=100, null=True, blank=True)
    gpu_driver = models.CharField(max_length=50, null=True, blank=True)
    gpu_memory = models.CharField(max_length=20, null=True, blank=True)
    gpu_usage = models.CharField(max_length=10, null=True, blank=True)
    gpu_temperature = models.CharField(max_length=10, null=True, blank=True)
    
    # Sistema operativo
    os_name = models.CharField(max_length=100, null=True, blank=True)
    os_version = models.CharField(max_length=50, null=True, blank=True)
    os_build = models.CharField(max_length=50, null=True, blank=True)
    
    # Estado general
    overall_status = models.CharField(max_length=20, default="Normal")
    issues_count = models.IntegerField(default=0)
    warnings_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Diagnóstico de {self.user.username} - {self.timestamp}"

class DiagnosticReport(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.CASCADE, related_name='reports')
    start_time = models.DateTimeField(auto_now_add=True)
    completion_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="Pendiente")
    progress = models.IntegerField(default=0)
    current_component = models.CharField(max_length=50, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"Reporte {self.id} - {self.status}"
    
    def get_completion_time_str(self):
        if self.completion_time:
            return self.completion_time.strftime('%Y-%m-%d %H:%M')
        return "No finalizado"
    
    def get_duration(self):
        if self.completion_time:
            duration = self.completion_time - self.start_time
            return duration.total_seconds()
        return 0

class SystemComponent(models.Model):
    COMPONENT_TYPES = [
        ('CPU', 'Procesador'),
        ('RAM', 'Memoria RAM'),
        ('DISK', 'Disco duro'),
        ('NETWORK', 'Red'),
        ('GPU', 'Tarjeta gráfica'),
        ('BATTERY', 'Batería'),
        ('ADAPTER', 'Adaptador'),
        ('DRIVER', 'Controlador'),
        ('SOFTWARE', 'Software'),
        ('SECURITY', 'Seguridad'),
        ('OTHER', 'Otro')
    ]
    
    STATUS_CHOICES = [
        ('NORMAL', 'Normal'),
        ('WARNING', 'Advertencia'),
        ('CRITICAL', 'Crítico'),
        ('ERROR', 'Error'),
        ('UNKNOWN', 'Desconocido')
    ]
    
    report = models.ForeignKey(DiagnosticReport, on_delete=models.CASCADE, related_name='components')
    type = models.CharField(max_length=20, choices=COMPONENT_TYPES, default='OTHER')
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNKNOWN')
    details = models.JSONField(default=dict)
    recommendations = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} - {self.status}"
    
    def get_details_as_dict(self):
        if isinstance(self.details, str):
            try:
                return json.loads(self.details)
            except:
                return {}
        return self.details

class DriverInfo(models.Model):
    STATUS_CHOICES = [
        ('UPDATED', 'Actualizado'),
        ('OUTDATED', 'Desactualizado'),
        ('MISSING', 'Faltante'),
        ('INCOMPATIBLE', 'Incompatible'),
        ('UNKNOWN', 'Desconocido')
    ]
    
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.CASCADE, related_name='drivers')
    name = models.CharField(max_length=200)
    device = models.CharField(max_length=200)
    current_version = models.CharField(max_length=50)
    latest_version = models.CharField(max_length=50, null=True, blank=True)
    date_installed = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNKNOWN')
    
    def __str__(self):
        return f"{self.device} - {self.name}"

class DiagnosticIssue(models.Model):
    SEVERITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Crítica')
    ]
    
    TYPE_CHOICES = [
        ('HARDWARE', 'Hardware'),
        ('DRIVER', 'Controlador'),
        ('SOFTWARE', 'Software'),
        ('SECURITY', 'Seguridad'),
        ('PERFORMANCE', 'Rendimiento'),
        ('OTHER', 'Otro')
    ]
    
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.CASCADE, related_name='issues')
    component = models.CharField(max_length=100)
    issue_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='OTHER')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    description = models.TextField()
    recommendation = models.TextField()
    is_resolved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.component} - {self.issue_type} ({self.severity})"

class DiagnosticScenario(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon_class = models.CharField(max_length=50, default="fa-solid fa-laptop-code")
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class ScenarioRun(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    scenario = models.ForeignKey(DiagnosticScenario, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    results = models.JSONField(default=dict)
    issues_found = models.IntegerField(default=0)
    recommendations = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.scenario.name} para {self.user.username} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    def get_results_as_dict(self):
        if isinstance(self.results, str):
            try:
                return json.loads(self.results)
            except:
                return {}
        return self.results

class LearningVideo(models.Model):
    title = models.CharField(max_length=255, verbose_name="Título del Video")
    description = models.TextField(verbose_name="Descripción", blank=True)
    youtube_url = models.URLField(verbose_name="URL de YouTube")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    def get_embed_url(self):
        """
        Devuelve la URL de embed para YouTube.
        """
        if "youtube.com" in self.youtube_url:
            video_id = self.youtube_url.split("v=")[-1].split("&")[0]
            return f"https://www.youtube.com/embed/{video_id}"
        elif "youtu.be" in self.youtube_url:
            video_id = self.youtube_url.split("/")[-1]
            return f"https://www.youtube.com/embed/{video_id}"
        return self.youtube_url