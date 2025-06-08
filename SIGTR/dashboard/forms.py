from django import forms
from users.models import User, UserProfile
from django.contrib.auth.forms import UserCreationForm
from .models import LearningVideo
from tickets.models import Ticket
import re
from users.models import Producto, Categoria

# FORMULARIO PARA TÉCNICOS
class CreateTechForm(forms.ModelForm):
    full_name = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Nombre Completo")
    phone_number = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Número de Teléfono")
    address = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Dirección")

    latitude = forms.DecimalField(required=True, widget=forms.NumberInput(attrs={'class': 'form-control'}), label="Latitud")
    longitude = forms.DecimalField(required=True, widget=forms.NumberInput(attrs={'class': 'form-control'}), label="Longitud")

    specialty = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Especialidad")
    certifications = forms.CharField(required=False, widget=forms.Textarea(attrs={'class': 'form-control'}), label="Certificaciones")

    schedule_start = forms.TimeField(
        widget=forms.TimeInput(format='%H:%M', attrs={'class': 'form-control', 'type': 'time'}),
        label="Hora de Inicio",
        required=True
    )
    schedule_end = forms.TimeField(
        widget=forms.TimeInput(format='%H:%M', attrs={'class': 'form-control', 'type': 'time'}),
        label="Hora de Fin",
        required=True
    )

    photo = forms.ImageField(
        required=False,
        label="Foto",
        widget=forms.FileInput(attrs={'class': 'form-control'})
    )
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'password': forms.PasswordInput(attrs={'class': 'form-control'}),
        }
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        user.role = 'tech' 
        user.is_staff = True

        if commit:
            user.save()

            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = "technician"
            profile.full_name = self.cleaned_data.get("full_name")
            profile.phone_number = self.cleaned_data.get("phone_number")
            profile.address = self.cleaned_data.get("address")
            profile.latitude = self.cleaned_data.get("latitude")
            profile.longitude = self.cleaned_data.get("longitude")
            profile.specialty = self.cleaned_data.get("specialty")
            profile.certifications = self.cleaned_data.get("certifications")
            profile.schedule_start = self.cleaned_data.get("schedule_start")
            profile.schedule_end = self.cleaned_data.get("schedule_end")
            profile.photo = self.cleaned_data.get("photo")
            profile.save()

        return user


# FORMULARIO PARA ADMINISTRADORES
class CreateAdminForm(forms.ModelForm):
    full_name = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Nombre Completo")
    phone_number = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Número de Teléfono")
    address = forms.CharField(required=True, widget=forms.TextInput(attrs={'class': 'form-control'}), label="Dirección")

    latitude = forms.DecimalField(required=True, widget=forms.NumberInput(attrs={'class': 'form-control'}), label="Latitud")
    longitude = forms.DecimalField(required=True, widget=forms.NumberInput(attrs={'class': 'form-control'}), label="Longitud")

    can_add_admin = forms.BooleanField(
        required=False,
        label="¿Puede agregar otros administradores?",
        initial=False,
        help_text="Marcar si este administrador podrá agregar otros administradores.",
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'can_add_admin', 'full_name', 'phone_number', 'address', 'latitude', 'longitude']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'password': forms.PasswordInput(attrs={'class': 'form-control'}),
        }

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        user.role = 'admin'  # Asegurar que el usuario es admin
        user.is_staff = True
        user.is_superuser = True
        user.can_add_admin = self.cleaned_data['can_add_admin']

        if commit:
            user.save()
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = "admin"
            profile.full_name = self.cleaned_data.get("full_name")
            profile.phone_number = self.cleaned_data.get("phone_number")
            profile.address = self.cleaned_data.get("address")
            profile.latitude = self.cleaned_data.get("latitude")
            profile.longitude = self.cleaned_data.get("longitude")
            profile.save()

        return user

# FORMULARIO PARA CLIENTES
class CustomUserCreationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label="Contraseña", required=True)
    email = forms.EmailField(required=True, label="Correo Electrónico")
    username = forms.CharField(required=True,  widget=forms.TextInput(attrs={'autocomplete': 'off'}))
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'telefono', 'password']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control' 
            field.widget.attrs['autocomplete'] = 'off'

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password']) 
        user.email = self.cleaned_data['email']
        user.telefono = self.cleaned_data['telefono']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.role = 'client'
        if commit:
            user.save()
        return user
    
# FORMULARIO PARA VIDEOS DE APRENDIZAJE

class LearningVideoForm(forms.ModelForm):
    class Meta:
        model = LearningVideo
        fields = ['title', 'description', 'youtube_url']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'youtube_url': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def clean_youtube_url(self):
        """
        Valida y procesa el campo `youtube_url` para aceptar:
        - URLs estándar de YouTube.
        - Códigos `iframe`.
        """
        youtube_url = self.cleaned_data['youtube_url'].strip()

        if youtube_url.startswith("<iframe") and youtube_url.endswith("</iframe>"):
            match = re.search(r'src=["\'](.*?)["\']', youtube_url)
            if match:
                return match.group(1)
            else:
                raise forms.ValidationError("El código iframe proporcionado no es válido.")

        elif "youtube.com/watch?v=" in youtube_url or "youtu.be/" in youtube_url:
            return youtube_url

        raise forms.ValidationError("Proporcione una URL válida de YouTube o un código iframe.")


# FORMULARIO PARA USUARIOS (PERFILES)

class UserProfileForm(forms.ModelForm):
    schedule_start = forms.TimeField(
        widget=forms.TimeInput(format='%H:%M', attrs={'class': 'form-control', 'type': 'time'}),
        label="Hora de Inicio"
    )
    schedule_end = forms.TimeField(
        widget=forms.TimeInput(format='%H:%M', attrs={'class': 'form-control', 'type': 'time'}),
        label="Hora de Fin"
    )

    class Meta:
        model = UserProfile
        fields = [
            'full_name', 'phone_number', 'address', 'latitude', 'longitude',
            'country_name', 'department_name', 'province_name', 'district_name',
            'certifications', 'schedule_start', 'schedule_end', 'specialty', 'photo'
        ]
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-control'}),
            'phone_number': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.TextInput(attrs={'class': 'form-control'}),
            'latitude': forms.NumberInput(attrs={'class': 'form-control'}),
            'longitude': forms.NumberInput(attrs={'class': 'form-control'}),
            'photo': forms.FileInput(attrs={'class': 'form-control'}),
        }


# FORMULARIO PARA ESTADOS DE TICKET

class TicketStatusForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = ['status']
        widgets = {
            'status': forms.Select(attrs={'class': 'form-control'}),
        }

#Carrito de compras

class ProductoForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = ['nombreProducto', 'descripcionProducto', 'stock', 
                'precioVenta', 'precioCompra', 'estadoProducto', 
                'fechaCaducidad', 'idCategoria', 'imagenProducto']
        widgets = {
            'fechaCaducidad': forms.DateInput(attrs={'type': 'date'}),
            'descripcionProducto': forms.Textarea(attrs={'rows': 3}),
        }

class CategoriaForm(forms.ModelForm):
    class Meta:
        model = Categoria
        fields = ['nombreCategoria', 'estadoCategoria']