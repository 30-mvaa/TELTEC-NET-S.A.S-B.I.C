"""
Notificaciones automáticas de cobro.

Reglas (fecha de pago = mismo día del mes en que se registró el cliente):
- pago_proximo:   faltan DIAS_ANTES (3) días o menos para la fecha de pago y el
                  cliente no tiene ese mes cubierto.
- pago_vencido:   pasaron DIAS_DESPUES (2) días o más desde la fecha de pago y
                  el cliente tiene deuda. Incluye meses adeudados y total.
- corte_servicio: igual que pago_vencido pero con MESES_CORTE (3) o más meses
                  adeudados.

Deuda = (meses transcurridos desde el registro × precio del plan) − total pagado.
Es el mismo cálculo que usa el módulo de Deudas.

Cada aviso se crea una sola vez por ciclo de pago (ver VENTANA_*). Si el cliente
está vinculado a Telegram se envía al momento; si no, queda pendiente para
enviarlo por WhatsApp desde el panel.
"""

import calendar
import logging
import math
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from django.db import connection
from django.utils import timezone

from .telegram_service import TelegramService

logger = logging.getLogger(__name__)

DIAS_ANTES = 3          # recordatorio N días antes de la fecha de pago
DIAS_DESPUES = 2        # aviso de vencido N días después de la fecha de pago
MESES_CORTE = 3         # desde cuántos meses adeudados se avisa corte
VENTANA_PROXIMO = 5     # no repetir pago_proximo dentro de N días
VENTANA_VENCIDO = 20    # no repetir pago_vencido/corte dentro de N días
MAX_DIAS_ATRASO_AVISO = 10  # si el job no corrió, se avisa igual hasta N días después


def _fecha_en_mes(anio: int, mes: int, dia: int) -> date:
    """Fecha con el día pedido, ajustada al último día si el mes es más corto."""
    return date(anio, mes, min(dia, calendar.monthrange(anio, mes)[1]))


def _sumar_meses(anio: int, mes: int, n: int):
    total = anio * 12 + (mes - 1) + n
    return total // 12, total % 12 + 1


def meses_desde_registro(registro: date, hoy: date) -> int:
    """Mismo cálculo que el módulo de deudas."""
    meses = (hoy.year - registro.year) * 12 + (hoy.month - registro.month)
    if hoy.day < registro.day:
        meses -= 1
    return max(0, meses)


def fechas_de_pago(registro: date, hoy: date):
    """Devuelve (última fecha de pago <= hoy o None, próxima fecha de pago > hoy)."""
    n = meses_desde_registro(registro, hoy)
    anio, mes = _sumar_meses(registro.year, registro.month, n)
    ultima = _fecha_en_mes(anio, mes, registro.day) if n > 0 else None
    if ultima and ultima > hoy:  # meses cortos (p. ej. registro día 31)
        ultima = None
    anio_p, mes_p = _sumar_meses(registro.year, registro.month, n + 1)
    proxima = _fecha_en_mes(anio_p, mes_p, registro.day)
    return ultima, proxima


@dataclass
class Aviso:
    cliente_id: int
    nombre: str
    tipo: str
    mensaje: str
    canal: str
    telegram_chat_id: Optional[str]
    deuda: Decimal
    meses_adeudados: int


def _ya_notificado(cursor, cliente_id: int, tipos: List[str], dias: int) -> bool:
    cursor.execute("""
        SELECT 1 FROM notificaciones
        WHERE cliente_id = %s AND tipo = ANY(%s)
          AND fecha_creacion >= NOW() - (%s || ' days')::interval
        LIMIT 1
    """, [cliente_id, tipos, str(dias)])
    return cursor.fetchone() is not None


