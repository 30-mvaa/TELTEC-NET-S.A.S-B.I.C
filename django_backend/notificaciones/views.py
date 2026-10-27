from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta, date
import os
import requests
import json
import logging

# Configurar logging
logger = logging.getLogger(__name__)

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def list_notificaciones(request):
    """Listar todas las notificaciones con paginación"""
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '').strip()
        filtro_tipo = request.GET.get('tipo', 'todos')
        filtro_estado = request.GET.get('estado', 'todos')

        offset = (page - 1) * page_size

        where_clauses = []
        params = []

        if search:
            where_clauses.append("(c.nombres || ' ' || c.apellidos ILIKE %s OR n.mensaje ILIKE %s)")
            params.extend([f'%{search}%', f'%{search}%'])

        if filtro_tipo and filtro_tipo != 'todos':
            where_clauses.append("n.tipo = %s")
            params.append(filtro_tipo)

        if filtro_estado and filtro_estado != 'todos':
            where_clauses.append("n.estado = %s")
            params.append(filtro_estado)

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM notificaciones n
                LEFT JOIN clientes c ON n.cliente_id = c.id
                WHERE {where_sql}
            """, params)
            total_count = cursor.fetchone()[0]

            cursor.execute(f"""
                SELECT n.id, n.cliente_id, n.tipo, n.mensaje, n.fecha_envio, n.estado, n.canal,
                       n.fecha_creacion, n.fecha_programada, n.intentos,
                       c.nombres || ' ' || c.apellidos as cliente_nombre,
                       c.telefono as cliente_telefono,
                       c.telefono as cliente_whatsapp_number,
                       (c.telegram_chat_id IS NOT NULL AND c.telegram_chat_id <> '') as cliente_tiene_telegram
                FROM notificaciones n
                LEFT JOIN clientes c ON n.cliente_id = c.id
                WHERE {where_sql}
                ORDER BY n.fecha_creacion DESC
                LIMIT %s OFFSET %s
            """, params + [page_size, offset])

            notificaciones = []
            for row in cursor.fetchall():
                notificaciones.append({
                    'id': row[0],
                    'cliente_id': row[1],
                    'tipo': row[2],
                    'mensaje': row[3],
                    'fecha_envio': row[4].isoformat() if row[4] else None,
                    'estado': row[5],
                    'canal': row[6],
                    'fecha_creacion': row[7].isoformat() if row[7] else None,
                    'fecha_programada': row[8].isoformat() if row[8] else None,
                    'intentos': row[9],
                    'cliente_nombre': row[10] if row[10] else 'Cliente no encontrado',
                    'cliente_telefono': row[11] if row[11] else '',
                    'cliente_whatsapp_number': row[12] if row[12] else '',
                    'cliente_tiene_telegram': bool(row[13]),
                })

        return Response({
            'success': True,
            'data': {
                'results': notificaciones,
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def notificaciones_clientes(request):
    """Obtener notificaciones por cliente"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT n.id, n.cliente_id, c.nombres || ' ' || c.apellidos as nombre_completo,
                       n.tipo, n.mensaje, n.estado, n.fecha_creacion
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                ORDER BY n.fecha_creacion DESC
            """)
            notificaciones = []
            for row in cursor.fetchall():
                notificaciones.append({
                    'id': row[0],
                    'cliente_id': row[1],
                    'cliente_nombre': row[2],
                    'tipo': row[3],
                    'mensaje': row[4],
                    'estado': row[5],
                    'fecha_creacion': row[6].isoformat() if row[6] else None
                })

        return Response({
            'success': True,
            'data': notificaciones
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def estado_pagos_clientes(request):
    """Obtener estado de pagos de todos los clientes para notificaciones"""
    try:
        with connection.cursor() as cursor:
            # Primero verificar si hay clientes en la tabla
            cursor.execute("SELECT COUNT(*) FROM clientes")
            total_clientes = cursor.fetchone()[0]

            if total_clientes == 0:
                return Response({
                    'success': True,
                    'data': [],
                    'message': 'No hay clientes en la base de datos'
                }, status=status.HTTP_200_OK)

            cursor.execute("""
                SELECT
                    c.id,
                    c.nombres,
                    c.apellidos,
                    c.telefono,
                    c.email,
                    c.estado,
                    c.fecha_registro,
                    COALESCE(p.tipo_plan, 'Sin plan') as tipo_plan,
                    COALESCE(p.precio, 0) as precio_plan,
                    EXTRACT(DAY FROM (CURRENT_DATE - c.fecha_registro)) as dias_desde_registro,
                    EXTRACT(DAY FROM (CURRENT_DATE - COALESCE(
                        (SELECT MAX(fecha_pago) FROM pagos WHERE cliente_id = c.id),
                        c.fecha_registro
                    ))) as dias_sin_pago,
                    CASE
                        WHEN EXTRACT(DAY FROM (CURRENT_DATE - COALESCE(
                            (SELECT MAX(fecha_pago) FROM pagos WHERE cliente_id = c.id),
                            c.fecha_registro
                        ))) <= 25 THEN 'al_dia'
                        WHEN EXTRACT(DAY FROM (CURRENT_DATE - COALESCE(
                            (SELECT MAX(fecha_pago) FROM pagos WHERE cliente_id = c.id),
                            c.fecha_registro
                        ))) BETWEEN 26 AND 29 THEN 'proximo_vencimiento'
                        WHEN EXTRACT(DAY FROM (CURRENT_DATE - COALESCE(
                            (SELECT MAX(fecha_pago) FROM pagos WHERE cliente_id = c.id),
                            c.fecha_registro
                        ))) BETWEEN 30 AND 34 THEN 'vencido'
                        ELSE 'corte_pendiente'
                    END as estado_pago,
                    CASE
                        WHEN EXTRACT(DAY FROM (CURRENT_DATE - COALESCE(
                            (SELECT MAX(fecha_pago) FROM pagos WHERE cliente_id = c.id),
                            c.fecha_registro
                        ))) > 25 THEN true
                        ELSE false
                    END as debe_pagar,
                    COALESCE((
                        SELECT SUM(p.monto)
                        FROM pagos p
                        WHERE p.cliente_id = c.id
                        AND EXTRACT(YEAR FROM p.fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)
                    ), 0) as total_pagado_anual,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM pagos p
                        WHERE p.cliente_id = c.id
                        AND EXTRACT(YEAR FROM p.fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)
                    ), 0) as total_pagos_anual,
                    COALESCE((
                        SELECT MAX(fecha_pago)
                        FROM pagos p
                        WHERE p.cliente_id = c.id
                    ), c.fecha_registro) as ultimo_pago,
                    CASE
                        WHEN p.precio IS NOT NULL AND p.precio > 0 THEN
                            (EXTRACT(DAY FROM (CURRENT_DATE - c.fecha_registro)) / 30.0 * p.precio) -
                            COALESCE((
                                SELECT SUM(pagos.monto)
                                FROM pagos pagos
                                WHERE pagos.cliente_id = c.id
                            ), 0)
                        ELSE 0
                    END as deuda_actual
                FROM clientes c
                LEFT JOIN clientes_planes cp ON c.id = cp.id_cliente AND cp.estado = 'activo'
                LEFT JOIN planes p ON cp.id_plan = p.id_plan
                ORDER BY
                    CASE WHEN c.estado = 'activo' OR c.estado IS NULL THEN 0 ELSE 1 END,
                    dias_sin_pago DESC,
                    c.nombres ASC
            """)

            clientes = []
            for row in cursor.fetchall():
                clientes.append({
                    'id': row[0],
                    'nombre': f"{row[1].strip()} {row[2].strip()}" if row[1] and row[2] else "Cliente sin nombre",
                    'nombres': row[1].strip() if row[1] else '',
                    'apellidos': row[2].strip() if row[2] else '',
                    'telefono': row[3],
                    'email': row[4],
                    'estado': row[5] or 'activo',
                    'fecha_registro': row[6].isoformat() if row[6] else None,
                    'tipo_plan': row[7],
                    'precio_plan': float(row[8]) if row[8] else 0,
                    'dias_desde_registro': int(row[9]) if row[9] else 0,
                    'dias_sin_pago': int(row[10]) if row[10] else 0,
                    'estado_pago': row[11],
                    'debe_pagar': row[12],
                    'total_pagado_anual': float(row[13]) if row[13] else 0,
                    'total_pagos_anual': int(row[14]) if row[14] else 0,
                    'ultimo_pago': row[15].isoformat() if row[15] else None,
                    'deuda_actual': float(row[16]) if row[16] else 0
                })

        return Response({
            'success': True,
            'data': clientes
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def notificaciones_estadisticas(request):
    """Obtener estadísticas de notificaciones"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviadas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                    COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as fallidas
                FROM notificaciones
            """)
            stats = cursor.fetchone()

            cursor.execute("""
                SELECT tipo, COUNT(*) as cantidad
                FROM notificaciones
                GROUP BY tipo
            """)
            tipos = []
            for row in cursor.fetchall():
                tipos.append({
                    'tipo': row[0],
                    'cantidad': row[1]
                })

        return Response({
            'success': True,
            'data': {
                'total': stats[0],
                'enviadas': stats[1],
                'pendientes': stats[2],
                'fallidas': stats[3],
                'por_tipo': tipos
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_notificacion(request):
    """Crear una nueva notificación"""
    try:
        data = request.data
        cliente_id = data.get('cliente_id')
        tipo = data.get('tipo')
        mensaje = data.get('mensaje')
        canal = data.get('canal', 'whatsapp')

        if not all([cliente_id, tipo, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos requeridos: cliente_id, tipo, mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM clientes WHERE id = %s", [cliente_id])
            if not cursor.fetchone():
                return Response({
                    'success': False,
                    'message': 'Cliente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

            cursor.execute("""
                INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, [cliente_id, tipo, mensaje, canal, 'pendiente', timezone.now()])

            notificacion_id = cursor.fetchone()[0]

        return Response({
            'success': True,
            'message': 'Notificación creada exitosamente',
            'data': {'id': notificacion_id}
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al crear notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_telegram(request):
    """Enviar mensaje por Telegram"""
    try:
        data = request.data
        to = data.get('to')  # chat_id
        body = data.get('body')  # mensaje

        if not all([to, body]):
            return Response({
                'success': False,
                'message': 'Faltan datos: to (chat_id) y body (mensaje)'
            }, status=status.HTTP_400_BAD_REQUEST)

        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': to,
            'text': body,
            'parse_mode': 'HTML'
        }

        response = requests.post(url, json=payload)
        response_data = response.json()

        if response.status_code == 200 and response_data.get('ok'):
            return Response({
                'success': True,
                'message': 'Mensaje enviado exitosamente',
                'data': {
                    'message_id': response_data['result']['message_id']
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': f'Error al enviar mensaje: {response_data.get("description", "Error desconocido")}'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al enviar Telegram: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def procesar_notificaciones(request):
    """Procesar notificaciones automáticamente - Solo WhatsApp"""
    try:
        procesadas = 0
        errores = 0
        errores_detalle = []

        whatsapp_token = os.getenv('WHATSAPP_BUSINESS_TOKEN')
        whatsapp_phone_id = os.getenv('WHATSAPP_PHONE_ID')
        usar_whatsapp_api = whatsapp_token and whatsapp_phone_id

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT n.id, n.cliente_id, n.mensaje, n.canal, c.telefono, c.email, c.nombres, c.apellidos
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.estado = 'pendiente'
                AND n.canal = 'whatsapp'
                ORDER BY n.fecha_creacion ASC
                LIMIT 200
            """)

            notificaciones = cursor.fetchall()

        if not notificaciones:
            return Response({
                'success': True,
                'message': 'No hay notificaciones pendientes para procesar',
                'data': {
                    'procesadas': 0,
                    'errores': 0,
                    'errores_detalle': []
                }
            }, status=status.HTTP_200_OK)

        for notif in notificaciones:
            try:
                notif_id, cliente_id, mensaje, canal, telefono, email, nombres, apellidos = notif
                enviado = False
                error_mensaje = None

                if not telefono:
                    error_mensaje = "Cliente no tiene número de teléfono configurado"
                else:
                    import re
                    numero_limpio = re.sub(r'\D', '', telefono)

                    if len(numero_limpio) < 10:
                        error_mensaje = f"Número de teléfono inválido: {telefono} (menos de 10 dígitos)"
                    else:
                        if not numero_limpio.startswith('593'):
                            if len(numero_limpio) == 10:
                                numero_limpio = '593' + numero_limpio
                            elif numero_limpio.startswith('0'):
                                numero_limpio = '593' + numero_limpio[1:]
                            elif len(numero_limpio) == 9:
                                numero_limpio = '593' + numero_limpio

                        if usar_whatsapp_api:
                            try:
                                url = f"https://graph.facebook.com/v17.0/{whatsapp_phone_id}/messages"
                                headers = {
                                    'Authorization': f'Bearer {whatsapp_token}',
                                    'Content-Type': 'application/json'
                                }

                                payload = {
                                    "messaging_product": "whatsapp",
                                    "to": numero_limpio,
                                    "type": "text",
                                    "text": {
                                        "body": mensaje
                                    }
                                }

                                response = requests.post(url, headers=headers, json=payload, timeout=10)

                                if response.status_code == 200:
                                    enviado = True
                                else:
                                    try:
                                        error_data = response.json()
                                        error_mensaje = error_data.get('error', {}).get('message', f'Error HTTP {response.status_code}')
                                    except:
                                        error_mensaje = f"Error HTTP {response.status_code}: {response.text[:200]}"
                            except requests.exceptions.Timeout:
                                error_mensaje = "Timeout al conectar con WhatsApp API"
                            except requests.exceptions.RequestException as e:
                                error_mensaje = f"Error de conexión con WhatsApp API: {str(e)}"
                            except Exception as e:
                                error_mensaje = f"Error inesperado: {str(e)}"
                        else:
                            continue  # Dejar como pendiente, el frontend puede generar la URL

                with connection.cursor() as update_cursor:
                    if enviado:
                        update_cursor.execute("""
                            UPDATE notificaciones
                            SET estado = 'enviado', fecha_envio = %s, intentos = intentos + 1
                            WHERE id = %s
                        """, [timezone.now(), notif_id])
                        procesadas += 1
                    elif error_mensaje:
                        update_cursor.execute("""
                            UPDATE notificaciones
                            SET intentos = intentos + 1
                            WHERE id = %s
                        """, [notif_id])

                        update_cursor.execute("SELECT intentos FROM notificaciones WHERE id = %s", [notif_id])
                        intentos_row = update_cursor.fetchone()
                        intentos = intentos_row[0] if intentos_row else 1

                        if intentos >= 3:
                            update_cursor.execute("""
                                UPDATE notificaciones
                                SET estado = 'fallido'
                                WHERE id = %s
                            """, [notif_id])
                            errores += 1
                            errores_detalle.append(f"Cliente {nombres} {apellidos}: {error_mensaje}")

            except Exception as e:
                try:
                    with connection.cursor() as update_cursor:
                        update_cursor.execute("""
                            UPDATE notificaciones
                            SET intentos = intentos + 1
                            WHERE id = %s
                        """, [notif_id])

                        update_cursor.execute("SELECT intentos FROM notificaciones WHERE id = %s", [notif_id])
                        intentos_row = update_cursor.fetchone()
                        intentos = intentos_row[0] if intentos_row else 0

                        if intentos >= 3:
                            update_cursor.execute("""
                                UPDATE notificaciones
                                SET estado = 'fallido'
                                WHERE id = %s
                            """, [notif_id])
                            errores += 1
                            errores_detalle.append(f"Cliente {nombres} {apellidos}: Excepción - {str(e)}")
                except:
                    pass
                errores += 1

        if procesadas > 0 and errores == 0:
            message = f"✅ Procesamiento completado exitosamente: {procesadas} notificaciones enviadas por WhatsApp"
        elif procesadas > 0 and errores > 0:
            message = f"⚠️ Procesamiento completado parcialmente: {procesadas} enviadas, {errores} con errores"
        else:
            message = f"❌ No se pudieron procesar las notificaciones: {errores} errores"

        return Response({
            'success': True,
            'message': message,
            'data': {
                'procesadas': procesadas,
                'errores': errores,
                'errores_detalle': errores_detalle[:10]
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al procesar notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def notificacion_masiva(request):
    """Crear y enviar notificaciones masivas para todos los clientes"""
    try:
        data = request.data
        tipo = data.get('tipo')
        mensaje = data.get('mensaje')
        canal = 'whatsapp'

        if not all([tipo, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos: tipo y mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, nombres, apellidos, telefono
                FROM clientes
                WHERE estado = 'activo' AND telefono IS NOT NULL
            """)

            clientes = cursor.fetchall()

            notificaciones_creadas = 0
            notificaciones_enviadas = 0
            notificaciones_fallidas = 0
            errores = []

            whatsapp_token = os.getenv('WHATSAPP_BUSINESS_TOKEN')
            whatsapp_phone_id = os.getenv('WHATSAPP_PHONE_ID')
            usar_whatsapp_api = whatsapp_token and whatsapp_phone_id

            for cliente in clientes:
                cliente_id, nombres, apellidos, telefono = cliente

                try:
                    cursor.execute("""
                        INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, [cliente_id, tipo, mensaje, 'whatsapp', 'pendiente', timezone.now()])

                    notificacion_id = cursor.fetchone()[0]
                    notificaciones_creadas += 1

                    enviado = False

                    if telefono:
                        if usar_whatsapp_api:
                            import re
                            numero_limpio = re.sub(r'\D', '', telefono)
                            if not numero_limpio.startswith('593') and len(numero_limpio) == 10:
                                numero_limpio = '593' + numero_limpio

                            url = f"https://graph.facebook.com/v17.0/{whatsapp_phone_id}/messages"
                            headers = {
                                'Authorization': f'Bearer {whatsapp_token}',
                                'Content-Type': 'application/json'
                            }

                            payload = {
                                "messaging_product": "whatsapp",
                                "to": numero_limpio,
                                "type": "text",
                                "text": {
                                    "body": mensaje
                                }
                            }

                            response = requests.post(url, headers=headers, json=payload, timeout=10)
                            if response.status_code == 200:
                                enviado = True
                            else:
                                error_msg = response.json().get('error', {}).get('message', 'Error desconocido')
                                errores.append(f"Cliente {nombres} {apellidos}: {error_msg}")
                        else:
                            enviado = False
                            errores.append(f"Cliente {nombres} {apellidos}: WhatsApp API no configurada")

                    with connection.cursor() as update_cursor:
                        if enviado:
                            update_cursor.execute("""
                                UPDATE notificaciones
                                SET estado = 'enviado', fecha_envio = %s
                                WHERE id = %s
                            """, [timezone.now(), notificacion_id])
                            notificaciones_enviadas += 1
                        else:
                            update_cursor.execute("""
                                UPDATE notificaciones
                                SET estado = 'fallido'
                                WHERE id = %s
                            """, [notificacion_id])
                            notificaciones_fallidas += 1

                except Exception as e:
                    notificaciones_fallidas += 1
                    errores.append(f"Cliente {nombres} {apellidos}: {str(e)}")

        if notificaciones_enviadas > 0 and notificaciones_fallidas == 0:
            message = f"✅ Envío masivo completado exitosamente: {notificaciones_enviadas} notificaciones enviadas"
        elif notificaciones_enviadas > 0 and notificaciones_fallidas > 0:
            message = f"⚠️ Envío masivo completado parcialmente: {notificaciones_enviadas} enviadas, {notificaciones_fallidas} fallidas"
        else:
            message = f"❌ Envío masivo falló: {notificaciones_fallidas} errores"

        return Response({
            'success': True,
            'message': message,
            'data': {
                'notificaciones_creadas': notificaciones_creadas,
                'notificaciones_enviadas': notificaciones_enviadas,
                'notificaciones_fallidas': notificaciones_fallidas,
                'errores': errores[:5]
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al procesar notificaciones masivas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def mark_enviado(request, notificacion_id):
    """Marcar notificación como enviada"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE notificaciones
                SET estado = 'enviado', fecha_envio = %s
                WHERE id = %s
            """, [timezone.now(), notif_id])

            if cursor.rowcount == 0:
                return Response({
                    'success': False,
                    'message': 'Notificación no encontrada'
                }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'message': 'Notificación marcada como enviada'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al marcar notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def generar_notificaciones_automaticas(request):
    """
    GET:  vista previa de los avisos de hoy (no escribe nada).
    POST: crea los avisos y los encola en la cola de envíos para procesamiento asíncrono.
    """
    from .services.automaticas import ejecutar_notificaciones
    try:
        enviar = request.method == 'POST'
        resumen = ejecutar_notificaciones(enviar=enviar)
        if enviar:
            mensaje = (f"Se generaron {resumen['creadas']} avisos y {resumen['encoladas']} "
                       f"han sido encolados para envío automático.")
        else:
            mensaje = f"Hoy corresponden {resumen['total']} avisos"

        return Response({'success': True, 'message': mensaje, 'data': resumen}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error en notificaciones automáticas: {e}", exc_info=True)
        return Response({'success': False, 'message': f'Error al generar notificaciones automáticas: {e}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def hacer_llamada_automatizada(request):
    """Realizar llamada automatizada usando servicios externos"""
    try:
        data = request.data
        numero_telefono = data.get('numero_telefono')
        mensaje = data.get('mensaje')
        servicio = data.get('servicio', 'twilio')

        if not all([numero_telefono, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos requeridos: numero_telefono, mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)

        numero_telefono = formatear_numero_telefono(numero_telefono)

        resultado = None
        if servicio == 'twilio':
            resultado = llamada_twilio(numero_telefono, mensaje)
        elif servicio == 'plivo':
            resultado = llamada_plivo(numero_telefono, mensaje)
        elif servicio == 'nexmo':
            resultado = llamada_nexmo(numero_telefono, mensaje)
        else:
            return Response({
                'success': False,
                'message': f'Servicio no soportado: {servicio}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if resultado and resultado.get('success'):
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO llamadas_automatizadas (numero_telefono, mensaje, servicio, estado, fecha_llamada)
                    VALUES (%s, %s, %s, %s, %s)
                """, [numero_telefono, mensaje, servicio, 'completada', timezone.now()])

            return Response({
                'success': True,
                'message': 'Llamada iniciada exitosamente',
                'data': resultado
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': f'Error al realizar llamada: {resultado.get("error", "Error desconocido")}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error(f"Error en llamada automatizada: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al realizar llamada automatizada: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def formatear_numero_telefono(numero):
    """Formatear número de teléfono para servicios de llamadas"""
    numero_limpio = ''.join(filter(str.isdigit, str(numero)))
    if numero_limpio.startswith('0'):
        numero_limpio = '593' + numero_limpio[1:]
    elif numero_limpio.startswith('9') and len(numero_limpio) == 9:
        numero_limpio = '593' + numero_limpio
    return '+' + numero_limpio

def llamada_twilio(numero_telefono, mensaje):
    """Realizar llamada usando Twilio"""
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        numero_origen = os.getenv('TWILIO_PHONE_NUMBER')
        if not all([account_sid, auth_token, numero_origen]):
            return {'success': False, 'error': 'Configuración de Twilio incompleta'}

        twiml = f"""
        <Response>
            <Say voice="alice" language="es-ES">{mensaje}</Say>
            <Pause length="2"/>
            <Say voice="alice" language="es-ES">Gracias por su atención. TelTec Net.</Say>
        </Response>
        """
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
        payload = {'To': numero_telefono, 'From': numero_origen, 'Twiml': twiml}
        response = requests.post(url, auth=(account_sid, auth_token), data=payload)
        if response.status_code == 201:
            call_data = response.json()
            return {'success': True, 'call_sid': call_data['sid'], 'status': call_data['status']}
        else:
            return {'success': False, 'error': f'Error Twilio: {response.text}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def llamada_plivo(numero_telefono, mensaje):
    """Realizar llamada usando Plivo"""
    try:
        auth_id = os.getenv('PLIVO_AUTH_ID')
        auth_token = os.getenv('PLIVO_AUTH_TOKEN')
        numero_origen = os.getenv('PLIVO_PHONE_NUMBER')
        if not all([auth_id, auth_token, numero_origen]):
            return {'success': False, 'error': 'Configuración de Plivo incompleta'}

        plivo_xml = f"""
        <Response>
            <Speak voice="WOMAN" language="es-ES">{mensaje}</Speak>
            <Pause length="2"/>
            <Speak voice="WOMAN" language="es-ES">Gracias por su atención. TelTec Net.</Speak>
        </Response>
        """
        url = f"https://api.plivo.com/v1/Account/{auth_id}/Call/"
        payload = {'from': numero_origen, 'to': numero_telefono, 'answer_url': 'https://tu-servidor.com/plivo-webhook', 'answer_method': 'POST'}
        response = requests.post(url, auth=(auth_id, auth_token), json=payload)
        if response.status_code == 201:
            call_data = response.json()
            return {'success': True, 'call_uuid': call_data['request_uuid'], 'status': 'queued'}
        else:
            return {'success': False, 'error': f'Error Plivo: {response.text}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def llamada_nexmo(numero_telefono, mensaje):
    """Realizar llamada usando Nexmo/Vonage"""
    try:
        api_key = os.getenv('NEXMO_API_KEY')
        api_secret = os.getenv('NEXMO_API_SECRET')
        numero_origen = os.getenv('NEXMO_PHONE_NUMBER')
        if not all([api_key, api_secret, numero_origen]):
            return {'success': False, 'error': 'Configuración de Nexmo incompleta'}

        url = "https://api.nexmo.com/v1/calls"
        payload = {
            "to": [{"type": "phone", "number": numero_telefono}],
            "from": {"type": "phone", "number": numero_origen},
            "ncco": [
                {"action": "talk", "text": mensaje, "voiceName": "Carla", "language": "es-ES"},
                {"action": "talk", "text": "Gracias por su atención. TelTec Net.", "voiceName": "Carla", "language": "es-ES"}
            ]
        }
        response = requests.post(url, json=payload, auth=(api_key, api_secret))
        if response.status_code == 201:
            call_data = response.json()
            return {'success': True, 'uuid': call_data['uuid'], 'status': call_data['status']}
        else:
            return {'success': False, 'error': f'Error Nexmo: {response.text}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@api_view(['POST'])
@permission_classes([AllowAny])
def notificacion_con_llamada(request):
    """Crear notificación y realizar llamada automatizada"""
    try:
        data = request.data
        cliente_id = data.get('cliente_id')
        tipo = data.get('tipo')
        mensaje = data.get('mensaje')
        hacer_llamada = data.get('hacer_llamada', False)
        servicio_llamada = data.get('servicio_llamada', 'twilio')

        if not all([cliente_id, tipo, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos requeridos: cliente_id, tipo, mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT nombres, apellidos, telefono, telegram_chat_id
                FROM clientes WHERE id = %s
            """, [cliente_id])
            cliente = cursor.fetchone()
            if not cliente:
                return Response({
                    'success': False,
                    'message': 'Cliente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

        nombres, apellidos, telefono, telegram_chat_id = cliente

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, [cliente_id, tipo, mensaje, 'telegram', 'pendiente', timezone.now()])
            notificacion_id = cursor.fetchone()[0]

        resultado_llamada = None
        if hacer_llamada and telefono:
            mensaje_llamada = f"Estimado {nombres} {apellidos}. {mensaje}"
            resultado_llamada = llamada_twilio(telefono, mensaje_llamada) if servicio_llamada == 'twilio' else None

        return Response({
            'success': True,
            'message': 'Notificación creada exitosamente',
            'data': {
                'notificacion_id': notificacion_id,
                'cliente_nombre': f"{nombres} {apellidos}",
                'llamada_realizada': resultado_llamada is not None and resultado_llamada.get('success'),
                'resultado_llamada': resultado_llamada
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error en notificación con llamada: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al crear notificación con llamada: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def whatsapp_status(request):
    """Verificar estado del sistema de WhatsApp"""
    try:
        return Response({
            'success': True,
            'message': 'Sistema de WhatsApp Web disponible',
            'data': {
                'whatsapp_activo': True,
                'tipo': 'whatsapp_web',
                'descripcion': 'Redirección a WhatsApp Web para envío de mensajes'
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}',
            'data': {
                'whatsapp_activo': False,
                'tipo': 'error',
                'descripcion': 'Error en el sistema'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def test_whatsapp_message(request):
    """Probar envío de mensaje de WhatsApp"""
    try:
        data = request.data
        telefono = data.get('telefono')
        mensaje = data.get('mensaje', '🧪 Mensaje de prueba desde TelTec Net')
        if not telefono:
            return Response({'success': False, 'message': 'Número de teléfono es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        import re
        numero_limpio = re.sub(r'\D', '', telefono)
        from configuracion.models import ConfiguracionSistema
        try:
            empresa_whatsapp = ConfiguracionSistema.objects.get(clave='empresa_whatsapp').valor
            empresa_whatsapp_limpio = re.sub(r'\D', '', empresa_whatsapp)
            if not empresa_whatsapp_limpio.startswith('593'):
                if empresa_whatsapp_limpio.startswith('0'):
                    empresa_whatsapp_limpio = '593' + empresa_whatsapp_limpio[1:]
                else:
                    empresa_whatsapp_limpio = '593' + empresa_whatsapp_limpio
        except:
            empresa_whatsapp_limpio = '593984517703'

        mensaje_codificado = requests.utils.quote(mensaje)
        url_whatsapp = f"https://api.whatsapp.com/send/?phone={empresa_whatsapp_limpio}&text={mensaje_codificado}&type=phone_number&app_absent=0"

        return Response({
            'success': True,
            'message': 'URL de WhatsApp generada exitosamente',
            'data': {
                'url_whatsapp': url_whatsapp,
                'telefono': numero_limpio,
                'mensaje': mensaje
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_whatsapp_message(request):
    """Enviar mensaje de WhatsApp automáticamente usando API"""
    try:
        data = request.data
        telefono = data.get('telefono')
        mensaje = data.get('mensaje')
        if not all([telefono, mensaje]):
            return Response({'success': False, 'message': 'Número de teléfono y mensaje son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        import re
        numero_limpio = re.sub(r'\D', '', telefono)
        if len(numero_limpio) < 10:
            return Response({'success': False, 'message': 'Número de teléfono inválido. Debe tener al menos 10 dígitos.'}, status=status.HTTP_400_BAD_REQUEST)

        whatsapp_token = os.getenv('WHATSAPP_BUSINESS_TOKEN')
        whatsapp_phone_id = os.getenv('WHATSAPP_PHONE_ID')

        if not whatsapp_token or not whatsapp_phone_id:
            from configuracion.models import ConfiguracionSistema
            try:
                empresa_whatsapp = ConfiguracionSistema.objects.get(clave='empresa_whatsapp').valor
                empresa_whatsapp_limpio = re.sub(r'\D', '', empresa_whatsapp)
                if not empresa_whatsapp_limpio.startswith('593'):
                    if empresa_whatsapp_limpio.startswith('0'):
                        empresa_whatsapp_limpio = '593' + empresa_whatsapp_limpio[1:]
                    else:
                        empresa_whatsapp_limpio = '593' + empresa_whatsapp_limpio
            except:
                empresa_whatsapp_limpio = '593984517703'

            mensaje_codificado = requests.utils.quote(mensaje)
            url_whatsapp = f"https://api.whatsapp.com/send/?phone={empresa_whatsapp_limpio}&text={mensaje_codificado}&type=phone_number&app_absent=0"
            return Response({
                'success': True,
                'message': 'WhatsApp Business API no configurado. Usando envío manual.',
                'data': {'url_whatsapp': url_whatsapp, 'telefono': numero_limpio, 'mensaje': mensaje, 'metodo': 'manual'}
            }, status=status.HTTP_200_OK)

        url = f"https://graph.facebook.com/v17.0/{whatsapp_phone_id}/messages"
        headers = {'Authorization': f'Bearer {whatsapp_token}', 'Content-Type': 'application/json'}
        payload = {"messaging_product": "whatsapp", "to": numero_limpio, "type": "text", "text": {"body": mensaje}}
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            response_data = response.json()
            return Response({
                'success': True,
                'message': 'Mensaje enviado exitosamente',
                'data': {'telefono': numero_limpio, 'mensaje': mensaje, 'metodo': 'automatico', 'message_id': response_data.get('messages', [{}])[0].get('id')}
            }, status=status.HTTP_200_OK)
        else:
            from configuracion.models import ConfiguracionSistema
            try:
                empresa_whatsapp = ConfiguracionSistema.objects.get(clave='empresa_whatsapp').valor
                empresa_whatsapp_limpio = re.sub(r'\D', '', empresa_whatsapp)
                if not empresa_whatsapp_limpio.startswith('593'):
                    if empresa_whatsapp_limpio.startswith('0'):
                        empresa_whatsapp_limpio = '593' + empresa_whatsapp_limpio[1:]
                    else:
                        empresa_whatsapp_limpio = '593' + empresa_whatsapp_limpio
            except:
                empresa_whatsapp_limpio = '593984517703'
            mensaje_codificado = requests.utils.quote(mensaje)
            url_whatsapp = f"https://api.whatsapp.com/send/?phone={empresa_whatsapp_limpio}&text={mensaje_codificado}&type=phone_number&app_absent=0"
            return Response({
                'success': True,
                'message': f'Error en envío automático: {response.text}. Usando envío manual.',
                'data': {'url_whatsapp': url_whatsapp, 'telefono': numero_limpio, 'mensaje': mensaje, 'metodo': 'manual'}
            }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_urls_whatsapp_pendientes(request):
    """Obtener URLs de WhatsApp Web para notificaciones pendientes (sin API)"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT n.id, n.mensaje, c.telefono, c.nombres, c.apellidos
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.estado = 'pendiente'
                AND n.canal = 'whatsapp'
                AND c.telefono IS NOT NULL
                ORDER BY n.fecha_creacion ASC
            """)
            notificaciones = cursor.fetchall()

        urls = []
        import re
        for notif in notificaciones:
            notif_id, mensaje, telefono, nombres, apellidos = notif
            numero_limpio = re.sub(r'\D', '', telefono)
            if not numero_limpio.startswith('593'):
                if len(numero_limpio) == 10:
                    numero_limpio = '593' + numero_limpio
                elif numero_limpio.startswith('0'):
                    numero_limpio = '593' + numero_limpio[1:]
                elif len(numero_limpio) == 9:
                    numero_limpio = '593' + numero_limpio
            mensaje_codificado = requests.utils.quote(mensaje)
            url_whatsapp = f"https://api.whatsapp.com/send/?phone={numero_limpio}&text={mensaje_codificado}&type=phone_number&app_absent=0"
            urls.append({
                'notificacion_id': notif_id,
                'cliente_nombre': f"{nombres} {apellidos}",
                'telefono': numero_limpio,
                'url_whatsapp': url_whatsapp,
                'mensaje': mensaje[:100] + '...' if len(mensaje) > 100 else mensaje
            })
        return Response({'success': True, 'message': f'Se generaron {len(urls)} URLs de WhatsApp', 'data': {'urls': urls, 'total': len(urls)}}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error generando URLs de WhatsApp: {str(e)}")
        return Response({'success': False, 'message': f'Error al generar URLs: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_url_whatsapp_notificacion(request, notificacion_id):
    """Obtener URL de WhatsApp Web para una notificación específica"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT n.mensaje, c.telefono, c.nombres, c.apellidos
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.id = %s
                AND n.canal = 'whatsapp'
            """, [notificacion_id])
            notif = cursor.fetchone()
            if not notif:
                return Response({'success': False, 'message': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)
            mensaje, telefono, nombres, apellidos = notif
            if not telefono:
                return Response({'success': False, 'message': 'Cliente no tiene número de teléfono'}, status=status.HTTP_400_BAD_REQUEST)
            import re
            numero_limpio = re.sub(r'\D', '', telefono)
            if not numero_limpio.startswith('593'):
                if len(numero_limpio) == 10:
                    numero_limpio = '593' + numero_limpio
                elif numero_limpio.startswith('0'):
                    numero_limpio = '593' + numero_limpio[1:]
                elif len(numero_limpio) == 9:
                    numero_limpio = '593' + numero_limpio
            mensaje_codificado = requests.utils.quote(mensaje)
            url_whatsapp = f"https://api.whatsapp.com/send/?phone={numero_limpio}&text={mensaje_codificado}&type=phone_number&app_absent=0"
            return Response({'success': True, 'message': 'URL de WhatsApp generada', 'data': {'notificacion_id': notificacion_id, 'cliente_nombre': f"{nombres} {apellidos}", 'telefono': numero_limpio, 'url_whatsapp': url_whatsapp, 'mensaje': mensaje}}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error generando URL de WhatsApp: {str(e)}")
        return Response({'success': False, 'message': f'Error al generar URL: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def whatsapp_estadisticas(request):
    """Obtener estadísticas detalladas de WhatsApp"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*) as total_clientes,
                    COUNT(CASE WHEN telefono IS NOT NULL AND telefono != '' THEN 1 END) as con_telefono,
                    COUNT(CASE WHEN telefono IS NULL OR telefono = '' THEN 1 END) as sin_telefono
                FROM clientes
                WHERE estado = 'activo'
            """)
            stats_clientes = cursor.fetchone()
            cursor.execute("""
                SELECT
                    canal,
                    COUNT(*) as total,
                    COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviadas,
                    COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as fallidas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
                FROM notificaciones
                GROUP BY canal
            """)
            stats_canales = cursor.fetchall()
            cursor.execute("""
                SELECT n.id, n.estado, n.fecha_creacion, n.fecha_envio,
                       c.nombres || ' ' || c.apellidos as cliente_nombre
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.canal = 'whatsapp'
                ORDER BY n.fecha_creacion DESC
                LIMIT 10
            """)
            ultimas_whatsapp = cursor.fetchall()
        return Response({
            'success': True,
            'data': {
                'clientes': {
                    'total': stats_clientes[0],
                    'con_telefono': stats_clientes[1],
                    'sin_telefono': stats_clientes[2],
                    'porcentaje_telefono': round((stats_clientes[1] / stats_clientes[0]) * 100, 2) if stats_clientes[0] > 0 else 0
                },
                'canales': [
                    {'canal': row[0], 'total': row[1], 'enviadas': row[2], 'fallidas': row[3], 'pendientes': row[4]} for row in stats_canales
                ],
                'ultimas_whatsapp': [
                    {'id': row[0], 'estado': row[1], 'fecha_creacion': row[2].isoformat() if row[2] else None, 'fecha_envio': row[3].isoformat() if row[3] else None, 'cliente_nombre': row[4]} for row in ultimas_whatsapp
                ]
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def limpiar_notificaciones(request):
    """Limpiar notificaciones según criterios"""
    try:
        data = request.data
        tipo_limpieza = data.get('tipo', 'todas')
        dias_antiguedad = data.get('dias', 30)
        with connection.cursor() as cursor:
            if tipo_limpieza == 'todas':
                cursor.execute("DELETE FROM notificaciones")
                mensaje = "Todas las notificaciones han sido eliminadas"
            elif tipo_limpieza == 'enviadas':
                cursor.execute("DELETE FROM notificaciones WHERE estado = 'enviado'")
                mensaje = "Notificaciones enviadas eliminadas"
            elif tipo_limpieza == 'fallidas':
                cursor.execute("DELETE FROM notificaciones WHERE estado = 'fallido'")
                mensaje = "Notificaciones fallidas eliminadas"
            elif tipo_limpieza == 'antiguas':
                fecha_limite = timezone.now() - timedelta(days=dias_antiguedad)
                cursor.execute("DELETE FROM notificaciones WHERE fecha_creacion < %s", [fecha_limite])
                mensaje = f"Notificaciones de más de {dias_antiguedad} días eliminadas"
            else:
                return Response({'success': False, 'message': 'Tipo de limpieza no válido'}, status=status.HTTP_400_BAD_REQUEST)
            registros_eliminados = cursor.rowcount
        return Response({'success': True, 'message': mensaje, 'data': {'registros_eliminados': registros_eliminados, 'tipo_limpieza': tipo_limpieza}}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error limpiando notificaciones: {str(e)}")
        return Response({'success': False, 'message': f'Error al limpiar notificaciones: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def actualizar_chat_id_cliente(request):
    """Actualizar el chat_id de Telegram de un cliente y validar con mensaje de prueba"""
    try:
        data = request.data
        cliente_id = data.get('cliente_id')
        chat_id = data.get('chat_id')
        if not all([cliente_id, chat_id]):
            return Response({'success': False, 'message': 'Faltan datos: cliente_id y chat_id'}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("SELECT id, nombres, apellidos, telegram_chat_id FROM clientes WHERE id = %s", [cliente_id])
            cliente = cursor.fetchone()
            if not cliente:
                return Response({'success': False, 'message': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            cursor.execute("UPDATE clientes SET telegram_chat_id = %s WHERE id = %s", [chat_id, cliente_id])

            from .services.telegram_service import get_telegram_service
            tg_service = get_telegram_service()
            mensaje_bienvenida = (
                f"✅ <b>¡Bienvenido a TelTec!</b>\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"Hola <b>{cliente[1]} {cliente[2]}</b>, tu cuenta ha sido configurada correctamente.\n\n"
                f"A partir de ahora recibirás tus recordatorios de pago y avisos de servicio por este medio."
            )
            reply_markup = tg_service.create_inline_keyboard([
                ("🌐 Visitar Sitio Web", "https://teltec.net"),
                ("📞 Soporte WhatsApp", "https://wa.me/593984517703")
            ])
            ok, resp, err = tg_service.send_message(chat_id=chat_id, text=mensaje_bienvenida, reply_markup=reply_markup)
            mensaje_exito = "Chat ID actualizado y mensaje de bienvenida enviado correctamente" if ok else f"Chat ID actualizado, pero el mensaje de prueba falló: {err}. (Verifica que el usuario haya iniciado el bot)"

        return Response({'success': True, 'message': mensaje_exito, 'data': {'cliente_id': cliente_id, 'chat_id': chat_id, 'cliente_nombre': f"{cliente[1]} {cliente[2]}"}}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error actualizando chat_id: {str(e)}")
        return Response({'success': False, 'message': f'Error al actualizar chat_id: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def telegram_webhook(request):
    """Webhook para recibir mensajes de Telegram y registrar clientes automáticamente"""
    secret = os.getenv('TELEGRAM_WEBHOOK_SECRET')
    if secret and request.headers.get('X-Telegram-Bot-Api-Secret-Token') != secret:
        return Response({'status': 'forbidden'}, status=403)
    return procesar_update_telegram(request.data)

def procesar_update_telegram(data):
    """Procesa un update de Telegram (usado por el webhook y por el comando telegram_polling)"""
    try:
        message = data.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        text = message.get('text', '')
        user = message.get('from', {})
        first_name = user.get('first_name', '')
        last_name = user.get('last_name', '')
        username = user.get('username', '')
        if not chat_id:
            return Response({'status': 'error', 'message': 'No chat_id provided'}, status=400)

        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({'status': 'error', 'message': 'Bot token not configured'}, status=500)

        def send_telegram_response(response_text):
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {'chat_id': chat_id, 'text': response_text, 'parse_mode': 'HTML'}
            requests.post(url, json=payload)

        if text.startswith('/start'):
            welcome_message = """
🤖 <b>¡Bienvenido a TelTec!</b>

Soy el bot oficial de TelTec para notificaciones de servicio.

Para registrarte y recibir notificaciones sobre tu servicio de internet, por favor:

1️⃣ Envía tu número de cédula (10 dígitos)
2️⃣ Te enviaré un mensaje de confirmación
3️⃣ Recibirás notificaciones importantes sobre tu servicio

Ejemplo: <code>0302543210</code>

¿Cuál es tu número de cédula?
            """
            send_telegram_response(welcome_message)
        elif text.isdigit() and len(text) == 10:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, nombres, apellidos, telegram_chat_id FROM clientes WHERE cedula = %s", [text])
                cliente = cursor.fetchone()
                if cliente:
                    cliente_id, nombres, apellidos, telegram_chat_id_existente = cliente
                    if telegram_chat_id_existente:
                        if str(telegram_chat_id_existente) == str(chat_id):
                            response = f"✅ Ya estás registrado, {nombres} {apellidos}.\n\nTu servicio está activo y recibirás notificaciones importantes aquí."
                        else:
                            response = f"⚠️ Esta cédula ya está registrada con otro número de Telegram.\n\nSi es tu cédula, contacta a soporte técnico."
                    else:
                        cursor.execute("UPDATE clientes SET telegram_chat_id = %s WHERE id = %s", [chat_id, cliente_id])
                        response = f"""
✅ <b>¡Registro exitoso!</b>

Hola <b>{nombres} {apellidos}</b>, tu cuenta ha sido configurada correctamente.

📱 <b>Recibirás notificaciones sobre:</b>
• Recordatorios de pago
• Estado de tu servicio
• Mantenimientos programados
• Ofertas especiales

🔔 <b>Próximas notificaciones:</b>
Te enviaremos recordatorios cuando se acerque la fecha de pago de tu servicio.

¡Gracias por confiar en TelTec! 🚀
                        """
                        cursor.execute("INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion) VALUES (%s, %s, %s, %s, %s, %s)", [cliente_id, 'registro_exitoso', f"Cliente {nombres} {apellidos} registrado exitosamente en Telegram", 'telegram', 'enviado', timezone.now()])
                else:
                    response = f"""
❌ <b>Cédula no encontrada</b>

La cédula <code>{text}</code> no está registrada en nuestro sistema.

📞 <b>Para registrarte:</b>
• Contacta a soporte técnico
• Llama al: 0984517703
• Email: teltec@outlook.com

O verifica que hayas ingresado correctamente tu número de cédula.
                    """
                send_telegram_response(response)
        elif text.startswith('/help'):
            help_message = """
🤖 <b>Comandos disponibles:</b>

/start - Iniciar registro
/help - Mostrar esta ayuda
/status - Ver estado de tu servicio
/contact - Información de contacto

📞 <b>Contacto:</b>
• Teléfono: 0984517703
• Email: teltec@outlook.com
• Horario: Lunes a Domingo 8:00 - 18:00
            """
            send_telegram_response(help_message)
        elif text.startswith('/status'):
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT c.nombres, c.apellidos, c.estado, p.tipo_plan, p.precio
                    FROM clientes c
                    LEFT JOIN clientes_planes cp ON c.id = cp.id_cliente AND cp.estado = 'activo'
                    LEFT JOIN planes p ON cp.id_plan = p.id_plan
                    WHERE c.telegram_chat_id = %s
                    LIMIT 1
                """, [str(chat_id)])
                cliente = cursor.fetchone()
                if cliente:
                    nombres, apellidos, estado_cliente, tipo_plan, precio_plan = cliente
                    status_message = f"""
📊 <b>Estado de tu servicio</b>

👤 <b>Cliente:</b> {nombres} {apellidos}
📡 <b>Plan:</b> {tipo_plan or 'Sin plan asignado'}
💰 <b>Precio:</b> ${precio_plan if precio_plan is not None else '-'}
📋 <b>Estado:</b> {(estado_cliente or '').title()}
                    """
                else:
                    status_message = "❌ No estás registrado. Usa /start para registrarte."
                send_telegram_response(status_message)
        elif text.startswith('/contact'):
            contact_message = """
📞 <b>Información de contacto</b>

🏢 <b>TelTec Net S.A.S B.I.C</b>
📱 <b>WhatsApp:</b> 0984517703
📧 <b>Email:</b> teltec@outlook.com
🕒 <b>Horario:</b> Lunes a Domingo 8:00 - 18:00

📍 <b>Ubicación:</b> Sector Cullcaloma, Ecuador

💬 <b>Para soporte técnico:</b>
Envía un mensaje con tu consulta y te responderemos lo antes posible.
            """
            send_telegram_response(contact_message)
        else:
            unknown_message = """
❓ <b>Comando no reconocido</b>

Usa uno de estos comandos:
• /start - Para registrarte
• /help - Para ver ayuda
• /status - Ver estado de tu servicio
• /contact - Información de contacto

O envía tu número de cédula (10 dígitos) para registrarte.
            """
            send_telegram_response(unknown_message)
        return Response({'status': 'ok'}, status=200)
    except Exception as e:
        logger.error(f"Error en webhook de Telegram: {str(e)}")
        return Response({'status': 'error', 'message': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def configurar_webhook_telegram(request):
    """Configurar el webhook de Telegram para recibir mensajes automáticamente"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({'success': False, 'message': 'Token de Telegram no configurado'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        webhook_url = request.data.get('webhook_url') or request.build_absolute_uri('/api/notificaciones/telegram/webhook/')
        if not webhook_url.startswith('https://'):
            return Response({'success': False, 'message': 'Telegram exige una URL HTTPS pública. En local usa: python manage.py telegram_polling'}, status=status.HTTP_400_BAD_REQUEST)
        url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
        payload = {'url': webhook_url, 'allowed_updates': ['message']}
        if os.getenv('TELEGRAM_WEBHOOK_SECRET'):
            payload['secret_token'] = os.getenv('TELEGRAM_WEBHOOK_SECRET')
        response = requests.post(url, json=payload)
        response_data = response.json()
        if response.status_code == 200 and response_data.get('ok'):
            info_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
            info_response = requests.get(info_url)
            info_data = info_response.json()
            return Response({'success': True, 'message': 'Webhook configurado exitosamente', 'data': {'webhook_url': webhook_url, 'webhook_info': info_data.get('result', {})}}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'message': f'Error configurando webhook: {response_data.get("description", "Error desconocido")}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error configurando webhook: {str(e)}")
        return Response({'success': False, 'message': f'Error configurando webhook: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_updates_telegram(request):
    """Obtener las últimas actualizaciones de Telegram para obtener chat_ids reales"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({'success': False, 'message': 'Token de Telegram no configurado'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
        response = requests.get(url)
        response_data = response.json()
        if response.status_code == 200 and response_data.get('ok'):
            updates = response_data.get('result', [])
            chat_ids = []
            for update in updates:
                message = update.get('message', {})
                chat = message.get('chat', {})
                chat_id = chat.get('id')
                first_name = chat.get('first_name', '')
                last_name = chat.get('last_name', '')
                username = chat.get('username', '')
                text = message.get('text', '')
                if chat_id:
                    chat_ids.append({'chat_id': chat_id, 'first_name': first_name, 'last_name': last_name, 'username': username, 'text': text})
            return Response({'success': True, 'data': chat_ids}, status=status.HTTP_200_OK)
        return Response({'success': False, 'message': 'Error al obtener updates'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
