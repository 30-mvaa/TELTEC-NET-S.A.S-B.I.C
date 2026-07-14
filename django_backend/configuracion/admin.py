from django.contrib import admin
from .models import ConfiguracionSistema


@admin.register(ConfiguracionSistema)
class ConfiguracionSistemaAdmin(admin.ModelAdmin):
    list_display = ('clave', 'valor', 'categoria', 'fecha_actualizacion')
    list_filter = ('categoria',)
    search_fields = ('clave', 'valor', 'descripcion')
