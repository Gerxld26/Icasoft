from django.db import models
from django.conf import settings  
from django.core.exceptions import ValidationError

class Diagnosis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diagnoses")
    timestamp = models.DateTimeField(auto_now_add=True)
    cpu_usage = models.CharField(max_length=10)
    ram_total = models.CharField(max_length=20)
    ram_used = models.CharField(max_length=20)
    ram_percent = models.CharField(max_length=10)
    disk_total = models.CharField(max_length=20)
    disk_used = models.CharField(max_length=20)
    disk_free = models.CharField(max_length=20)
    disk_percent = models.CharField(max_length=10)
    gpu_name = models.CharField(max_length=100, null=True, blank=True)
    gpu_usage = models.CharField(max_length=10, null=True, blank=True)
    gpu_temperature = models.CharField(max_length=10, null=True, blank=True)

    def __str__(self):
        return f"Diagnóstico de {self.user.username} - {self.timestamp}"
    
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