from django.urls import path
from . import views

urlpatterns = [
    # Configuración del sitio web (admin)
    path('api/sitio-web/configuracion/', views.configuracion_sitio_web, name='configuracion_sitio_web'),
    
    # Información pública del sitio web
    path('api/sitio-web/publico/', views.sitio_web_publico, name='sitio_web_publico'),
]
