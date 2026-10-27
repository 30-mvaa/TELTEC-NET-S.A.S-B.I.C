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
        ('mantenimiento', 'Mantenimiento'),
    ]

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('enviado', 'Enviado'),
        ('fallido', 'Fallido'),
    ]

    CANAL_CHOICES = [
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default='whatsapp')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_programada = models.DateTimeField(null=True, blank=True, help_text='Fecha programada para envío')
    intentos = models.IntegerField(default=0, help_text='Número de intentos de envío')

    class Meta:
        db_table = 'notificaciones'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado'], name='notif_estado_idx'),
            models.Index(fields=['tipo'], name='notif_tipo_idx'),
            models.Index(fields=['fecha_creacion'], name='notif_fecha_crea_idx'),
            models.Index(fields=['cliente_id', 'estado'], name='notif_cliente_estado_idx'),
            models.Index(fields=['estado', 'fecha_creacion'], name='notif_estado_fecha_idx'),
        ]

    def __str__(self):
        return f"Notificación {self.id} - {self.cliente.nombre_completo} - {self.tipo}"

    @property
    def cliente_nombre(self):
        return self.cliente.nombre_completo

    @property
    def cliente_email(self):
        return self.cliente.email

    @property
    def cliente_whatsapp_number(self):
        return self.cliente.telefono

    def to_dict(self):
        """Convierte el modelo a diccionario para APIs"""
        return {
            'id': self.id,
            'cliente_id': self.cliente.id,
            'cliente_nombre': self.cliente_nombre,
            'cliente_email': self.cliente_email,
            'cliente_tiene_telegram': bool(self.cliente.telegram_chat_id),
            'tipo': self.tipo,
            'mensaje': self.mensaje,
            'fecha_envio': self.fecha_envio.isoformat() if self.fecha_envio else None,
            'estado': self.estado,
            'canal': self.canal,
            'fecha_creacion': self.fecha_creacion.isoformat(),
        }


class PlantillaNotificacion(models.Model):
    """
    Modelo de Plantillas de Notificación para TelTec Net
    Permite crear y gestionar plantillas personalizables
    """
    TIPO_CHOICES = [
        ('pago_proximo', 'Pago Próximo'),
        ('pago_vencido', 'Pago Vencido'),
        ('corte_servicio', 'Corte de Servicio'),
        ('recordatorio', 'Recordatorio'),
        ('promocion', 'Promoción'),
        ('mantenimiento', 'Mantenimiento'),
    ]

    nombre = models.CharField(max_length=100, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensaje = models.TextField(
        help_text='Usa {nombre}, {deuda}, {plan}, {telefono} como variables'
    )
    variables = models.JSONField(
        default=list,
        blank=True,
        help_text='Lista de variables disponibles: ["{nombre}", "{deuda}", "{plan}"]'
    )
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plantillas_notificacion'
        verbose_name = 'Plantilla de Notificación'
        verbose_name_plural = 'Plantillas de Notificación'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"

    def renderizar_mensaje(self, contexto: dict) -> str:
        """Renderiza el mensaje con las variables proporcionadas"""
        mensaje = self.mensaje
        for clave, valor in contexto.items():
            mensaje = mensaje.replace(f'{{{clave}}}', str(valor))
        return mensaje


class RegistroEnvio(models.Model):
    """
    Modelo para registrar intentos de envío y seguimiento de entregas
    """
    ESTADO_ENVIO_CHOICES = [
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('leido', 'Leído'),
        ('fallido', 'Fallido'),
        ('rebotado', 'Rebotado'),
    ]

    notificacion = models.ForeignKey(
        Notificacion,
        on_delete=models.CASCADE,
        related_name='registros_envio'
    )
    estado = models.CharField(max_length=20, choices=ESTADO_ENVIO_CHOICES, default='enviado')
    proveedor = models.CharField(max_length=50, help_text='WhatsApp, Email, SMS, etc.')
    referencia_externa = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='ID del mensaje en el proveedor'
    )
    respuesta_proveedor = models.JSONField(default=dict, blank=True)
    fecha_envio = models.DateTimeField(default=timezone.now)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    fecha_lectura = models.DateTimeField(null=True, blank=True)
    errores = models.TextField(blank=True)

    class Meta:
        db_table = 'registros_envio'
        verbose_name = 'Registro de Envío'
        verbose_name_plural = 'Registros de Envío'
        ordering = ['-fecha_envio']
        indexes = [
            models.Index(fields=['notificacion'], name='reg_notif_idx'),
            models.Index(fields=['estado'], name='reg_estado_idx'),
            models.Index(fields=['fecha_envio'], name='reg_fecha_idx'),
        ]

    def __str__(self):
        return f"Envío {self.id} - {self.notificacion.id} - {self.estado}"


