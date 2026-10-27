from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import bcrypt
import secrets
import string
from datetime import datetime, timedelta


class UsuarioManager(BaseUserManager):
    def create_user(self, email=None, password=None, **extra_fields):
        username = extra_fields.pop('username', None)
        email = self.normalize_email(email or username or '')
        if not email:
            raise ValueError('El email es obligatorio')

        extra_fields.setdefault('nombre', extra_fields.get('nombre') or email)
        extra_fields.setdefault('rol', 'atencion_cliente')
        extra_fields.setdefault('activo', True)

        user = self.model(email=email, **extra_fields)
        if password:
            user.password = Usuario.hash_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault('rol', 'administrador')
        extra_fields.setdefault('activo', True)
        extra_fields.setdefault('nombre', extra_fields.get('nombre') or 'Admin')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser):
    """Usuario alineado a la tabla legacy `usuarios` (sin columnas de AbstractUser)."""

    ROLES_CHOICES = [
        ('administrador', 'Administrador'),
        ('economia', 'Economía'),
        ('atencion_cliente', 'Atención Cliente'),
    ]

    last_login = None
    password = models.CharField(max_length=255, db_column='password_hash')
    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=255)
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='atencion_cliente')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True, null=True, blank=True)
    reset_token = models.CharField(max_length=255, null=True, blank=True)
    reset_token_expires = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True, help_text="Última actividad del usuario para timeout de sesión")
    session_timeout_minutes = models.IntegerField(default=30, help_text="Tiempo de expire de sesión en minutos")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'rol']

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombre} ({self.email})"

    @property
    def is_active(self):
        return bool(self.activo)

    @property
    def is_staff(self):
        return self.rol == 'administrador'

    @property
    def is_superuser(self):
        return self.rol == 'administrador'

    def has_perm(self, perm, obj=None):
        return self.rol == 'administrador'

    def has_module_perms(self, app_label):
        return self.rol == 'administrador'

    @staticmethod
    def hash_password(password):
        """Hash de contraseña usando bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def verify_password(password, hashed):
        """Verificar contraseña"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def generate_reset_token(self):
        """Generar token de reset de contraseña"""
        token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        self.reset_token = token
        self.reset_token_expires = datetime.now() + timedelta(hours=24)
        self.save()
        return token

    def is_reset_token_valid(self, token):
        """Verificar si el token de reset es válido"""
        return (self.reset_token == token and
                self.reset_token_expires and
                self.reset_token_expires > datetime.now())

    def clear_reset_token(self):
        """Limpiar token de reset"""
        self.reset_token = None
        self.reset_token_expires = None
        self.save()
