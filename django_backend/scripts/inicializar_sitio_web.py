#!/usr/bin/env python
"""
Script para inicializar el módulo sitio web con datos por defecto
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/Users/marcoangamarca/Desktop/web-teltec/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from sitio_web.models import InformacionSitio, Empresa, Servicio, RedSocial, ConfiguracionSitio

def inicializar_sitio_web():
    """Inicializar datos del sitio web"""
    
    print("🌐 Inicializando módulo Sitio Web...")
    
    try:
        # Crear información del sitio
        info_sitio, created = InformacionSitio.objects.get_or_create(
            id=1,
            defaults={
                'titulo': 'TelTec Net - Proveedor de Internet',
                'subtitulo': 'Conectando comunidades con tecnología de vanguardia',
                'descripcion': 'Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional.',
                'lema': 'Conectando tu mundo digital'
            }
        )
        
        if created:
            print("✅ Información del sitio creada")
        else:
            print("ℹ️  Información del sitio ya existe")
        
        # Crear información de la empresa
        empresa, created = Empresa.objects.get_or_create(
            id=1,
            defaults={
                'nombre': 'TelTec Net',
                'descripcion': 'Empresa líder en servicios de internet de alta velocidad',
                'direccion': 'Sisid Centro, Cañar, Ecuador',
                'telefono': '+593 98 765 4321',
                'email': 'info@teltecnet.com',
                'horario_atencion': 'Lunes a Viernes: 8:00 AM - 6:00 PM',
                'mision': 'Proporcionar servicios de internet de alta calidad y soporte técnico excepcional',
                'vision': 'Ser el proveedor de internet más confiable y preferido en la región',
                'valores': 'Confianza, Calidad, Innovación, Servicio al Cliente'
            }
        )
        
        if created:
            print("✅ Información de la empresa creada")
        else:
            print("ℹ️  Información de la empresa ya existe")
        
        # Crear servicios
        servicios_data = [
            {
                'nombre': 'Plan Familiar',
                'descripcion': 'Internet de alta velocidad para toda la familia',
                'precio': 20.00,
                'velocidad': '10 Mbps',
                'caracteristicas': 'Sin límite de datos, Soporte 24/7, Instalación gratuita'
            },
            {
                'nombre': 'Plan Tercera Edad',
                'descripcion': 'Plan especial con descuento para adultos mayores',
                'precio': 18.00,
                'velocidad': '8 Mbps',
                'caracteristicas': 'Sin límite de datos, Soporte prioritario, Instalación gratuita'
            },
            {
                'nombre': 'Plan Básico',
                'descripcion': 'Internet económico para uso básico',
                'precio': 15.00,
                'velocidad': '5 Mbps',
                'caracteristicas': 'Sin límite de datos, Soporte técnico, Instalación gratuita'
            },
            {
                'nombre': 'Plan Preferencial',
                'descripcion': 'Plan especial para estudiantes y docentes',
                'precio': 10.00,
                'velocidad': '6 Mbps',
                'caracteristicas': 'Sin límite de datos, Soporte educativo, Instalación gratuita'
            }
        ]
        
        for servicio_data in servicios_data:
            servicio, created = Servicio.objects.get_or_create(
                nombre=servicio_data['nombre'],
                defaults=servicio_data
            )
            if created:
                print(f"✅ Servicio '{servicio.nombre}' creado")
            else:
                print(f"ℹ️  Servicio '{servicio.nombre}' ya existe")
        
        # Crear redes sociales
        redes_data = [
            {
                'nombre': 'Facebook',
                'url': 'https://facebook.com/teltecnet',
                'icono': 'facebook',
                'activo': True
            },
            {
                'nombre': 'WhatsApp',
                'url': 'https://wa.me/593987654321',
                'icono': 'whatsapp',
                'activo': True
            },
            {
                'nombre': 'Instagram',
                'url': 'https://instagram.com/teltecnet',
                'icono': 'instagram',
                'activo': True
            }
        ]
        
        for red_data in redes_data:
            red, created = RedSocial.objects.get_or_create(
                nombre=red_data['nombre'],
                defaults=red_data
            )
            if created:
                print(f"✅ Red social '{red.nombre}' creada")
            else:
                print(f"ℹ️  Red social '{red.nombre}' ya existe")
        
        # Crear configuración del sitio
        config, created = ConfiguracionSitio.objects.get_or_create(
            id=1,
            defaults={
                'mostrar_estadisticas': True,
                'mostrar_testimonios': True,
                'mostrar_servicios': True,
                'mostrar_contacto': True,
                'tema_color': 'blue',
                'logo_url': '/images/logo.png',
                'favicon_url': '/images/favicon.ico'
            }
        )
        
        if created:
            print("✅ Configuración del sitio creada")
        else:
            print("ℹ️  Configuración del sitio ya existe")
        
        print("\n🎉 Módulo Sitio Web inicializado correctamente!")
        
    except Exception as e:
        print(f"❌ Error inicializando sitio web: {e}")

if __name__ == "__main__":
    inicializar_sitio_web()
