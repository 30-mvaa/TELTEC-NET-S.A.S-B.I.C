#!/usr/bin/env python
"""
Script para inicializar los datos del sitio web
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
    
    print("🚀 Inicializando datos del sitio web...")
    
    # 1. Información del sitio
    print("📝 Configurando información del sitio...")
    info_sitio, created = InformacionSitio.objects.get_or_create(
        id=1,
        defaults={
            'titulo': "TelTec Net - Proveedor de Internet",
            'subtitulo': "Conectando comunidades con tecnología de vanguardia",
            'descripcion': "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional. Ofrecemos soluciones de internet residencial y empresarial con la mejor tecnología y soporte 24/7.",
            'lema': "Conectando tu mundo digital"
        }
    )
    
    if created:
        print("✅ Información del sitio creada")
    else:
        print("ℹ️  Información del sitio ya existía")
    
    # 2. Información de la empresa
    print("🏢 Configurando información de la empresa...")
    empresa, created = Empresa.objects.get_or_create(
        id=1,
        defaults={
            'nombre': "TelTec Net",
            'direccion': "Av. Principal 123, Centro Comercial",
            'telefono': "0999859689",
            'email': "info@teltecnet.com",
            'ruc': "1234567890001",
            'horario': "Lunes a Viernes: 8:00 AM - 6:00 PM | Sábados: 9:00 AM - 2:00 PM"
        }
    )
    
    if created:
        print("✅ Información de la empresa creada")
    else:
        print("ℹ️  Información de la empresa ya existía")
    
    # 3. Servicios
    print("📦 Configurando servicios...")
    servicios_data = [
        {
            'nombre': "Internet Residencial",
            'descripcion': "Planes de internet de alta velocidad para hogares con velocidades desde 10 Mbps hasta 100 Mbps. Instalación gratuita y soporte técnico incluido.",
            'orden': 1
        },
        {
            'nombre': "Internet Empresarial",
            'descripcion': "Soluciones de conectividad para empresas con velocidades dedicadas, IP fija y soporte técnico prioritario 24/7.",
            'orden': 2
        },
        {
            'nombre': "Soporte Técnico 24/7",
            'descripcion': "Asistencia técnica disponible todo el día, todos los días. Resolución rápida de problemas y mantenimiento preventivo.",
            'orden': 3
        },
        {
            'nombre': "Instalación Gratuita",
            'descripcion': "Instalación profesional sin costo adicional. Incluye configuración de router y verificación de velocidad.",
            'orden': 4
        },
        {
            'nombre': "Mantenimiento Preventivo",
            'descripcion': "Servicio de mantenimiento preventivo para garantizar el óptimo funcionamiento de tu conexión a internet.",
            'orden': 5
        }
    ]
    
    # Eliminar servicios existentes y crear nuevos
    Servicio.objects.all().delete()
    for servicio_data in servicios_data:
        Servicio.objects.create(**servicio_data)
    print(f"✅ {len(servicios_data)} servicios configurados")
    
    # 4. Redes sociales
    print("🌐 Configurando redes sociales...")
    redes_data = [
        {
            'tipo': 'facebook',
            'url': 'https://facebook.com/teltecnet'
        },
        {
            'tipo': 'instagram',
            'url': 'https://instagram.com/teltecnet'
        },
        {
            'tipo': 'twitter',
            'url': 'https://twitter.com/teltecnet'
        },
        {
            'tipo': 'linkedin',
            'url': 'https://linkedin.com/company/teltecnet'
        }
    ]
    
    # Eliminar redes existentes y crear nuevas
    RedSocial.objects.all().delete()
    for red_data in redes_data:
        RedSocial.objects.create(**red_data)
    print(f"✅ {len(redes_data)} redes sociales configuradas")
    
    # 5. Configuración del sitio
    print("⚙️  Configurando opciones del sitio...")
    config, created = ConfiguracionSitio.objects.get_or_create(
        id=1,
        defaults={
            'mostrar_precios': True,
            'mostrar_contacto': True,
            'mostrar_testimonios': True,
            'modo_mantenimiento': False,
            'mensaje_mantenimiento': "Sitio en mantenimiento. Volveremos pronto con mejoras para ti."
        }
    )
    
    if created:
        print("✅ Configuración del sitio creada")
    else:
        print("ℹ️  Configuración del sitio ya existía")
    
    print("\n🎉 ¡Sitio web inicializado exitosamente!")
    print("\n📋 Resumen:")
    print(f"   • Información del sitio: {'Creada' if created else 'Actualizada'}")
    print(f"   • Información de empresa: {'Creada' if created else 'Actualizada'}")
    print(f"   • Servicios: {len(servicios_data)} configurados")
    print(f"   • Redes sociales: {len(redes_data)} configuradas")
    print(f"   • Configuración: {'Creada' if created else 'Actualizada'}")
    
    print("\n🌐 URLs disponibles:")
    print("   • Configuración (admin): http://localhost:8000/api/sitio-web/configuracion/")
    print("   • Información pública: http://localhost:8000/api/sitio-web/publico/")
    print("   • Frontend: http://localhost:3000/sitio-web")

if __name__ == "__main__":
    inicializar_sitio_web()
