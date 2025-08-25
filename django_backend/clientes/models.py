from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta

class Cliente(models.Model):
    """Modelo de Cliente siguiendo arquitectura MVC"""
    
    ESTADOS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
    ]
    
    ESTADOS_PAGO_CHOICES = [
        ('al_dia', 'Al día'),
        ('proximo_vencimiento', 'Próximo vencimiento'),
        ('vencido', 'Vencido'),
        ('corte_pendiente', 'Corte pendiente'),
    ]
    
    # Validadores
    cedula_validator = RegexValidator(
        regex=r'^\d{10}$',
        message='La cédula debe tener exactamente 10 dígitos numéricos.'
    )
    
    telefono_validator = RegexValidator(
        regex=r'^\d{10}$',
        message='El teléfono debe tener exactamente 10 dígitos numéricos.'
    )
    
    # Campos del modelo
    cedula = models.CharField(max_length=10, unique=True, validators=[cedula_validator])
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    tipo_plan = models.CharField(max_length=50)
    precio_plan = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_nacimiento = models.DateField()
    direccion = models.TextField()
    sector = models.CharField(max_length=100)
    email = models.EmailField()
    telefono = models.CharField(max_length=10, validators=[telefono_validator])
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CHOICES, default='activo')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-fecha_registro']
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.cedula}"
    
    @property
    def nombre_completo(self):
        """Obtener nombre completo del cliente"""
        return f"{self.nombres} {self.apellidos}"
    
    @property
    def edad(self):
        """Calcular edad del cliente"""
        today = timezone.now().date()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )
    
    @property
    def estado_pago(self):
        """Calcular estado de pago del cliente"""
        from .services import ClienteService
        return ClienteService.calcular_estado_pago(self)
    
    @property
    def meses_pendientes(self):
        """Calcular meses pendientes de pago"""
        from .services import ClienteService
        return ClienteService.calcular_meses_pendientes(self)
    
    @property
    def monto_total_deuda(self):
        """Calcular monto total de deuda"""
        from .services import ClienteService
        return ClienteService.calcular_deuda_total(self)
    
    def validar_cedula_ecuatoriana(self):
        """Validar cédula ecuatoriana"""
        from .services import ClienteService
        return ClienteService.validar_cedula_ecuatoriana(self.cedula)
    
    def validar_mayor_edad(self):
        """Validar que el cliente sea mayor de edad"""
        return self.edad >= 18
    
    def save(self, *args, **kwargs):
        """Override save para validaciones"""
        if not self.validar_cedula_ecuatoriana():
            raise ValueError("Cédula ecuatoriana inválida")
        
        if not self.validar_mayor_edad():
            raise ValueError("El cliente debe ser mayor de edad")
        
        super().save(*args, **kwargs)



