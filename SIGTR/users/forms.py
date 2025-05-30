from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, label="Correo Electrónico")
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2', 'telefono']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.role = 'client'  
        if commit:
            user.save()
        return user


