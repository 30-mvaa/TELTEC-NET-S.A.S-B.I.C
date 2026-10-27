from django.contrib import admin
from .models import Notificacion, PlantillaNotificacion, RegistroEnvio, ColaEnvio, RegistroEnvioDetallado

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'tipo', 'estado', 'canal', 'fecha_creacion')
    list_filter = ('estado', 'tipo', 'canal')
    search_fields = ('cliente__nombres', 'cliente__apellidos', 'mensaje')

@admin.register(PlantillaNotificacion)
class PlantillaNotificacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'activo')
    list_filter = ('tipo', 'activo')

@admin.register(ColaEnvio)
class ColaEnvioAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'canal_primario', 'estado', 'intentos', 'proximo_reintento')
    list_filter = ('estado', 'canal_primario')

@admin.register(RegistroEnvioDetallado)
class RegistroEnvioDetalladoAdmin(admin.ModelAdmin):
    list_display = ('cola_envio', 'resultado', 'fecha_intento')
    list_filter = ('resultado',)
