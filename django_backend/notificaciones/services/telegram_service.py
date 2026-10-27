"""
Servicio de Telegram para TelTec Net
Maneja envío de mensajes y notificaciones a través de Telegram Bot API
"""

import os
import requests
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple, List

logger = logging.getLogger(__name__)


class TelegramService:
    """
    Servicio para gestionar notificaciones por Telegram

    Características:
    - Enviar mensajes ricos con HTML
    - Soporte para botones interactivos (Inline Keyboards)
    - Manejar reintentos y errores
    - Registro detallado de intentos
    """

    BASE_URL = "https://api.telegram.org/bot"
    TIMEOUT = 10
    MAX_RETRIES = 3

    # Códigos de error permanentes (no reintentar)
    PERMANENT_ERROR_CODES = {
        400,  # Bad Request
        401,  # Unauthorized
        403,  # Forbidden
        404,  # Not Found
    }

    # Códigos de error temporal (reintentar)
    TEMPORARY_ERROR_CODES = {
        429,  # Too Many Requests
        500,  # Internal Server Error
        502,  # Bad Gateway
        503,  # Service Unavailable
    }

    def __init__(self, bot_token: Optional[str] = None):
        """
        Inicializar servicio Telegram
        """
        self.bot_token = bot_token or os.getenv('TELEGRAM_BOT_TOKEN', '')

        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN no configurado")

        self.base_url = f"{self.BASE_URL}{self.bot_token}"

    def validate_token(self) -> bool:
        """Verificar que el token es válido"""
        try:
            response = requests.get(
                f"{self.base_url}/getMe",
                timeout=self.TIMEOUT
            )
            result = response.json()

            if result.get('ok'):
                logger.info(f"✓ Bot Telegram válido: {result['result']['username']}")
                return True
            else:
                logger.error(f"✗ Token inválido: {result.get('description')}")
                return False
        except Exception as e:
            logger.error(f"Error validando token: {str(e)}")
            return False

    def create_inline_keyboard(self, buttons: List[Tuple[str, str]]) -> Dict[str, Any]:
        """
        Crea un teclado de botones interactivos.
        Args:
            buttons: Lista de tuplas (Texto del botón, URL)
        """
        keyboard = []
        for text, url in buttons:
            keyboard.append([{'text': text, 'url': url}])

        return {'inline_keyboard': keyboard}

    def send_message(
        self,
        chat_id: str,
        text: str,
        parse_mode: str = 'HTML',
        disable_notification: bool = False,
        reply_markup: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Enviar mensaje por Telegram con soporte para botones interactivos
        """
        if not chat_id or not text:
            return False, None, "chat_id y text son requeridos"

        payload = {
            'chat_id': str(chat_id),
            'text': text[:4096],
            'disable_notification': disable_notification,
        }
        if parse_mode:
            payload['parse_mode'] = parse_mode
        if reply_markup:
            payload['reply_markup'] = reply_markup

        try:
            response = requests.post(
                f"{self.base_url}/sendMessage",
                json=payload,
                timeout=self.TIMEOUT
            )

            result = response.json()

            if result.get('ok'):
                message_id = result['result'].get('message_id')
                logger.info(f"✓ Mensaje enviado a {chat_id} (ID: {message_id})")
                return True, result['result'], None
            else:
                error_desc = result.get('description', 'Error desconocido')
                logger.error(f"✗ Error Telegram: {error_desc}")
                return False, result, error_desc
        except requests.exceptions.Timeout:
            error = "Timeout en conexión con Telegram"
            logger.error(error)
            return False, None, error
        except Exception as e:
            error = f"Excepción: {str(e)}"
            logger.error(error)
            return False, None, error

    def send_notification(
        self,
        chat_id: str,
        notification_type: str,
        cliente_nombre: str,
        datos_adicionales: Dict[str, Any] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Enviar notificación formateada con el nuevo diseño rico
        """
        datos_adicionales = datos_adicionales or {}

        # Plantillas de notificación
        plantillas = {
            'pago_proximo': self._formato_pago_proximo,
            'pago_vencido': self._formato_pago_vencido,
            'corte_servicio': self._formato_corte_servicio,
            'recordatorio': self._formato_recordatorio,
            'promocion': self._formato_promocion,
        }

        if notification_type not in plantillas:
            return False, None, f"Tipo de notificación desconocido: {notification_type}"

        # Generar mensaje formateado
        texto = plantillas[notification_type](cliente_nombre, datos_adicionales)

        # Rediseño: Añadir botones interactivos según el tipo
        reply_markup = None
        if notification_type in ['pago_proximo', 'pago_vencido', 'corte_servicio']:
            # Botones estándar para cobros
            reply_markup = self.create_inline_keyboard([
                ("💳 Reportar Pago", "https://wa.me/TU_NUMERO_SOPORTE"),
                ("📄 Ver mi Estado", "https://teltec.net/mi-cuenta")
            ])

        # Enviar
        exitoso, respuesta, error = self.send_message(
            chat_id=chat_id,
            text=texto,
            parse_mode='HTML',
            reply_markup=reply_markup
        )

        if exitoso:
            message_id = respuesta.get('message_id') if respuesta else None
            return True, str(message_id), None
        else:
            return False, None, error

    # Plantillas de notificación REDISEÑADAS
    @staticmethod
    def _formato_pago_proximo(nombre: str, datos: Dict) -> str:
        """Formato: Pago próximo a vencer"""
        deuda = datos.get('deuda', '0.00')
        fecha = datos.get('fecha_pago', 'N/A')
        plan = datos.get('plan', 'N/A')

        return f"""
<b>📌 RECORDATORIO DE PAGO</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Hola <b>{nombre}</b>,

Te informamos que tu próximo pago se vence pronto:

📅 <b>Fecha:</b> {fecha}
💰 <b>Monto:</b> ${deuda}
📦 <b>Plan:</b> {plan}

Para evitar interrupciones en tu servicio, te recomendamos realizar tu pago a tiempo.

<b>TelTec Net - Conectividad Total</b>
"""

    @staticmethod
    def _formato_pago_vencido(nombre: str, datos: Dict) -> str:
        """Formato: Pago vencido"""
        deuda = datos.get('deuda', '0.00')
        días_atraso = datos.get('dias_atraso', '1')
        plan = datos.get('plan', 'N/A')

        return f"""
<b>⚠️ AVISO DE PAGO VENCIDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Hola <b>{nombre}</b>,

Hemos detectado que tu pago presenta un atraso de <b>{días_atraso} días</b>:

💰 <b>Deuda Total:</b> ${deuda}
📦 <b>Plan:</b> {plan}

Por favor, regulariza tu situación lo antes posible para mantener tu servicio activo.

<b>TelTec Net - Soporte Técnico</b>
"""

    @staticmethod
    def _formato_corte_servicio(nombre: str, datos: Dict) -> str:
        """Formato: Aviso de corte de servicio"""
        deuda = datos.get('deuda', '0.00')
        plan = datos.get('plan', 'N/A')

        return f"""
<b>🚨 AVISO URGENTE: CORTE DE SERVICIO</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Hola <b>{nombre}</b>,

Tu cuenta presenta un atraso crítico. <b>Tu servicio será suspendido en 48 horas</b> si no regularizas el monto pendiente:

💰 <b>Deuda Total:</b> ${deuda}
📦 <b>Plan:</b> {plan}

<b>ACCIONES REQUERIDAS:</b>
1. Realizar el pago inmediatamente.
2. Enviar comprobante vía WhatsApp.

<b>TelTec Net - Administración</b>
"""

    @staticmethod
    def _formato_recordatorio(nombre: str, datos: Dict) -> str:
        """Formato: Recordatorio genérico"""
        mensaje = datos.get('mensaje', '')
        return f"""
<b>📢 NOTIFICACIÓN GENERAL</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Hola <b>{nombre}</b>,

{mensaje}

Gracias por ser parte de TelTec Net.
"""

    @staticmethod
    def _formato_promocion(nombre: str, datos: Dict) -> str:
        """Formato: Promoción/Marketing"""
        titulo = datos.get('titulo', 'Nueva Promoción')
        descripcion = datos.get('descripcion', '')

        return f"""
<b>🎉 {titulo.upper()}</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Hola <b>{nombre}</b>,

{descripcion}

¡No pierdas esta oportunidad! Contacta con nosotros para más información.

<b>TelTec Net - Ventas</b>
"""

    def determine_retry_strategy(
        self,
        error_code: Optional[int],
        error_msg: str,
        current_attempts: int
    ) -> Dict[str, Any]:
        """
        Determinar estrategia de reintento basada en el error
        """
        if error_code in self.PERMANENT_ERROR_CODES:
            return {
                'debe_reintentar': False,
                'delay_minutos': 0,
                'es_error_permanente': True,
                'razon': f'Error permanente (HTTP {error_code}): {error_msg}'
            }

        if error_code in self.TEMPORARY_ERROR_CODES or error_code is None:
            if current_attempts >= self.MAX_RETRIES:
                return {
                    'debe_reintentar': False,
                    'delay_minutos': 0,
                    'es_error_permanente': False,
                    'razon': f'Máximo de reintentos alcanzado ({self.MAX_RETRIES})'
                }

            delays = [1, 5, 15, 60]
            delay = delays[min(current_attempts, len(delays) - 1)]

            return {
                'debe_reintentar': True,
                'delay_minutos': delay,
                'es_error_permanente': False,
                'razon': f'Error temporal - reintentando en {delay} minuto(s)'
            }

        return {
            'debe_reintentar': current_attempts < 2,
            'delay_minutos': 5,
            'es_error_permanente': False,
            'razon': 'Error desconocido - reintentando con precaución'
        }

    def format_error_message(self, error: str, context: Dict = None) -> str:
        """Formatear mensaje de error con contexto"""
        context = context or {}

        error_map = {
            'invalid_chat_id': 'ID de chat inválido',
            'chat_not_found': 'Chat no encontrado',
            'user_blocked_bot': 'Usuario bloqueó el bot',
            'bot_blocked_by_user': 'Bot bloqueado por usuario',
            'bot_kicked_from_chat': 'Bot removido del chat',
        }

        descriptivo = error_map.get(error, error)
        if context:
            return f"{descriptivo} - {context}"
        return descriptivo

# Instancia global
_telegram_service_instance = None


def get_telegram_service() -> TelegramService:
    """
    Obtener instancia singleton del servicio Telegram
    """
    global _telegram_service_instance
    if _telegram_service_instance is None:
        _telegram_service_instance = TelegramService()
    return _telegram_service_instance