def calcular_avisos(hoy: Optional[date] = None, cliente_id: Optional[int] = None) -> List[Aviso]:
    """Calcula qué avisos corresponden hoy. No modifica la base de datos."""
    hoy = hoy or timezone.localdate()
    avisos: List[Aviso] = []

    sql = """
        SELECT c.id, c.nombres, c.apellidos, c.fecha_registro, c.telefono,
               c.telegram_chat_id, p.precio,
               COALESCE((SELECT SUM(pg.monto) FROM pagos pg
                         WHERE pg.cliente_id = c.id AND pg.estado = 'completado'), 0)
        FROM clientes c
        JOIN clientes_planes cp ON cp.id_cliente = c.id AND cp.estado = 'activo'
        JOIN planes p ON p.id_plan = cp.id_plan
        WHERE c.estado = 'activo' AND p.precio > 0
    """
    params = []
    if cliente_id:
        sql += " AND c.id = %s"
        params.append(cliente_id)

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        filas = cursor.fetchall()

        for cid, nombres, apellidos, registro, telefono, chat_id, precio, pagado in filas:
            if not registro:
                continue
            registro = timezone.localtime(registro).date() if hasattr(registro, 'hour') else registro
            precio = Decimal(precio)
            pagado = Decimal(pagado)
            tiene_telegram = bool(chat_id and str(chat_id).strip())
            if not tiene_telegram and not telefono:
                continue

            nombre = f"{(nombres or '').strip()} {(apellidos or '').strip()}".strip()
            primer_nombre = (nombres or '').strip().split(' ')[0].title() or nombre
            canal = 'telegram' if tiene_telegram else 'whatsapp'

            meses = meses_desde_registro(registro, hoy)
            deuda = max(Decimal('0'), meses * precio - pagado)
            meses_adeudados = math.ceil(deuda / precio) if deuda > 0 else 0
            ultima, proxima = fechas_de_pago(registro, hoy)

            aviso = None

            # 1) Pago vencido: pasaron >= 2 días de la fecha de pago y hay deuda
            if ultima and deuda > 0:
                dias_atraso = (hoy - ultima).days
                if DIAS_DESPUES <= dias_atraso <= MAX_DIAS_ATRASO_AVISO and not _ya_notificado(
                        cursor, cid, ['pago_vencido', 'corte_servicio'], VENTANA_VENCIDO):
                    meses_txt = f"{meses_adeudados} mes{'es' if meses_adeudados != 1 else ''}"
                    if meses_adeudados >= MESES_CORTE:
                        tipo = 'corte_servicio'
                        mensaje = (
                            f"🚨 Hola {primer_nombre}, tu pago del {ultima:%d/%m/%Y} está vencido.\n"
                            f"Adeudas {meses_txt} de servicio, total ${deuda:.2f}.\n"
                            f"Para evitar la suspensión del servicio, acércate a cancelar lo antes posible.\n"
                            f"— TelTec Net"
                        )
                    else:
                        tipo = 'pago_vencido'
                        mensaje = (
                            f"⚠️ Hola {primer_nombre}, tu pago del {ultima:%d/%m/%Y} está vencido "
                            f"({dias_atraso} días de atraso).\n"
                            f"Adeudas {meses_txt}, total ${deuda:.2f}.\n"
                            f"Por favor realiza tu pago para mantener tu servicio activo.\n"
                            f"— TelTec Net"
                        )
                    aviso = Aviso(cid, nombre, tipo, mensaje, canal, chat_id, deuda, meses_adeudados)

            # 2) Pago próximo: faltan <= 3 días y el próximo mes no está cubierto
            if aviso is None:
                dias_restantes = (proxima - hoy).days
                cubre_proximo = pagado >= (meses + 1) * precio
                if 0 < dias_restantes <= DIAS_ANTES and not cubre_proximo and not _ya_notificado(
                        cursor, cid, ['pago_proximo'], VENTANA_PROXIMO):
                    total = deuda + precio
                    mensaje = (
                        f"🔔 Hola {primer_nombre}, te recordamos que tu fecha de pago es el "
                        f"{proxima:%d/%m/%Y} (en {dias_restantes} día{'s' if dias_restantes != 1 else ''}).\n"
                        f"Valor mensual: ${precio:.2f}."
                    )
                    if deuda > 0:
                        mensaje += (
                            f"\nAdemás tienes {meses_adeudados} mes{'es' if meses_adeudados != 1 else ''} "
                            f"pendiente{'s' if meses_adeudados != 1 else ''} (${deuda:.2f}). "
                            f"Total a pagar: ${total:.2f}."
                        )
                    mensaje += "\n— TelTec Net"
                    aviso = Aviso(cid, nombre, 'pago_proximo', mensaje, canal, chat_id, deuda, meses_adeudados)

            if aviso:
                avisos.append(aviso)

    return avisos