class ColaEnvio(models.Model):
    """
    Cola de notificaciones pendientes de envío
    - Permite reintentos automáticos
    - Registra historial completo de intentos
    - Soporta multi-canal con fallback
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('enviado', 'Enviado'),
        ('fallido', 'Fallido'),
        ('descartado', 'Descartado'),
    ]

    CANAL_CHOICES = [
        ('telegram', 'Telegram'),
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]

    notificacion = models.ForeignKey(
        Notificacion,
        on_delete=models.CASCADE,
        related_name='colas_envio'
    )
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='colas_envio'
    )

    # Canales
    canal_primario = models.CharField(max_length=20, choices=CANAL_CHOICES)
    canal_fallback = models.CharField(
        max_length=20,
        choices=CANAL_CHOICES,
        null=True,
        blank=True,
        help_text='Canal alternativo si primario falla'
    )

    # Estado y reintentos
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    intentos = models.IntegerField(default=0, help_text='Intentos realizados')
    max_intentos = models.IntegerField(default=3, help_text='Máximo de intentos permitidos')

    # Timing
    proximo_reintento = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_ultimo_intento = models.DateTimeField(null=True, blank=True)
    fecha_enviado = models.DateTimeField(null=True, blank=True)

    # Telegram específico
    telegram_message_id = models.CharField(max_length=100, null=True, blank=True)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True, help_text='Datos adicionales')

    class Meta:
        db_table = 'cola_envios'
        verbose_name = 'Cola de Envío'
        verbose_name_plural = 'Colas de Envío'
        ordering = ['proximo_reintento', 'fecha_creacion']
        indexes = [
            models.Index(fields=['estado', 'proximo_reintento'], name='cola_estado_reintento_idx'),
            models.Index(fields=['cliente_id', 'estado'], name='cola_cliente_estado_idx'),
            models.Index(fields=['estado', 'fecha_creacion'], name='cola_estado_fecha_idx'),
            models.Index(fields=['canal_primario'], name='cola_canal_idx'),
        ]

    def __str__(self):
        return f"Cola {self.id} - Cliente {self.cliente_id} - {self.estado}"

    @property
    def puede_reintentar(self) -> bool:
        """Determinar si se puede reintentar el envío"""
        return self.intentos < self.max_intentos and self.estado != 'enviado'

    @property
    def tiempo_desde_ultimo_intento(self):
        """Obtener tiempo transcurrido desde el último intento"""
        if self.fecha_ultimo_intento:
            return timezone.now() - self.fecha_ultimo_intento
        return None


class RegistroEnvioDetallado(models.Model):
    """
    Registro detallado de cada intento de envío
    Permite auditoría completa y debugging de problemas
    """

    RESULTADO_CHOICES = [
        ('exito', 'Éxito'),
        ('error_temporal', 'Error Temporal'),
        ('error_permanente', 'Error Permanente'),
        ('descartado', 'Descartado'),
    ]

    cola_envio = models.ForeignKey(
        ColaEnvio,
        on_delete=models.CASCADE,
        related_name='registros_detallados'
    )

    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    codigo_error = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='Ej: 400, invalid_chat_id'
    )
    mensaje_error = models.TextField(blank=True, help_text='Descripción detallada del error')

    # Respuesta del proveedor
    respuesta_proveedor = models.JSONField(default=dict, blank=True)

    # Timing
    fecha_intento = models.DateTimeField(auto_now_add=True)
    duracion_ms = models.IntegerField(null=True, blank=True, help_text='Duración del intento en ms')

    class Meta:
        db_table = 'registros_envio_detallado'
        verbose_name = 'Registro de Envío Detallado'
        verbose_name_plural = 'Registros de Envío Detallado'
        ordering = ['-fecha_intento']
        indexes = [
            models.Index(fields=['cola_envio'], name='reg_det_cola_idx'),
            models.Index(fields=['resultado'], name='reg_det_resultado_idx'),
            models.Index(fields=['fecha_intento'], name='reg_det_fecha_idx'),
        ]

    def __str__(self):
        return f"Intento {self.id} - Cola {self.cola_envio_id} - {self.resultado}"
