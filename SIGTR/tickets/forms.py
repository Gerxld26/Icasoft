from django import forms
from tickets.models import Ticket

class TicketForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = ["title", "description"]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 4}),
        }

class TicketRequestForm(forms.ModelForm):
    """
    Formulario para que los clientes soliciten asistencia técnica.
    """
    address = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Dirección exacta"}),
        label="Dirección"
    )
    latitude = forms.DecimalField(
        required=True,
        max_digits=12, decimal_places=8,  # 🔥 Ajustamos la precisión para evitar errores
        widget=forms.HiddenInput()
    )
    longitude = forms.DecimalField(
        required=True,
        max_digits=12, decimal_places=8,  # 🔥 Ajustamos la precisión para evitar errores
        widget=forms.HiddenInput()
    )

    class Meta:
        model = Ticket
        fields = ["title", "description", "address", "latitude", "longitude"]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Título del problema"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 4, "placeholder": "Describe tu problema"}),
        }