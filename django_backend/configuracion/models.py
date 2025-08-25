from django.db import models
from django.utils import timezone

class ConfiguracionSistema(models.Model):
    """Modelo para almacenar configuraciones del sistema"""
    clave = models.CharField(max_length=100, unique=True, primary_key=True)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.CharField(max_length=50, default='general')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configuracion_sistema'
        verbose_name = 'Configuración del Sistema'
        verbose_name_plural = 'Configuraciones del Sistema'
    
    def __str__(self):
        return f"{self.clave}: {self.valor}"

class Plan(models.Model):
    """Modelo para planes de internet"""
    nombre = models.CharField(max_length=100, unique=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    velocidad = models.CharField(max_length=50, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configuracion_planes'
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'
    
    def __str__(self):
        return f"{self.nombre} - ${self.precio}"

class Sector(models.Model):
    """Modelo para sectores de cobertura"""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configuracion_sectores'
        verbose_name = 'Sector'
        verbose_name_plural = 'Sectores'
    
    def __str__(self):
        return self.nombre
