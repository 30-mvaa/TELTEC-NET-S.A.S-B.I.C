from django.db import models
from django.utils import timezone

class InformacionSitio(models.Model):
    """Modelo para almacenar información general del sitio web"""
    titulo = models.CharField(max_length=200, default="TelTec Net - Proveedor de Internet")
    subtitulo = models.CharField(max_length=300, default="Conectando comunidades con tecnología de vanguardia")
    descripcion = models.TextField(default="Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional.")
    lema = models.CharField(max_length=200, default="Conectando tu mundo digital")
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Información del Sitio"
        verbose_name_plural = "Información del Sitio"

class Empresa(models.Model):
    """Modelo para información de la empresa"""
    nombre = models.CharField(max_length=200, default="TelTec Net")
    direccion = models.CharField(max_length=300, default="Av. Principal 123, Centro")
    telefono = models.CharField(max_length=20, default="0999859689")
    email = models.EmailField(default="info@teltecnet.com")
    ruc = models.CharField(max_length=20, default="1234567890001")
    horario = models.CharField(max_length=200, default="Lunes a Viernes: 8:00 AM - 6:00 PM")
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresa"

class Servicio(models.Model):
    """Modelo para servicios ofrecidos"""
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    activo = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        ordering = ['orden', 'nombre']

class RedSocial(models.Model):
    """Modelo para redes sociales"""
    REDES_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
    ]
    
    tipo = models.CharField(max_length=20, choices=REDES_CHOICES)
    url = models.URLField()
    activo = models.BooleanField(default=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Red Social"
        verbose_name_plural = "Redes Sociales"
        unique_together = ['tipo']

class ConfiguracionSitio(models.Model):
    """Modelo para configuración general del sitio"""
    mostrar_precios = models.BooleanField(default=True)
    mostrar_contacto = models.BooleanField(default=True)
    mostrar_testimonios = models.BooleanField(default=True)
    modo_mantenimiento = models.BooleanField(default=False)
    mensaje_mantenimiento = models.TextField(blank=True, default="Sitio en mantenimiento. Volveremos pronto.")
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Configuración del Sitio"
        verbose_name_plural = "Configuración del Sitio"
