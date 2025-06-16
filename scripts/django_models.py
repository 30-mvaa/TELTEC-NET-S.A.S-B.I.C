# Modelos Django para TelTec Net
# Este archivo muestra cómo serían los modelos en Django

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from datetime import date

class Usuario(AbstractUser):
    ROLES = [
        ('administrador', 'Administrador'),
        ('economia', 'Economía'),
        ('atencion_cliente', 'Atención al Cliente'),
    ]
    
    rol = models.CharField(max_length=20, choices=ROLES)
    nombre = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.rol})"

class Cliente(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
    ]
    
    PLANES = [
        ('Básico 10MB', 'Básico 10MB'),
        ('Estándar 25MB', 'Estándar 25MB'),
        ('Premium 50MB', 'Premium 50MB'),
        ('Ultra 100MB', 'Ultra 100MB'),
    ]
    
    cedula_validator = RegexValidator(
        regex=r'^\d{10}$',
        message='La cédula debe tener 10 dígitos'
    )
    
    telefono_validator = RegexValidator(
        regex=r'^09\d{8}$',
        message='El teléfono debe tener formato 09XXXXXXXX'
    )
    
    cedula = models.CharField(max_length=10, unique=True, validators=[cedula_validator])
    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    tipo_plan = models.CharField(max_length=50, choices=PLANES)
    fecha_nacimiento = models.DateField()
    direccion = models.TextField()
    sector = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=10, validators=[telefono_validator])
    estado = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    @property
    def edad(self):
        today = date.today()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )
    
    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"
    
    def __str__(self):
        return f"{self.nombre_completo} - {self.cedula}"

class Pago(models.Model):
    ESTADOS = [
        ('completado', 'Completado'),
        ('pendiente', 'Pendiente'),
        ('fallido', 'Fallido'),
    ]
    
    METODOS_PAGO = [
        ('Efectivo', 'Efectivo'),
        ('Transferencia', 'Transferencia'),
        ('Tarjeta', 'Tarjeta'),
        ('Cheque', 'Cheque'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField()
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO)
    concepto = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='completado')
    comprobante_enviado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Pago {self.cliente.nombre_completo} - ${self.monto}"

class Gasto(models.Model):
    CATEGORIAS = [
        ('Proveedores', 'Proveedores'),
        ('Transporte', 'Transporte'),
        ('Mantenimiento', 'Mantenimiento'),
        ('Oficina', 'Oficina'),
        ('Servicios', 'Servicios'),
        ('Otros', 'Otros'),
    ]
    
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_gasto = models.DateField()
    proveedor = models.CharField(max_length=255, blank=True, null=True)
    metodo_pago = models.CharField(max_length=50, blank=True, null=True)
    comprobante_url = models.URLField(blank=True, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.descripcion} - ${self.monto}"

class Notificacion(models.Model):
    TIPOS = [
        ('pago_proximo', 'Pago Próximo'),
        ('pago_vencido', 'Pago Vencido'),
        ('corte_servicio', 'Corte de Servicio'),
    ]
    
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('enviado', 'Enviado'),
        ('fallido', 'Fallido'),
    ]
    
    CANALES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    canal = models.CharField(max_length=20, choices=CANALES, default='whatsapp')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.tipo} - {self.cliente.nombre_completo}"

class Configuracion(models.Model):
    clave = models.CharField(max_length=100, unique=True)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.clave}: {self.valor}"
    
    class Meta:
        verbose_name_plural = "Configuraciones"

print("Modelos Django creados exitosamente")
print("Recuerda ejecutar: python manage.py makemigrations")
print("Luego: python manage.py migrate")
