# Proyecto IcasoftIA

## Descripción
ICASOFT IA es un proyecto que utiliza varias bibliotecas de Python para proporcionar funcionalidades como analisis de tus componentes, geolocalización, utilidades de GPU y más.

## Requisitos
El proyecto requiere los siguientes paquetes de Python:
- Django==5.1.4
- Flask==3.1.0
- geopy==2.4.1
- GPUtil==1.4.0
- openai==1.61.0
- psutil==6.1.1
- py_cpuinfo==9.0.0
- python-decouple==3.8
- Requests==2.32.3
- WMI==1.5.1

## Instalación
Para instalar los paquetes requeridos, ejecute:
```bash
pip install -r requirements.txt
python manage.py shell: ingresar a la consola del yango.
1- python manage.py makemigrations
2-  python manage.py migrate :pasar a la bd.
```

## Uso
1. Asegúrese de que todos los paquetes requeridos estén instalados.
2. Ejecute su aplicación Django o Flask según sea necesario.
3. Utilice las otras bibliotecas (geopy, GPUtil, openai, etc.) según los requisitos de su proyecto.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT.

## Desarrollador
Gerald Atuncar Flores.

## Dashboard:
views: ahí se define las rutas para que se puedan visualizar los diseños y funcionamiento.
urls: se define las vistas.
templates: se ubica los htmls.

## DATOS LIBRERÍA:
el cpuinfo trae toda la data referente.
## DATOS CSS: 
display:
grid: ancho fijo
flex: sin ancho fijo