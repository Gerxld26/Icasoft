from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("El correo electrónico es obligatorio")
        if not username:
            raise ValueError("El nombre de usuario es obligatorio")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("can_add_admin", True)  

        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True.")
        if extra_fields.get("role") not in ["admin", "superadmin"]:
            raise ValueError("El superusuario debe tener el rol 'admin' o 'superadmin'.")

        return self.create_user(email, username, password, **extra_fields)

# Custom User Model
class User(AbstractBaseUser, PermissionsMixin):
    ROLES = (
        ('admin', 'Administrador'),
        ('tech', 'Técnico'),
        ('client', 'Cliente'),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True) # va a jalar de la bd esto, obtener los valores de la bd
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    telefono = models.CharField(max_length=9, null=True)
    role = models.CharField(max_length=10, choices=ROLES, default='client')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    can_add_admin = models.BooleanField(default=False)  # Indica si el usuario puede agregar otros admins

    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'telefono']

    def __str__(self):
        return self.email

# Extended Profile Model
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    ROLE_CHOICES = [
        ('client', 'Cliente'),
        ('technician', 'Técnico'),
        ('admin', 'Administrador'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="client")

    # Datos personales (comunes a todos)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True, verbose_name="Dirección")

    # Ahora también los admins tienen dirección y coordenadas
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    # Datos de ubicación general (comunes)
    country_name = models.CharField(max_length=100, blank=True, null=True)
    department_name = models.CharField(max_length=100, blank=True, null=True)
    province_name = models.CharField(max_length=100, blank=True, null=True)
    district_name = models.CharField(max_length=100, blank=True, null=True)

    # Exclusivo para Técnicos
    certifications = models.TextField(blank=True, null=True)
    schedule_start = models.TimeField(blank=True, null=True)
    schedule_end = models.TimeField(blank=True, null=True)
    specialty = models.CharField(max_length=255, blank=True, null=True)

    # Estado de conexión para Técnicos
    estado_conexion = models.CharField(max_length=10, choices=[('online', 'En Línea'), ('offline', 'Fuera de Línea')], default='offline')

    photo = models.ImageField(upload_to="dashboard/img/tecnico/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


# Ticket Model
class Ticket(models.Model):
    STATUS_CHOICES = (
        ('open', 'Abierto'),
        ('in_progress', 'En Progreso'),
        ('resolved', 'Resuelto'),
        ('closed', 'Cerrado'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='low')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_tickets')
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"
    
    
class Categoria(models.Model):
    idCategoria = models.AutoField(primary_key=True)
    nombreCategoria = models.CharField(max_length=100)
    estadoCategoria = models.BooleanField(default=True)
    fechaCreacionCategoria = models.DateTimeField(auto_now_add=True)
    fechaModificacionCategoria = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombreCategoria

class Producto(models.Model):
    idProducto = models.AutoField(primary_key=True)
    nombreProducto = models.CharField(max_length=200)
    descripcionProducto = models.TextField()
    stock = models.IntegerField(default=0)
    precioVenta = models.DecimalField(max_digits=10, decimal_places=2)
    precioCompra = models.DecimalField(max_digits=10, decimal_places=2)
    estadoProducto = models.BooleanField(default=True)
    fechaCaducidad = models.DateField(null=True, blank=True)
    fechaCreacionProducto = models.DateTimeField(auto_now_add=True)
    fechaModificacionProducto = models.DateTimeField(auto_now=True)
    idCategoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    imagenProducto = models.ImageField(upload_to='productos/', null=True, blank=True)

    def __str__(self):
        return self.nombreProducto

class Carrito(models.Model):
    idCarrito = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(User, on_delete=models.CASCADE)
    precioConImpuesto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cantidadSeleccionada = models.IntegerField(default=0)
    idProducto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    fechaCreacion = models.DateTimeField(auto_now_add=True)
    fechaModificacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrito de {self.idUsuario.username}"

class RegistroVenta(models.Model):
    ESTADO_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    )
    
    idRegistroVenta = models.AutoField(primary_key=True)
    serieVenta = models.CharField(max_length=50)
    numVenta = models.CharField(max_length=50)
    horaVenta = models.TimeField(auto_now_add=True)
    igv = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    numCuotas = models.IntegerField(default=1)
    subTotal = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    totalVenta = models.DecimalField(max_digits=10, decimal_places=2)
    estadoVenta = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    fechaCreacionVenta = models.DateTimeField(auto_now_add=True)
    fechaModificacionVenta = models.DateTimeField(auto_now=True)
    idUsuario = models.ForeignKey(User, on_delete=models.CASCADE)
    idTipoComprobante = models.ForeignKey('TipoComprobante', on_delete=models.CASCADE)
    idMetodoPago = models.ForeignKey('MetodoPago', on_delete=models.CASCADE)

    def __str__(self):
        return f"Venta {self.serieVenta}-{self.numVenta}"

class DetalleVenta(models.Model):
    idDetalleVenta = models.AutoField(primary_key=True)
    cantidad = models.IntegerField()
    precioTotalProducto = models.DecimalField(max_digits=10, decimal_places=2)
    idProducto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    idRegistroVenta = models.ForeignKey(RegistroVenta, on_delete=models.CASCADE)

    def __str__(self):
        return f"Detalle {self.idRegistroVenta.serieVenta}-{self.idRegistroVenta.numVenta} - {self.idProducto.nombreProducto}"

class Ubicacion(models.Model):
    idUbicacion = models.AutoField(primary_key=True)
    direccion = models.TextField()
    tiempoEstimadoEntrega = models.IntegerField(help_text="Tiempo en días")
    estadoUbicacion = models.BooleanField(default=True)
    fechaCreacionUbicacion = models.DateTimeField(auto_now_add=True)
    fechaModificacionUbicacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.direccion

class TipoComprobante(models.Model):
    idTipoComprobante = models.AutoField(primary_key=True)
    nombreComprobante = models.CharField(max_length=100)
    estadoComprobante = models.BooleanField(default=True)
    fechaCreacionComprobante = models.DateTimeField(auto_now_add=True)
    fechaModificacionComprobante = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombreComprobante

class MetodoPago(models.Model):
    idMetodoPago = models.AutoField(primary_key=True)
    nombreMetodo = models.CharField(max_length=100)
    descripcionMetodo = models.TextField()
    estadoMetodoPago = models.BooleanField(default=True)
    fechaCreacionPago = models.DateTimeField(auto_now_add=True)
    fechaModificacionPago = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombreMetodo

class Entrega(models.Model):
    ESTADO_CHOICES = (
        ('preparado', 'Preparado'),
        ('en_camino', 'En Camino'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    )
    
    idEntrega = models.AutoField(primary_key=True)
    fechaPreparado = models.DateTimeField(null=True, blank=True)
    fechaEntrega = models.DateTimeField(null=True, blank=True)
    estadoEntrega = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='preparado')
    idRegistroVenta = models.ForeignKey(RegistroVenta, on_delete=models.CASCADE)
    idUbicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE)

    def __str__(self):
        return f"Entrega para venta {self.idRegistroVenta.serieVenta}-{self.idRegistroVenta.numVenta}"

class CompraRecurrente(models.Model):
    idCompraRecurrente = models.AutoField(primary_key=True)
    cantidadComprado = models.IntegerField(default=1)
    nombreCompra = models.CharField(max_length=200)
    fechaCreacionRecurrente = models.DateTimeField(auto_now_add=True)
    fechaModificacionRecurrente = models.DateTimeField(auto_now=True)
    idRegistroVenta = models.ForeignKey(RegistroVenta, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombreCompra
    
class TipoAsistenciaManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status='open')

class TipoAsistencia(models.Model):
    STATUS_CHOICES = (
        ('open', 'Activo'),
        ('closed', 'Eliminado'),
    )

    tipo_asistencia = models.CharField(max_length=30, unique=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TipoAsistenciaManager()    
    all_objects = models.Manager()          

    class Meta:
        db_table = 'users_asistencia'
        verbose_name = "Tipo de Asistencia"
        verbose_name_plural = "Tipos de Asistencia"
        ordering = ['tipo_asistencia']

    def __str__(self):
        return f"{self.tipo_asistencia} ({self.get_status_display()})"

    def soft_delete(self):
        self.status = 'closed'
        self.save()

    def restore(self):
        self.status = 'open'
        self.save()