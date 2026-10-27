from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from datetime import timedelta
import logging
from notificaciones.services.telegram_service import get_telegram_service
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Procesa la cola de envíos de notificaciones'

    def handle(self, *args, **options):
        print("🚀 Iniciando procesamiento de cola de envíos...")

        # 1. Obtener notificaciones pendientes
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT q.id, q.notificacion_id, q.cliente_id, q.canal_primario, q.canal_fallback,
                       n.mensaje, n.canal, q.intentos, q.max_intentos
                FROM cola_envios q
                JOIN notificaciones n ON q.notificacion_id = n.id
                WHERE q.estado = 'pendiente'
                AND (q.proximo_reintento IS NULL OR q.proximo_reintento <= NOW())
                ORDER BY q.fecha_creacion ASC
                LIMIT 100
            """)
            pendientes = cursor.fetchall()

        if not pendientes:
            print("💤 No hay notificaciones pendientes para procesar.")
            return

        print(f"📦 Procesando {len(pendientes)} envíos...")

        telegram = get_telegram_service()
        procesadas = 0
        errores = 0

        for q_id, notif_id, cliente_id, canal_primario, canal_fallback, mensaje, canal_notif, intentos, max_intentos in pendientes:
            try:
                # Intentar envío por canal primario
                exitoso, res_id, error = self.enviar_por_canal(canal_primario, cliente_id, mensaje)

                if exitoso:
                    self.marcar_exito(q_id, notif_id, canal_primario, res_id)
                    procesadas += 1
                else:
                    # Intento fallido en primario -> Intentar canal fallback si existe
                    if canal_fallback:
                        logger.info(f"⚠️ Fallo canal primario {canal_primario} para notif {notif_id}, intentando fallback {canal_fallback}")
                        exitoso_fb, res_id_fb, error_fb = self.enviar_por_canal(canal_fallback, cliente_id, mensaje)

                        if exitoso_fb:
                            self.marcar_exito(q_id, notif_id, canal_fallback, res_id_fb)
                            procesadas += 1
                        else:
                            self.marcar_fallo(q_id, notif_id, intentos, max_intentos, error_fb)
                            errores += 1
                    else:
                        self.marcar_fallo(q_id, notif_id, intentos, max_intentos, error)
                        errores += 1

            except Exception as e:
                logger.error(f"❌ Error crítico procesando cola ID {q_id}: {str(e)}")
                errores += 1

        print(f"🏁 Finalizado: {procesadas} enviadas, {errores} errores.")

    def enviar_por_canal(self, canal, cliente_id, mensaje):
        """Abstracción de envío por canal"""
        if canal == 'telegram':
            # Buscar chat_id del cliente
            with connection.cursor() as cursor:
                cursor.execute("SELECT telegram_chat_id FROM clientes WHERE id = %s", [cliente_id])
                row = cursor.fetchone()
                chat_id = row[0] if row else None

            if not chat_id:
                return False, None, "Cliente no tiene telegram_chat_id"

            return self.telegram_send(chat_id, mensaje)

        elif canal == 'email':
            return self.email_send(cliente_id, mensaje)

        elif canal == 'sms':
            return False, None, "Soporte SMS no implementado"

        return False, None, f"Canal {canal} no soportado"

    def telegram_send(self, chat_id, mensaje):
        telegram = get_telegram_service()
        ok, res, err = telegram.send_message(chat_id, mensaje)
        return ok, res.get('message_id') if res else None, err

    def email_send(self, cliente_id, mensaje):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT email FROM clientes WHERE id = %s", [cliente_id])
                row = cursor.fetchone()
                email = row[0] if row else None

            if not email:
                return False, None, "Cliente no tiene email"

            from django.core.mail import send_mail
            from django.conf import settings

            send_mail(
                subject="Notificación TelTec Net",
                message=mensaje,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )
            return True, "email_sent", None
        except Exception as e:
            return False, None, str(e)

    def marcar_exito(self, q_id, notif_id, canal, res_id):
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE cola_envios
                SET estado = 'enviado', fecha_enviado = NOW()
                WHERE id = %s
            """, [q_id])
            cursor.execute("""
                UPDATE notificaciones
                SET estado = 'enviado', fecha_envio = NOW()
                WHERE id = %s
            """, [notif_id])
            cursor.execute("""
                INSERT INTO registros_envio (notificacion, estado, proveedor, referencia_externa, fecha_envio)
                VALUES (%s, 'enviado', %s, %s, NOW())
            """, [notif_id, canal, res_id])

    def marcar_fallo(self, q_id, notif_id, intentos, max_intentos):
        nuevo_intento = intentos + 1
        estado = 'pendiente' if nuevo_intento < max_intentos else 'fallido'

        # Backoff exponencial simple: 1h, 4h, 12h...
        delay_hours = (nuevo_intento ** 2)
        proximo = timezone.now() + timedelta(hours=delay_hours)

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE cola_envios
                SET estado = %s, intentos = %s, proximo_reintento = %s
                WHERE id = %s
            """, [estado, nuevo_intento, proximo, q_id])

            if estado == 'fallido':
                cursor.execute("""
                    UPDATE notificaciones
                    SET estado = 'fallido'
                    WHERE id = %s
                """, [notif_id])
