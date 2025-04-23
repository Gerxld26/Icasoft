from rest_framework import serializers

class SpeedTestSerializer(serializers.Serializer):
    """
    Serializador para los resultados de la prueba de velocidad
    """
    download_speed = serializers.FloatField(
        help_text="Velocidad de descarga en Mbps"
    )
    upload_speed = serializers.FloatField(
        help_text="Velocidad de subida en Mbps"
    )
    ping = serializers.FloatField(
        help_text="Latencia en milisegundos"
    )
    server = serializers.DictField(
        child=serializers.CharField(),
        help_text="Información del servidor de prueba"
    )
