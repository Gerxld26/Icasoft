import speedtest
import logging
import platform
import psutil
import speedtest
import socket

logger = logging.getLogger(__name__)

def get_network_info():
    """
    Obtener información detallada de la red
    """
    try:
        # Obtener nombre del host e IP
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        
        return {
            'hostname': hostname,
            'ip_address': ip_address
        }
    except Exception as e:
        logger.error(f"Error obteniendo información de red: {str(e)}")
        return {
            'hostname': 'Desconocido',
            'ip_address': 'N/A'
        }

def perform_speed_test():
    """
    Realiza una prueba de velocidad utilizando speedtest-cli
    
    Returns:
        dict: Resultados de la prueba de velocidad
    """
    try:
        # Iniciar speedtest
        st = speedtest.Speedtest()
        
        # Obtener mejor servidor
        server = st.get_best_server()
        
        # Medir velocidad de descarga
        st.download()
        download_speed = st.results.download / 1_000_000 
        
        # Medir velocidad de subida
        st.upload()
        upload_speed = st.results.upload / 1_000_000  
        
        # Obtener ping
        ping = st.results.ping
        
        # Obtener información de red
        network_info = get_network_info()
        
        return {
            'download_speed': round(download_speed, 2),
            'upload_speed': round(upload_speed, 2),
            'ping': round(ping, 2),
            'server': {
                'name': server.get('sponsor', 'Desconocido'),
                'location': server.get('name', 'Sin ubicación')
            },
            'network': network_info
        }
    except Exception as e:
        logger.error(f"Error en prueba de velocidad: {str(e)}")
        return {
            'error': str(e)
        }