from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('username')

        try:
            # Intenta autenticar con el correo
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            try:
                # Si no se encuentra, intenta con el nombre de usuario
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Verifica la contraseña
        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
