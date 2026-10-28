from django.db import connection
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Usuario
from django.contrib.auth.hashers import check_password, make_password
import secrets
import string
from datetime import datetime, timedelta

class UsuarioService:
    """Servicio de Usuario - Lógica de negocio"""

    @staticmethod
    def authenticate_user(email, password):
        """Autenticar usuario"""
        try:
            user = Usuario.objects.filter(email=email, activo=True).first()

            if user and Usuario.verify_password(password, user.password):
                return {
                    'id': user.id,
                    'email': user.email,
                    'nombre': user.nombre,
                    'rol': user.rol,
                    'activo': user.activo
                }

            return None

        except Exception as e:
            print(f"Error en autenticación: {e}")
            return None

    @staticmethod
    def get_user_info(email):
        """Obtener información del usuario"""
        try:
            user = Usuario.objects.filter(email=email, activo=True).first()

            if not user:
                return None

            return {
                'id': user.id,
                'email': user.email,
                'nombre': user.nombre,
                'rol': user.rol,
                'activo': user.activo
            }

        except Exception as e:
            print(f"Error obteniendo información del usuario: {e}")
            return None

    @staticmethod
    def get_all_users():
        """Obtener todos los usuarios"""
        try:
            usuarios = Usuario.objects.all().order_by('-fecha_creacion')

            usuarios_data = []
            for user in usuarios:
                usuarios_data.append({
                    'id': user.id,
                    'email': user.email,
                    'nombre': user.nombre,
                    'rol': user.rol,
                    'activo': user.activo,
                    'fecha_creacion': user.fecha_creacion.isoformat() if user.fecha_creacion else None,
                    'fecha_actualizacion': user.fecha_actualizacion.isoformat() if user.fecha_actualizacion else None
                })

            return usuarios_data

        except Exception as e:
            print(f"Error obteniendo todos los usuarios: {e}")
            return []

    @staticmethod
    def create_user(email, nombre, rol, password):
        """Crear nuevo usuario"""
        try:
            if Usuario.objects.filter(email=email).exists():
                return False, "El email ya está registrado"

            user = Usuario.objects.create_user(
                username=email,
                email=email,
                nombre=nombre,
                rol=rol,
                password=password,
                activo=True
            )

            return True, f"Usuario creado exitosamente con ID: {user.id}"

        except Exception as e:
            print(f"Error creando usuario: {e}")
            return False, f"Error al crear usuario: {str(e)}"

    @staticmethod
    def update_user(user_id, nombre=None, rol=None, activo=None):
        """Actualizar usuario"""
        try:
            user = Usuario.objects.filter(id=user_id).first()
            if not user:
                return False, "Usuario no encontrado"

            if nombre is not None:
                user.nombre = nombre

            if rol is not None:
                valid_roles = ['administrador', 'economia', 'atencion_cliente']
                if rol not in valid_roles:
                    return False, f"Rol inválido. Roles permitidos: {', '.join(valid_roles)}"
                user.rol = rol

            if activo is not None:
                if not isinstance(activo, bool):
                    activo = str(activo).lower() == 'true'
                user.activo = activo

            user.save()
            return True, "Usuario actualizado exitosamente"

        except Exception as e:
            print(f"Error actualizando usuario: {e}")
            return False, f"Error al actualizar usuario: {str(e)}"

    @staticmethod
    def delete_user(user_id):
        """Eliminar usuario"""
        try:
            admin_count = Usuario.objects.filter(rol='administrador', activo=True).count()
            user = Usuario.objects.filter(id=user_id).first()

            if not user:
                return False, "Usuario no encontrado"

            if user.rol == 'administrador' and admin_count <= 1:
                return False, "No se puede eliminar el último administrador del sistema"

            user.delete()
            return True, "Usuario eliminado exitosamente"

        except Exception as e:
            print(f"Error eliminando usuario: {e}")
            return False, f"Error al eliminar usuario: {str(e)}"

    @staticmethod
    def generate_reset_token(email):
        """Generar token de reset de contraseña y enviar email"""
        try:
            user = Usuario.objects.filter(email=email).first()

            if not user:
                return False, "Usuario no encontrado"

            token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            expires = timezone.now() + timedelta(hours=24)

            user.reset_token = token
            user.reset_token_expires = expires
            user.save()

            if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
                user.reset_token = None
                user.reset_token_expires = None
                user.save()
                return False, "SMTP no configurado: define SMTP_USER y SMTP_PASS en .env.local"

            try:
                frontend_url = getattr(settings, 'FRONTEND_URL', None) or 'http://localhost:3000'
                reset_url = f"{frontend_url}/reset-password?token={token}"

                subject = "Recuperación de Contraseña - TelTec Net"
                message = f"""
Hola {user.nombre},

Has solicitado recuperar tu contraseña en TelTec Net.

Para restablecer tu contraseña, haz clic en el siguiente enlace:
{reset_url}

Este enlace expirará en 24 horas.

Si no solicitaste este cambio, puedes ignorar este email.

Saludos,
Equipo TelTec Net
                """

                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

                print(f"Email de recuperación enviado a: {email}")
                return True, token

            except Exception as email_error:
                import traceback
                error_detail = f"{type(email_error).__name__}: {str(email_error)}"
                print(f"Error enviando email: {error_detail}")
                traceback.print_exc()
                user.reset_token = None
                user.reset_token_expires = None
                user.save()
                return False, f"EE: {error_detail}"

        except Exception as e:
            print(f"Error generando token: {e}")
            return False, f"Error al generar token: {str(e)}"

    @staticmethod
    def verify_reset_token(token):
        """Verificar token de reset"""
        try:
            user = Usuario.objects.filter(
                reset_token=token,
                reset_token_expires__gt=timezone.now()
            ).first()

            if user:
                return True, (user.id, user.email)
            else:
                return False, "Token inválido o expirado"

        except Exception as e:
            print(f"Error verificando token: {e}")
            return False, f"Error al verificar token: {str(e)}"

    @staticmethod
    def reset_password(token, new_password):
        """Resetear contraseña"""
        try:
            is_valid, user_data = UsuarioService.verify_reset_token(token)
            if not is_valid:
                return False, user_data

            user = Usuario.objects.get(id=user_data[0])
            user.password = Usuario.hash_password(new_password)
            user.reset_token = None
            user.reset_token_expires = None
            user.save()

            return True, "Contraseña actualizada exitosamente"

        except Exception as e:
            print(f"Error reseteando contraseña: {e}")
            return False, f"Error al resetear contraseña: {str(e)}"

    @staticmethod
    def get_user_profile(email):
        """Obtener perfil completo del usuario"""
        try:
            user = Usuario.objects.filter(email=email).first()
            if not user:
                return None

            return {
                'id': user.id,
                'email': user.email,
                'nombre': user.nombre,
                'rol': user.rol,
                'activo': user.activo,
                'fecha_creacion': user.fecha_creacion.isoformat() if user.fecha_creacion else None,
                'ultimo_ingreso': user.last_activity.isoformat() if user.last_activity else None,
            }
        except Exception as e:
            print(f"Error obteniendo perfil: {e}")
            return None

    @staticmethod
    def update_user_profile(email, nombre=None):
        """Actualizar perfil del usuario"""
        try:
            user = Usuario.objects.filter(email=email).first()
            if not user:
                return False, "Usuario no encontrado"

            if nombre:
                user.nombre = nombre

            user.save()
            return True, "Perfil actualizado exitosamente"
        except Exception as e:
            print(f"Error actualizando perfil: {e}")
            return False, f"Error al actualizar perfil: {str(e)}"

    @staticmethod
    def change_user_password(email, password_actual, password_nuevo):
        """Cambiar contraseña validando la anterior"""
        try:
            user = Usuario.objects.filter(email=email).first()
            if not user:
                return False, "Usuario no encontrado"

            if not Usuario.verify_password(password_actual, user.password):
                return False, "La contraseña actual es incorrecta"

            user.password = Usuario.hash_password(password_nuevo)
            user.save()
            return True, "Contraseña cambiada exitosamente"
        except Exception as e:
            print(f"Error cambiando contraseña: {e}")
            return False, f"Error al cambiar contraseña: {str(e)}"

    @staticmethod
    def get_user_config(email):
        """Obtener configuración del usuario"""
        # Nota: Para mantener la simplicidad, si no hay modelo de config,
        # podríamos usar un modelo relacionado o mantener el SQL solo aquí
        # pero lo ideal es crear un modelo UsuarioConfig.
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT tema, notificaciones_email, sonido_notificaciones
                    FROM usuarios_config
                    WHERE usuario_email = %s
                """, [email])
                row = cursor.fetchone()
                if row:
                    return {
                        'tema': row[0] or 'sistema',
                        'notificaciones_email': row[1] if row[1] is not None else True,
                        'sonido_notificaciones': row[2] if row[2] is not None else True
                    }
                return {
                    'tema': 'sistema',
                    'notificaciones_email': True,
                    'sonido_notificaciones': True
                }
        except Exception as e:
            print(f"Error obteniendo config: {e}")
            return {
                'tema': 'sistema',
                'notificaciones_email': True,
                'sonido_notificaciones': True
            }

    @staticmethod
    def update_user_config(email, tema=None, notificaciones_email=None, sonido_notificaciones=None):
        """Actualizar configuración del usuario"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM usuarios_config WHERE usuario_email = %s", [email])
                existe = cursor.fetchone()
                if existe:
                    cursor.execute("""
                        UPDATE usuarios_config
                        SET tema = %s, notificaciones_email = %s, sonido_notificaciones = %s
                        WHERE usuario_email = %s
                    """, [tema, notificaciones_email, sonido_notificaciones, email])
                else:
                    cursor.execute("""
                        INSERT INTO usuarios_config (usuario_email, tema, notificaciones_email, sonido_notificaciones)
                        VALUES (%s, %s, %s, %s)
                    """, [email, tema, notificaciones_email, sonido_notificaciones])
            return True, "Configuración actualizada exitosamente"
        except Exception as e:
            print(f"Error actualizando config: {e}")
            return False, f"Error al actualizar config: {str(e)}"
