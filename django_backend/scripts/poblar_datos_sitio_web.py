#!/usr/bin/env python
"""
Script para poblar los datos del sitio web con la información actual
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teltec_backend.settings')
django.setup()

from sitio_web.models import (
    InformacionSitio, Empresa, Servicio, RedSocial, ConfiguracionSitio,
    Plan, Cobertura, Contacto, Carrusel, Header, Footer
)

def poblar_datos_sitio_web():
    """Poblar los datos del sitio web con la información actual"""
    
    print("🔄 Poblando datos del sitio web...")
    
    # 1. Información del sitio
    print("📝 Configurando información del sitio...")
    info_sitio, created = InformacionSitio.objects.get_or_create(
        id=1,
        defaults={
            'titulo': "TelTec Net - Proveedor de Internet",
            'subtitulo': "Conectando comunidades con tecnología de vanguardia",
            'descripcion': "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional.",
            'lema': "Conectando tu mundo digital"
        }
    )
    
    if not created:
        info_sitio.titulo = "TelTec Net - Proveedor de Internet"
        info_sitio.subtitulo = "Conectando comunidades con tecnología de vanguardia"
        info_sitio.descripcion = "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional."
        info_sitio.lema = "Conectando tu mundo digital"
        info_sitio.save()
    
    print(f"✅ Información del sitio: {'Creada' if created else 'Actualizada'}")
    
    # 2. Información de empresa
    print("🏢 Configurando información de empresa...")
    empresa, created = Empresa.objects.get_or_create(
        id=1,
        defaults={
            'nombre': "TelTec Net",
            'direccion': "Av. Principal 123, Centro",
            'telefono': "0984517703",
            'email': "teltecnet@outlook.com",
            'ruc': "1234567890001",
            'horario': "Lunes a Viernes: 8:00 AM - 6:00 PM"
        }
    )
    
    if not created:
        empresa.nombre = "TelTec Net"
        empresa.direccion = "Av. Principal 123, Centro"
        empresa.telefono = "0984517703"
        empresa.email = "teltecnet@outlook.com"
        empresa.ruc = "1234567890001"
        empresa.horario = "Lunes a Viernes: 8:00 AM - 6:00 PM"
        empresa.save()
    
    print(f"✅ Información de empresa: {'Creada' if created else 'Actualizada'}")
    
    # 3. Servicios
    print("🛠️ Configurando servicios...")
    
    # Eliminar servicios existentes
    Servicio.objects.all().delete()
    
    servicios_data = [
        {
            'nombre': 'Internet Emprendimientos y Negocios',
            'descripcion': 'Soluciones de conectividad dedicada para empresas. Conexión estable y soporte técnico especializado.',
            'icono': 'wifi',
            'imagen': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
            'orden': 1
        },
        {
            'nombre': 'Televisión Digital',
            'descripcion': 'Entretenimiento familiar con canales de calidad. Zapping rápido y programación variada.',
            'icono': 'tv',
            'imagen': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
            'orden': 2
        },
        {
            'nombre': 'Cámaras de Seguridad',
            'descripcion': 'Sistemas de vigilancia profesional para hogares y negocios. Monitoreo 24/7 con acceso remoto.',
            'icono': 'shield',
            'imagen': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
            'orden': 3
        },
        {
            'nombre': 'Instalación y Soporte',
            'descripcion': 'Instalación profesional y soporte técnico 24/7. Nuestro equipo está siempre disponible para ayudarte.',
            'icono': 'settings',
            'imagen': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
            'orden': 4
        }
    ]
    
    for servicio_data in servicios_data:
        Servicio.objects.create(**servicio_data)
    
    print(f"✅ Servicios configurados: {len(servicios_data)} servicios")
    
    # 4. Planes
    print("📦 Configurando planes...")
    
    # Eliminar planes existentes
    Plan.objects.all().delete()
    
    planes_data = [
        {
            'nombre': 'Plan Familiar',
            'velocidad': '30 MB',
            'precio': 20.00,
            'descripcion': 'Ideal para familias que necesitan conectividad estable para trabajo y entretenimiento.',
            'caracteristicas': ['Internet de alta velocidad', 'Soporte técnico 24/7', 'Sin límite de datos', 'Instalación gratuita'],
            'popular': True,
            'orden': 1
        },
        {
            'nombre': 'Plan Básico',
            'velocidad': '15 MB',
            'precio': 15.00,
            'descripcion': 'Perfecto para usuarios individuales que buscan una conexión confiable.',
            'caracteristicas': ['Internet estable', 'Soporte técnico', 'Sin límite de datos', 'Instalación incluida'],
            'popular': False,
            'orden': 2
        },
        {
            'nombre': 'Plan Personalizado',
            'velocidad': 'Variable',
            'precio': 25.00,
            'descripcion': 'Soluciones a medida para empresas y usuarios con necesidades específicas.',
            'caracteristicas': ['Velocidad personalizada', 'Soporte prioritario', 'SLA garantizado', 'Consultoría técnica'],
            'popular': False,
            'orden': 3
        }
    ]
    
    for plan_data in planes_data:
        Plan.objects.create(**plan_data)
    
    print(f"✅ Planes configurados: {len(planes_data)} planes")
    
    # 5. Coberturas
    print("🗺️ Configurando coberturas...")
    
    # Eliminar coberturas existentes
    Cobertura.objects.all().delete()
    
    coberturas_data = [
        {
            'zona': 'Centro de la Ciudad',
            'descripcion': 'Cobertura completa en el centro histórico y comercial de la ciudad.',
            'coordenadas': {'lat': -0.2299, 'lng': -78.5249},
            'orden': 1
        },
        {
            'zona': 'Zona Norte',
            'descripcion': 'Servicio disponible en los barrios del norte de la ciudad.',
            'coordenadas': {'lat': -0.2100, 'lng': -78.5200},
            'orden': 2
        },
        {
            'zona': 'Zona Sur',
            'descripcion': 'Cobertura en los sectores residenciales del sur.',
            'coordenadas': {'lat': -0.2500, 'lng': -78.5300},
            'orden': 3
        }
    ]
    
    for cobertura_data in coberturas_data:
        Cobertura.objects.create(**cobertura_data)
    
    print(f"✅ Coberturas configuradas: {len(coberturas_data)} zonas")
    
    # 6. Contactos
    print("📞 Configurando contactos...")
    
    # Eliminar contactos existentes
    Contacto.objects.all().delete()
    
    contactos_data = [
        {
            'tipo': 'telefono',
            'titulo': 'Teléfono',
            'valor': '0984517703',
            'icono': 'phone',
            'url': 'tel:0984517703',
            'orden': 1
        },
        {
            'tipo': 'email',
            'titulo': 'Email',
            'valor': 'teltecnet@outlook.com',
            'icono': 'mail',
            'url': 'mailto:teltecnet@outlook.com',
            'orden': 2
        },
        {
            'tipo': 'whatsapp',
            'titulo': 'WhatsApp',
            'valor': '0984517703',
            'icono': 'message-circle',
            'url': 'https://wa.me/593984517703',
            'orden': 3
        },
        {
            'tipo': 'direccion',
            'titulo': 'Dirección',
            'valor': 'Av. Principal 123, Centro',
            'icono': 'map-pin',
            'url': '',
            'orden': 4
        },
        {
            'tipo': 'horario',
            'titulo': 'Horario',
            'valor': 'Lunes a Viernes: 8:00 AM - 6:00 PM',
            'icono': 'clock',
            'url': '',
            'orden': 5
        }
    ]
    
    for contacto_data in contactos_data:
        Contacto.objects.create(**contacto_data)
    
    print(f"✅ Contactos configurados: {len(contactos_data)} contactos")
    
    # 7. Carrusel
    print("🖼️ Configurando carrusel...")
    
    # Eliminar carrusel existente
    Carrusel.objects.all().delete()
    
    carrusel_data = [
        {
            'titulo': 'Internet de Alta Velocidad',
            'descripcion': 'Conectividad confiable para tu hogar y negocio',
            'imagen': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
            'video': '',
            'enlace': '',
            'orden': 1
        },
        {
            'titulo': 'Televisión Digital',
            'descripcion': 'Entretenimiento familiar con la mejor calidad',
            'imagen': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200&h=600&fit=crop',
            'video': '',
            'enlace': '',
            'orden': 2
        },
        {
            'titulo': 'Cámaras de Seguridad',
            'descripcion': 'Protege tu hogar y negocio con tecnología avanzada',
            'imagen': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
            'video': '',
            'enlace': '',
            'orden': 3
        }
    ]
    
    for carrusel_item in carrusel_data:
        Carrusel.objects.create(**carrusel_item)
    
    print(f"✅ Carrusel configurado: {len(carrusel_data)} imágenes")
    
    # 8. Header
    print("📋 Configurando header...")
    header, created = Header.objects.get_or_create(
        id=1,
        defaults={
            'logo_url': 'https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=TelTec+Net',
            'logo_alt': 'TelTec Net Logo',
            'mostrar_menu': True,
            'color_fondo': '#ffffff',
            'color_texto': '#000000'
        }
    )
    
    if not created:
        header.logo_url = 'https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=TelTec+Net'
        header.logo_alt = 'TelTec Net Logo'
        header.mostrar_menu = True
        header.color_fondo = '#ffffff'
        header.color_texto = '#000000'
        header.save()
    
    print(f"✅ Header: {'Creado' if created else 'Actualizado'}")
    
    # 9. Footer
    print("📄 Configurando footer...")
    footer, created = Footer.objects.get_or_create(
        id=1,
        defaults={
            'texto_copyright': '© 2025 T&T net - Todos los derechos reservados | Desarrollado en Ecuador 🇪🇨',
            'mostrar_redes_sociales': True,
            'mostrar_contacto': True,
            'color_fondo': '#1f2937',
            'color_texto': '#ffffff'
        }
    )
    
    if not created:
        footer.texto_copyright = '© 2025 T&T net - Todos los derechos reservados | Desarrollado en Ecuador 🇪🇨'
        footer.mostrar_redes_sociales = True
        footer.mostrar_contacto = True
        footer.color_fondo = '#1f2937'
        footer.color_texto = '#ffffff'
        footer.save()
    
    print(f"✅ Footer: {'Creado' if created else 'Actualizado'}")
    
    # 10. Redes sociales
    print("📱 Configurando redes sociales...")
    
    # Eliminar redes existentes
    RedSocial.objects.all().delete()
    
    redes_data = [
        {
            'nombre': 'Facebook',
            'tipo': 'facebook',
            'url': 'https://facebook.com/teltecnet',
            'icono': 'facebook'
        },
        {
            'nombre': 'Instagram',
            'tipo': 'instagram',
            'url': 'https://instagram.com/teltecnet',
            'icono': 'instagram'
        },
        {
            'nombre': 'TikTok',
            'tipo': 'tiktok',
            'url': 'https://tiktok.com/@teltecnet',
            'icono': 'music'
        }
    ]
    
    for red_data in redes_data:
        RedSocial.objects.create(**red_data)
    
    print(f"✅ Redes sociales configuradas: {len(redes_data)} redes")
    
    # 11. Configuración del sitio
    print("⚙️ Configurando configuración del sitio...")
    config, created = ConfiguracionSitio.objects.get_or_create(
        id=1,
        defaults={
            'mostrar_precios': True,
            'mostrar_contacto': True,
            'mostrar_testimonios': True,
            'modo_mantenimiento': False
        }
    )
    
    if not created:
        config.mostrar_precios = True
        config.mostrar_contacto = True
        config.mostrar_testimonios = True
        config.modo_mantenimiento = False
        config.save()
    
    print(f"✅ Configuración del sitio: {'Creada' if created else 'Actualizada'}")
    
    print("\n🎉 ¡Datos del sitio web poblados exitosamente!")
    print("\n📊 Resumen:")
    print(f"   • Información del sitio: {info_sitio.titulo}")
    print(f"   • Empresa: {empresa.nombre}")
    print(f"   • Servicios: {Servicio.objects.count()} servicios")
    print(f"   • Planes: {Plan.objects.count()} planes")
    print(f"   • Coberturas: {Cobertura.objects.count()} zonas")
    print(f"   • Contactos: {Contacto.objects.count()} contactos")
    print(f"   • Carrusel: {Carrusel.objects.count()} imágenes")
    print(f"   • Redes sociales: {RedSocial.objects.count()} redes")
    print(f"   • Configuración: {'Activa' if not config.modo_mantenimiento else 'Mantenimiento'}")

if __name__ == "__main__":
    poblar_datos_sitio_web()
