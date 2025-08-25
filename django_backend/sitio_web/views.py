from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
import json
from .models import InformacionSitio, Empresa, Servicio, RedSocial, ConfiguracionSitio
from django.db import transaction

def get_user_from_request(request):
    """Obtener información del usuario desde los headers"""
    user_email = request.headers.get('X-User-Email')
    if not user_email:
        return None
    
    # Aquí podrías verificar contra el modelo de usuarios si es necesario
    return {'email': user_email}

def check_admin_permissions(user):
    """Verificar que el usuario sea administrador"""
    if not user:
        return False
    # Aquí podrías verificar el rol del usuario
    return True

@csrf_exempt
@require_http_methods(["GET", "PUT"])
def configuracion_sitio_web(request):
    """Vista para obtener y actualizar toda la configuración del sitio web"""
    user = get_user_from_request(request)
    if not check_admin_permissions(user):
        return JsonResponse({'success': False, 'message': 'Acceso denegado'}, status=403)
    
    if request.method == "GET":
        try:
            # Obtener o crear información del sitio
            info_sitio, created = InformacionSitio.objects.get_or_create(
                id=1,
                defaults={
                    'titulo': "TelTec Net - Proveedor de Internet",
                    'subtitulo': "Conectando comunidades con tecnología de vanguardia",
                    'descripcion': "Somos una empresa líder en servicios de internet de alta velocidad, comprometida con brindar conectividad confiable y soporte técnico excepcional.",
                    'lema': "Conectando tu mundo digital"
                }
            )
            
            # Obtener o crear información de empresa
            empresa, created = Empresa.objects.get_or_create(
                id=1,
                defaults={
                    'nombre': "TelTec Net",
                    'direccion': "Av. Principal 123, Centro",
                    'telefono': "0999859689",
                    'email': "info@teltecnet.com",
                    'ruc': "1234567890001",
                    'horario': "Lunes a Viernes: 8:00 AM - 6:00 PM"
                }
            )
            
            # Obtener servicios
            servicios = list(Servicio.objects.filter(activo=True).values('id', 'nombre', 'descripcion', 'activo', 'orden'))
            
            # Obtener redes sociales
            redes_sociales = {}
            for red in RedSocial.objects.filter(activo=True):
                redes_sociales[red.tipo] = red.url
            
            # Obtener configuración
            config, created = ConfiguracionSitio.objects.get_or_create(
                id=1,
                defaults={
                    'mostrar_precios': True,
                    'mostrar_contacto': True,
                    'mostrar_testimonios': True,
                    'modo_mantenimiento': False
                }
            )
            
            data = {
                'informacion': {
                    'titulo': info_sitio.titulo,
                    'subtitulo': info_sitio.subtitulo,
                    'descripcion': info_sitio.descripcion,
                    'lema': info_sitio.lema
                },
                'empresa': {
                    'nombre': empresa.nombre,
                    'direccion': empresa.direccion,
                    'telefono': empresa.telefono,
                    'email': empresa.email,
                    'ruc': empresa.ruc,
                    'horario': empresa.horario
                },
                'servicios': servicios,
                'redesSociales': redes_sociales,
                'configuracion': {
                    'mostrar_precios': config.mostrar_precios,
                    'mostrar_contacto': config.mostrar_contacto,
                    'mostrar_testimonios': config.mostrar_testimonios,
                    'modo_mantenimiento': config.modo_mantenimiento
                }
            }
            
            return JsonResponse({'success': True, 'data': data})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            with transaction.atomic():
                # Actualizar información del sitio
                if 'informacion' in data:
                    info_sitio, created = InformacionSitio.objects.get_or_create(id=1)
                    info_sitio.titulo = data['informacion'].get('titulo', info_sitio.titulo)
                    info_sitio.subtitulo = data['informacion'].get('subtitulo', info_sitio.subtitulo)
                    info_sitio.descripcion = data['informacion'].get('descripcion', info_sitio.descripcion)
                    info_sitio.lema = data['informacion'].get('lema', info_sitio.lema)
                    info_sitio.save()
                
                # Actualizar información de empresa
                if 'empresa' in data:
                    empresa, created = Empresa.objects.get_or_create(id=1)
                    empresa.nombre = data['empresa'].get('nombre', empresa.nombre)
                    empresa.direccion = data['empresa'].get('direccion', empresa.direccion)
                    empresa.telefono = data['empresa'].get('telefono', empresa.telefono)
                    empresa.email = data['empresa'].get('email', empresa.email)
                    empresa.ruc = data['empresa'].get('ruc', empresa.ruc)
                    empresa.horario = data['empresa'].get('horario', empresa.horario)
                    empresa.save()
                
                # Actualizar servicios
                if 'servicios' in data:
                    # Eliminar servicios existentes
                    Servicio.objects.all().delete()
                    
                    # Crear nuevos servicios
                    for i, servicio_data in enumerate(data['servicios']):
                        Servicio.objects.create(
                            nombre=servicio_data['nombre'],
                            descripcion=servicio_data['descripcion'],
                            activo=servicio_data.get('activo', True),
                            orden=i
                        )
                
                # Actualizar redes sociales
                if 'redesSociales' in data:
                    # Eliminar redes existentes
                    RedSocial.objects.all().delete()
                    
                    # Crear nuevas redes
                    for tipo, url in data['redesSociales'].items():
                        if url.strip():  # Solo crear si hay URL
                            RedSocial.objects.create(
                                tipo=tipo,
                                url=url,
                                activo=True
                            )
                
                # Actualizar configuración
                if 'configuracion' in data:
                    config, created = ConfiguracionSitio.objects.get_or_create(id=1)
                    config.mostrar_precios = data['configuracion'].get('mostrar_precios', config.mostrar_precios)
                    config.mostrar_contacto = data['configuracion'].get('mostrar_contacto', config.mostrar_contacto)
                    config.mostrar_testimonios = data['configuracion'].get('mostrar_testimonios', config.mostrar_testimonios)
                    config.modo_mantenimiento = data['configuracion'].get('modo_mantenimiento', config.modo_mantenimiento)
                    config.save()
            
            return JsonResponse({'success': True, 'message': 'Configuración actualizada exitosamente'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def sitio_web_publico(request):
    """Vista pública para obtener información del sitio web"""
    try:
        # Obtener información del sitio
        try:
            info_sitio = InformacionSitio.objects.get(id=1)
        except InformacionSitio.DoesNotExist:
            info_sitio = None
        
        # Obtener información de empresa
        try:
            empresa = Empresa.objects.get(id=1)
        except Empresa.DoesNotExist:
            empresa = None
        
        # Obtener servicios activos
        servicios = list(Servicio.objects.filter(activo=True).values('id', 'nombre', 'descripcion', 'orden'))
        
        # Obtener redes sociales activas
        redes_sociales = {}
        for red in RedSocial.objects.filter(activo=True):
            redes_sociales[red.tipo] = red.url
        
        # Obtener configuración
        try:
            config = ConfiguracionSitio.objects.get(id=1)
        except ConfiguracionSitio.DoesNotExist:
            config = None
        
        data = {
            'informacion': {
                'titulo': info_sitio.titulo if info_sitio else "TelTec Net",
                'subtitulo': info_sitio.subtitulo if info_sitio else "",
                'descripcion': info_sitio.descripcion if info_sitio else "",
                'lema': info_sitio.lema if info_sitio else ""
            },
            'empresa': {
                'nombre': empresa.nombre if empresa else "TelTec Net",
                'direccion': empresa.direccion if empresa else "",
                'telefono': empresa.telefono if empresa else "",
                'email': empresa.email if empresa else "",
                'ruc': empresa.ruc if empresa else "",
                'horario': empresa.horario if empresa else ""
            },
            'servicios': servicios,
            'redesSociales': redes_sociales,
            'configuracion': {
                'mostrar_precios': config.mostrar_precios if config else True,
                'mostrar_contacto': config.mostrar_contacto if config else True,
                'mostrar_testimonios': config.mostrar_testimonios if config else True,
                'modo_mantenimiento': config.modo_mantenimiento if config else False
            }
        }
        
        return JsonResponse({'success': True, 'data': data})
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
