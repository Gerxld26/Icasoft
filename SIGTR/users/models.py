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
    role = models.CharField(max_length=10, choices=ROLES, default='client')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    can_add_admin = models.BooleanField(default=False)  # Indica si el usuario puede agregar otros admins

    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

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

    photo = models.ImageField(upload_to="profiles/", blank=True, null=True)
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