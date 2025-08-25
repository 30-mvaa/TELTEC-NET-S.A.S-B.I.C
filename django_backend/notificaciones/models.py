from django.db import models
from django.utils import timezone
from clientes.models import Cliente


class Notificacion(models.Model):
    """
    Modelo de Notificación para TelTec Net
    """
    TIPO_CHOICES = [
        ('pago_proximo', 'Pago Próximo'),
        ('pago_vencido', 'Pago Vencido'),
        ('corte_servicio', 'Corte de Servicio'),
        ('recordatorio', 'Recordatorio'),
        ('promocion', 'Promoción'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('enviado', 'Enviado'),
        ('fallido', 'Fallido'),
    ]
    
    CANAL_CHOICES = [
        ('telegram', 'Telegram'),
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default='telegram')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notificaciones'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Notificación {self.id} - {self.cliente.nombre_completo} - {self.tipo}"
    
    @property
    def cliente_nombre(self):
        return self.cliente.nombre_completo
    
    @property
    def cliente_email(self):
        return self.cliente.email
    
    @property
    def cliente_telegram_chat_id(self):
        return self.cliente.telegram_chat_id
    
    def to_dict(self):
        """Convierte el modelo a diccionario para APIs"""
        return {
            'id': self.id,
            'cliente_id': self.cliente.id,
            'cliente_nombre': self.cliente_nombre,
            'cliente_email': self.cliente_email,
            'cliente_telegram_chat_id': self.cliente_telegram_chat_id,
            'tipo': self.tipo,
            'mensaje': self.mensaje,
            'fecha_envio': self.fecha_envio.isoformat() if self.fecha_envio else None,
            'estado': self.estado,
            'canal': self.canal,
            'fecha_creacion': self.fecha_creacion.isoformat(),
        }
