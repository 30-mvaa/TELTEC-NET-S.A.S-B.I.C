from django.db import models
from django.utils import timezone
from clientes.models import Cliente


class Pago(models.Model):
    """
    Modelo de Pago para TelTec Net
    """
    ESTADO_CHOICES = [
        ('completado', 'Completado'),
        ('pendiente', 'Pendiente'),
        ('fallido', 'Fallido'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('deposito', 'Depósito'),
        ('tarjeta', 'Tarjeta'),
        ('pago_online', 'Pago Online'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField()
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    concepto = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='completado')
    comprobante_enviado = models.BooleanField(default=False)
    numero_comprobante = models.CharField(max_length=50, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pagos'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Pago {self.id} - {self.cliente.nombre_completo} - ${self.monto}"
    
    @property
    def cliente_nombre(self):
        return self.cliente.nombre_completo
    
    @property
    def cliente_email(self):
        return self.cliente.email
    
    @property
    def cliente_cedula(self):
        return self.cliente.cedula
    
    def to_dict(self):
        """Convierte el modelo a diccionario para APIs"""
        return {
            'id': self.id,
            'cliente_id': self.cliente.id,
            'cliente_nombre': self.cliente_nombre,
            'cliente_email': self.cliente_email,
            'cliente_cedula': self.cliente_cedula,
            'tipo_plan': self.cliente.tipo_plan,
            'monto': float(self.monto),
            'fecha_pago': self.fecha_pago.isoformat(),
            'metodo_pago': self.metodo_pago,
            'concepto': self.concepto,
            'estado': self.estado,
            'comprobante_enviado': self.comprobante_enviado,
            'numero_comprobante': self.numero_comprobante,
            'fecha_creacion': self.fecha_creacion.isoformat(),
        }


class Gasto(models.Model):
    """
    Modelo de Gasto para TelTec Net
    """
    CATEGORIA_CHOICES = [
        ('servicios', 'Servicios'),
        ('equipos', 'Equipos'),
        ('mantenimiento', 'Mantenimiento'),
        ('personal', 'Personal'),
        ('marketing', 'Marketing'),
        ('otros', 'Otros'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('cheque', 'Cheque'),
    ]
    
    descripcion = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_gasto = models.DateField()
    proveedor = models.CharField(max_length=255, blank=True, null=True)
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, blank=True, null=True)
    comprobante_url = models.URLField(blank=True, null=True)
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'gastos'
        verbose_name = 'Gasto'
        verbose_name_plural = 'Gastos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Gasto {self.id} - {self.descripcion} - ${self.monto}"
    
    def to_dict(self):
        """Convierte el modelo a diccionario para APIs"""
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'categoria': self.categoria,
            'monto': float(self.monto),
            'fecha_gasto': self.fecha_gasto.isoformat(),
            'proveedor': self.proveedor,
            'metodo_pago': self.metodo_pago,
            'comprobante_url': self.comprobante_url,
            'usuario_id': self.usuario.id if self.usuario else None,
            'fecha_creacion': self.fecha_creacion.isoformat(),
        }