def ejecutar_notificaciones(enviar: bool, hoy: Optional[date] = None,
                            cliente_id: Optional[int] = None) -> dict:
    """
    Calcula los avisos del día.
    - enviar=False: solo simula (no escribe nada).
    - enviar=True: crea las notificaciones y envía por Telegram a los vinculados.
    """
    avisos = calcular_avisos(hoy=hoy, cliente_id=cliente_id)
    resumen = {
        'total': len(avisos),
        'creadas': 0,
        'enviadas_telegram': 0,
        'fallidas_telegram': 0,
        'pendientes_whatsapp': 0,
        'por_tipo': {},
        'detalle': [],
    }
    for a in avisos:
        resumen['por_tipo'][a.tipo] = resumen['por_tipo'].get(a.tipo, 0) + 1

    if not enviar:
        resumen['detalle'] = [
            {'cliente_id': a.cliente_id, 'cliente': a.nombre, 'tipo': a.tipo, 'canal': a.canal,
             'deuda': float(a.deuda), 'meses_adeudados': a.meses_adeudados, 'mensaje': a.mensaje}
            for a in avisos
        ]
        return resumen

    from .models import Notificacion, ColaEnvio

    for a in avisos:
        with connection.cursor() as cursor:
            # 1. Crear la notificación base
            cursor.execute("""
                INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion, intentos)
                VALUES (%s, %s, %s, %s, 'pendiente', NOW(), 0)
                RETURNING id
            """, [a.cliente_id, a.tipo, a.mensaje, a.canal])
            notif_id = cursor.fetchone()[0]
            resumen['creadas'] += 1

            # 2. Encolar para envío asíncrono
            # Definir canal primario y fallback
            canal_primario = a.canal
            canal_fallback = 'email' if canal_primario != 'email' else 'telegram'

            cursor.execute("""
                INSERT INTO cola_envios (
                    notificacion_id, cliente_id, canal_primario, canal_fallback,
                    estado, proximo_reintento, fecha_creacion
                )
                VALUES (%s, %s, %s, %s, 'pendiente', NOW(), NOW())
            """, [notif_id, a.cliente_id, canal_primario, canal_fallback])
            resumen['encoladas'] += 1

            resumen['detalle'].append({'cliente_id': a.cliente_id, 'cliente': a.nombre,
                                       'tipo': a.tipo, 'canal': a.canal})

            if a.canal != 'telegram' or not telegram.bot_token:
                resumen['pendientes_whatsapp'] += 1
                continue

            ok, _, error = telegram.send_message(a.telegram_chat_id, a.mensaje, parse_mode=None)
            cursor.execute("""
                UPDATE notificaciones
                SET estado = %s, intentos = 1,
                    fecha_envio = CASE WHEN %s THEN NOW() ELSE NULL END
                WHERE id = %s
            """, ['enviado' if ok else 'fallido', ok, notif_id])
            if ok:
                resumen['enviadas_telegram'] += 1
            else:
                resumen['fallidas_telegram'] += 1
                logger.warning("Telegram falló para cliente %s: %s", a.cliente_id, error)

        resumen['detalle'].append({'cliente_id': a.cliente_id, 'cliente': a.nombre,
                                   'tipo': a.tipo, 'canal': a.canal})

    logger.info("Notificaciones automáticas: %s", {k: v for k, v in resumen.items() if k != 'detalle'})
    return resumen
