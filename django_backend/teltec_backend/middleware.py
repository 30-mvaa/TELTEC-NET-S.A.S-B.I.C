from django.http import JsonResponse
from django.db import connection
import json


class SimpleAuthMiddleware:
    """
    Middleware simple para autenticación basada en email
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Rutas que no requieren autenticación
        public_paths = [
            '/api/auth/login/',
            '/api/auth/forgot/',
            '/api/auth/reset/',
            '/api/auth/reset-password/',
            '/api/configuracion/',
            '/api/clientes/',
            '/api/pagos/',
            '/api/deudas/',
            '/api/notificaciones/',
            '/api/reportes/',
            '/api/gastos/',
            '/admin/',
            '/admin/login/',
            '/',
        ]
        
        # Verificar si la ruta es pública
        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)
        
        # Para APIs, verificar autenticación
        if request.path.startswith('/api/'):
            # Obtener email del header o query params
            email = request.headers.get('X-User-Email') or request.GET.get('email')
            
            if not email:
                return JsonResponse({
                    'success': False,
                    'message': 'Autenticación requerida'
                }, status=401)
            
            # Verificar si el usuario existe y está activo
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, email, nombre, rol, activo 
                        FROM usuarios 
                        WHERE email = %s AND activo = true
                    """, [email])
                    user_data = cursor.fetchone()
                
                if not user_data:
                    return JsonResponse({
                        'success': False,
                        'message': 'Usuario no encontrado o inactivo'
                    }, status=401)
                
                # Agregar información del usuario a la request
                request.user_email = email
                request.user_data = {
                    'id': user_data[0],
                    'email': user_data[1],
                    'nombre': user_data[2],
                    'rol': user_data[3],
                    'activo': user_data[4]
                }
                
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Error de autenticación: {str(e)}'
                }, status=500)
        
        return self.get_response(request) 