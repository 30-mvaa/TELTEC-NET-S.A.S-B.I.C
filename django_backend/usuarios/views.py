from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .services import UsuarioService
from datetime import datetime, timedelta


# Create your views here.


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login de usuario"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'success': False,
            'message': 'Email y contraseña son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = UsuarioService.authenticate_user(email, password)
        
        if user:
            return Response({
                'success': True,
                'message': 'Login exitoso',
                'data': user
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_info(request):
    """Obtener información del usuario actual"""
    email = request.query_params.get('email')
    
    if not email:
        return Response({
            'success': False,
            'message': 'Email es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = UsuarioService.get_user_info(email)
        
        if user:
            return Response({
                'success': True,
                'data': user
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_usuarios(request):
    """Listar todos los usuarios"""
    try:
        usuarios = UsuarioService.get_all_users()
        
        return Response({
            'success': True,
            'data': usuarios
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_usuario(request):
    """Crear nuevo usuario"""
    email = request.data.get('email')
    nombre = request.data.get('nombre')
    rol = request.data.get('rol')
    password = request.data.get('password')
    activo = request.data.get('activo', True)
    
    if not all([email, nombre, rol, password]):
        return Response({
            'success': False,
            'message': 'Todos los campos son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        success, message = UsuarioService.create_user(email, nombre, rol, password)
        
        if success:
            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_usuario(request):
    """Actualizar usuario existente"""
    user_id = request.data.get('id')
    email = request.data.get('email')
    nombre = request.data.get('nombre')
    rol = request.data.get('rol')
    activo = request.data.get('activo')
    password = request.data.get('password')
    
    if not user_id:
        return Response({
            'success': False,
            'message': 'ID de usuario es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        success, message = UsuarioService.update_user(user_id, nombre, rol, activo)
        
        if success:
            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_usuario(request, user_id):
    """Eliminar usuario"""
    try:
        success, message = UsuarioService.delete_user(user_id)
        
        if success:
            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Solicitar recuperación de contraseña"""
    email = request.data.get('email')
    
    if not email:
        return Response({
            'success': False,
            'message': 'Email es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        success, token = UsuarioService.generate_reset_token(email)
        
        if success:
            return Response({
                'success': True,
                'message': 'Se ha enviado un enlace de recuperación a su email',
                'data': {
                    'token': token,  # Solo para testing, remover en producción
                    'expires': (datetime.now() + timedelta(hours=24)).isoformat()
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': token  # token contiene el mensaje de error
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Resetear contraseña con token"""
    token = request.data.get('token')
    password = request.data.get('password')
    
    if not token or not password:
        return Response({
            'success': False,
            'message': 'Token y nueva contraseña son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        success, message = UsuarioService.reset_password(token, password)
        
        if success:
            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """Verificar si un token de reset es válido"""
    token = request.query_params.get('token')
    
    if not token:
        return Response({
            'success': False,
            'message': 'Token es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        is_valid, user_data = UsuarioService.verify_reset_token(token)
        
        if is_valid:
            return Response({
                'success': True,
                'message': 'Token válido',
                'data': {
                    'email': user_data[1]
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': user_data  # user_data contiene el mensaje de error
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
