from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta
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
    """Listar todas las notificaciones"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT n.id, n.cliente_id, n.tipo, n.mensaje, n.fecha_envio, n.estado, n.canal, 
                       n.fecha_creacion, n.fecha_programada, n.intentos,
                       c.nombres || ' ' || c.apellidos as cliente_nombre,
                       c.telefono as cliente_telefono,
                       c.telegram_chat_id as cliente_telegram_chat_id
                FROM notificaciones n
                LEFT JOIN clientes c ON n.cliente_id = c.id
                ORDER BY n.fecha_creacion DESC
            """)
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
                    'cliente_telegram_chat_id': row[12] if row[12] else ''
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
            print(f"🔍 DEBUG - Total de clientes en la tabla: {total_clientes}")
            
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
                    c.precio_plan,
                    c.tipo_plan,
                    c.telegram_chat_id,
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
                    END as debe_pagar
                FROM clientes c
                WHERE c.estado = 'activo' OR c.estado IS NULL
                ORDER BY dias_sin_pago DESC, c.nombres ASC
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
                    'precio_plan': float(row[5]) if row[5] else 0,
                    'tipo_plan': row[6],
                    'telegram_chat_id': row[7],
                    'dias_desde_registro': int(row[8]) if row[8] else 0,
                    'dias_sin_pago': int(row[9]) if row[9] else 0,
                    'estado_pago': row[10],
                    'debe_pagar': row[11]
                })
        
        # Debug: imprimir los primeros 3 clientes
        print("🔍 DEBUG - Primeros 3 clientes:", clientes[:3] if clientes else "No hay clientes")
        print("🔍 DEBUG - Total de clientes:", len(clientes))
        
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
        canal = data.get('canal', 'telegram')
        
        if not all([cliente_id, tipo, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos requeridos: cliente_id, tipo, mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with connection.cursor() as cursor:
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
        
        # Obtener token del bot desde variables de entorno
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Enviar mensaje via Telegram API
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
    """Procesar notificaciones automáticamente"""
    try:
        procesadas = 0
        errores = 0
        errores_detalle = []
        
        # Verificar token de Telegram
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado. Configure TELEGRAM_BOT_TOKEN en las variables de entorno.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Obtener notificaciones pendientes
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT n.id, n.cliente_id, n.mensaje, n.canal, c.telegram_chat_id, c.telefono, c.email, c.nombres, c.apellidos
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.estado = 'pendiente'
                ORDER BY n.fecha_creacion ASC
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
                notif_id, cliente_id, mensaje, canal, telegram_chat_id, telefono, email, nombres, apellidos = notif
                
                if canal == 'telegram' and telegram_chat_id:
                    # Enviar por Telegram
                    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                    payload = {
                        'chat_id': telegram_chat_id,
                        'text': mensaje,
                        'parse_mode': 'HTML'
                    }
                    
                    response = requests.post(url, json=payload)
                    response_data = response.json()
                    
                    if response.status_code == 200 and response_data.get('ok'):
                        # Marcar como enviado
                        with connection.cursor() as update_cursor:
                            update_cursor.execute("""
                                UPDATE notificaciones 
                                SET estado = 'enviado', fecha_envio = %s
                                WHERE id = %s
                            """, [timezone.now(), notif_id])
                        procesadas += 1
                        logger.info(f"Notificación {notif_id} enviada exitosamente a {nombres} {apellidos}")
                    else:
                        # Marcar como fallido
                        with connection.cursor() as update_cursor:
                            update_cursor.execute("""
                                UPDATE notificaciones 
                                SET estado = 'fallido'
                                WHERE id = %s
                            """, [notif_id])
                        errores += 1
                        error_msg = response_data.get('description', 'Error desconocido')
                        errores_detalle.append(f"Cliente {nombres} {apellidos}: {error_msg}")
                        logger.error(f"Error enviando notificación {notif_id}: {error_msg}")
                else:
                    # Marcar como fallido si no hay chat_id
                    with connection.cursor() as update_cursor:
                        update_cursor.execute("""
                            UPDATE notificaciones 
                            SET estado = 'fallido'
                            WHERE id = %s
                        """, [notif_id])
                    errores += 1
                    errores_detalle.append(f"Cliente {nombres} {apellidos}: No tiene telegram_chat_id configurado")
                    logger.warning(f"Cliente {nombres} {apellidos} no tiene telegram_chat_id configurado")
                    
            except Exception as e:
                logger.error(f"Error procesando notificación {notif_id}: {str(e)}")
                errores += 1
                errores_detalle.append(f"Cliente {nombres} {apellidos}: {str(e)}")
        
        # Preparar mensaje de respuesta
        if procesadas > 0 and errores == 0:
            message = f"✅ Procesamiento completado exitosamente: {procesadas} notificaciones enviadas"
        elif procesadas > 0 and errores > 0:
            message = f"⚠️ Procesamiento completado parcialmente: {procesadas} enviadas, {errores} errores"
        else:
            message = f"❌ Procesamiento falló: {errores} errores"
        
        return Response({
            'success': True,
            'message': message,
            'data': {
                'procesadas': procesadas,
                'errores': errores,
                'errores_detalle': errores_detalle[:5]  # Solo los primeros 5 errores
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en procesamiento de notificaciones: {str(e)}")
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
        
        if not all([tipo, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos: tipo y mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener token de Telegram
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado. Configure TELEGRAM_BOT_TOKEN en las variables de entorno.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Obtener todos los clientes activos con telegram_chat_id
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, nombres, apellidos, telegram_chat_id 
                FROM clientes 
                WHERE estado = 'activo' AND telegram_chat_id IS NOT NULL
            """)
            clientes = cursor.fetchall()
            
            # Contadores para el resultado
            notificaciones_creadas = 0
            notificaciones_enviadas = 0
            notificaciones_fallidas = 0
            errores = []
            
            # Procesar cada cliente
            for cliente in clientes:
                cliente_id, nombres, apellidos, telegram_chat_id = cliente
                
                try:
                    # Crear la notificación
                    cursor.execute("""
                        INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, [cliente_id, tipo, mensaje, 'telegram', 'pendiente', timezone.now()])
                    
                    notificacion_id = cursor.fetchone()[0]
                    notificaciones_creadas += 1
                    
                    # Enviar inmediatamente por Telegram
                    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                    payload = {
                        'chat_id': telegram_chat_id,
                        'text': mensaje,
                        'parse_mode': 'HTML'
                    }
                    
                    response = requests.post(url, json=payload)
                    response_data = response.json()
                    
                    if response.status_code == 200 and response_data.get('ok'):
                        # Marcar como enviado
                        with connection.cursor() as update_cursor:
                            update_cursor.execute("""
                                UPDATE notificaciones 
                                SET estado = 'enviado', fecha_envio = %s
                                WHERE id = %s
                            """, [timezone.now(), notificacion_id])
                        notificaciones_enviadas += 1
                    else:
                        # Marcar como fallido
                        with connection.cursor() as update_cursor:
                            update_cursor.execute("""
                                UPDATE notificaciones 
                                SET estado = 'fallido'
                                WHERE id = %s
                            """, [notificacion_id])
                        notificaciones_fallidas += 1
                        error_msg = response_data.get('description', 'Error desconocido')
                        errores.append(f"Cliente {nombres} {apellidos}: {error_msg}")
                        
                except Exception as e:
                    notificaciones_fallidas += 1
                    errores.append(f"Cliente {nombres} {apellidos}: {str(e)}")
                    logger.error(f"Error procesando cliente {cliente_id}: {str(e)}")
        
        # Preparar mensaje de respuesta
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
                'errores': errores[:5]  # Solo los primeros 5 errores para no saturar la respuesta
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en notificación masiva: {str(e)}")
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
            """, [timezone.now(), notificacion_id])
            
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

@api_view(['POST'])
@permission_classes([AllowAny])
def generar_notificaciones_automaticas(request):
    """Generar notificaciones automáticas basadas en el estado de pagos"""
    try:
        notificaciones_generadas = 0
        
        with connection.cursor() as cursor:
            # Obtener clientes con pagos próximos a vencer (25-29 días)
            cursor.execute("""
                SELECT c.id, c.nombres, c.apellidos, c.telegram_chat_id,
                       EXTRACT(DAY FROM (CURRENT_DATE - c.fecha_registro)) as dias_desde_registro
                FROM clientes c
                WHERE c.estado = 'activo' 
                AND EXTRACT(DAY FROM (CURRENT_DATE - c.fecha_registro)) BETWEEN 25 AND 29
                AND NOT EXISTS (
                    SELECT 1 FROM notificaciones n 
                    WHERE n.cliente_id = c.id 
                    AND n.tipo = 'pago_proximo'
                    AND n.fecha_creacion > CURRENT_DATE - INTERVAL '7 days'
                )
            """)
            
            clientes_proximos = cursor.fetchall()
            
            for cliente in clientes_proximos:
                mensaje = f"🔔 Estimado {cliente[1]} {cliente[2]}, se aproxima la fecha de pago de su servicio de internet. Por favor acérquese a cancelar. ¡Gracias por su preferencia! - TelTec"
                
                cursor.execute("""
                    INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, [cliente[0], 'pago_proximo', mensaje, 'telegram', 'pendiente', timezone.now()])
                notificaciones_generadas += 1
            
            # Obtener clientes con pagos vencidos (30+ días)
            cursor.execute("""
                SELECT c.id, c.nombres, c.apellidos, c.telegram_chat_id,
                       EXTRACT(DAY FROM (CURRENT_DATE - c.fecha_registro)) as dias_desde_registro
                FROM clientes c
                WHERE c.estado = 'activo' 
                AND EXTRACT(DAY FROM (CURRENT_DATE - c.fecha_registro)) >= 30
                AND NOT EXISTS (
                    SELECT 1 FROM notificaciones n 
                    WHERE n.cliente_id = c.id 
                    AND n.tipo = 'pago_vencido'
                    AND n.fecha_creacion > CURRENT_DATE - INTERVAL '3 days'
                )
            """)
            
            clientes_vencidos = cursor.fetchall()
            
            for cliente in clientes_vencidos:
                mensaje = f"⚠️ Estimado {cliente[1]} {cliente[2]}, su pago está vencido. Su servicio de internet será posteriormente cortado. Acérquese a cancelar el servicio para restablecer la conexión. - TelTec"
                
                cursor.execute("""
                    INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, [cliente[0], 'pago_vencido', mensaje, 'telegram', 'pendiente', timezone.now()])
                notificaciones_generadas += 1
        
        return Response({
            'success': True,
            'message': f'Se generaron {notificaciones_generadas} notificaciones automáticas',
            'data': {
                'notificaciones_generadas': notificaciones_generadas
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al generar notificaciones automáticas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def hacer_llamada_automatizada(request):
    """Realizar llamada automatizada usando servicios externos"""
    try:
        data = request.data
        numero_telefono = data.get('numero_telefono')
        mensaje = data.get('mensaje')
        servicio = data.get('servicio', 'twilio')  # twilio, plivo, nexmo
        
        if not all([numero_telefono, mensaje]):
            return Response({
                'success': False,
                'message': 'Faltan datos: numero_telefono y mensaje'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Formatear número de teléfono
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
            # Registrar la llamada en la base de datos
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
    # Remover caracteres no numéricos
    numero_limpio = ''.join(filter(str.isdigit, str(numero)))
    
    # Si es número ecuatoriano, agregar código de país
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
            return {
                'success': False,
                'error': 'Configuración de Twilio incompleta'
            }
        
        # Crear TwiML para el mensaje
        twiml = f"""
        <Response>
            <Say voice="alice" language="es-ES">{mensaje}</Say>
            <Pause length="2"/>
            <Say voice="alice" language="es-ES">Gracias por su atención. TelTec Net.</Say>
        </Response>
        """
        
        # Enviar llamada
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
        payload = {
            'To': numero_telefono,
            'From': numero_origen,
            'Twiml': twiml
        }
        
        response = requests.post(url, auth=(account_sid, auth_token), data=payload)
        
        if response.status_code == 201:
            call_data = response.json()
            return {
                'success': True,
                'call_sid': call_data['sid'],
                'status': call_data['status']
            }
        else:
            return {
                'success': False,
                'error': f'Error Twilio: {response.text}'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def llamada_plivo(numero_telefono, mensaje):
    """Realizar llamada usando Plivo"""
    try:
        auth_id = os.getenv('PLIVO_AUTH_ID')
        auth_token = os.getenv('PLIVO_AUTH_TOKEN')
        numero_origen = os.getenv('PLIVO_PHONE_NUMBER')
        
        if not all([auth_id, auth_token, numero_origen]):
            return {
                'success': False,
                'error': 'Configuración de Plivo incompleta'
            }
        
        # Crear XML para Plivo
        plivo_xml = f"""
        <Response>
            <Speak voice="WOMAN" language="es-ES">{mensaje}</Speak>
            <Pause length="2"/>
            <Speak voice="WOMAN" language="es-ES">Gracias por su atención. TelTec Net.</Speak>
        </Response>
        """
        
        url = f"https://api.plivo.com/v1/Account/{auth_id}/Call/"
        payload = {
            'from': numero_origen,
            'to': numero_telefono,
            'answer_url': 'https://tu-servidor.com/plivo-webhook',
            'answer_method': 'POST'
        }
        
        response = requests.post(url, auth=(auth_id, auth_token), json=payload)
        
        if response.status_code == 201:
            call_data = response.json()
            return {
                'success': True,
                'call_uuid': call_data['request_uuid'],
                'status': 'queued'
            }
        else:
            return {
                'success': False,
                'error': f'Error Plivo: {response.text}'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def llamada_nexmo(numero_telefono, mensaje):
    """Realizar llamada usando Nexmo/Vonage"""
    try:
        api_key = os.getenv('NEXMO_API_KEY')
        api_secret = os.getenv('NEXMO_API_SECRET')
        numero_origen = os.getenv('NEXMO_PHONE_NUMBER')
        
        if not all([api_key, api_secret, numero_origen]):
            return {
                'success': False,
                'error': 'Configuración de Nexmo incompleta'
            }
        
        url = "https://api.nexmo.com/v1/calls"
        payload = {
            "to": [{"type": "phone", "number": numero_telefono}],
            "from": {"type": "phone", "number": numero_origen},
            "ncco": [
                {
                    "action": "talk",
                    "text": mensaje,
                    "voiceName": "Carla",
                    "language": "es-ES"
                },
                {
                    "action": "talk",
                    "text": "Gracias por su atención. TelTec Net.",
                    "voiceName": "Carla",
                    "language": "es-ES"
                }
            ]
        }
        
        response = requests.post(url, json=payload, auth=(api_key, api_secret))
        
        if response.status_code == 201:
            call_data = response.json()
            return {
                'success': True,
                'uuid': call_data['uuid'],
                'status': call_data['status']
            }
        else:
            return {
                'success': False,
                'error': f'Error Nexmo: {response.text}'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

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
        
        # Obtener información del cliente
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
        
        # Crear notificación
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, [cliente_id, tipo, mensaje, 'telegram', 'pendiente', timezone.now()])
            
            notificacion_id = cursor.fetchone()[0]
        
        resultado_llamada = None
        
        # Realizar llamada si se solicita
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
def telegram_status(request):
    """Verificar estado del bot de Telegram"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado',
                'data': {
                    'bot_activo': False,
                    'token_configurado': False,
                    'webhook_configurado': False
                }
            }, status=status.HTTP_200_OK)
        
        # Verificar si el bot está activo
        url = f"https://api.telegram.org/bot{bot_token}/getMe"
        response = requests.get(url)
        
        if response.status_code == 200:
            bot_info = response.json()
            if bot_info.get('ok'):
                return Response({
                    'success': True,
                    'message': 'Bot de Telegram activo',
                    'data': {
                        'bot_activo': True,
                        'token_configurado': True,
                        'bot_username': bot_info['result']['username'],
                        'bot_name': bot_info['result']['first_name'],
                        'webhook_configurado': False  # Por ahora no usamos webhooks
                    }
                }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Error al verificar bot de Telegram',
            'data': {
                'bot_activo': False,
                'token_configurado': True,
                'webhook_configurado': False
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}',
            'data': {
                'bot_activo': False,
                'token_configurado': False,
                'webhook_configurado': False
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def test_telegram_message(request):
    """Probar envío de mensaje de Telegram"""
    try:
        data = request.data
        chat_id = data.get('chat_id')
        mensaje = data.get('mensaje', '🧪 Mensaje de prueba desde TelTec Net')
        
        if not chat_id:
            return Response({
                'success': False,
                'message': 'chat_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Enviar mensaje de prueba
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': mensaje,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('ok'):
            return Response({
                'success': True,
                'message': 'Mensaje de prueba enviado exitosamente',
                'data': {
                    'message_id': response_data['result']['message_id'],
                    'chat_id': chat_id
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
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def telegram_estadisticas(request):
    """Obtener estadísticas detalladas de Telegram"""
    try:
        with connection.cursor() as cursor:
            # Total de clientes con Telegram configurado
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_clientes,
                    COUNT(CASE WHEN telegram_chat_id IS NOT NULL AND telegram_chat_id != '' THEN 1 END) as con_telegram,
                    COUNT(CASE WHEN telegram_chat_id IS NULL OR telegram_chat_id = '' THEN 1 END) as sin_telegram
                FROM clientes 
                WHERE estado = 'activo'
            """)
            stats_clientes = cursor.fetchone()
            
            # Estadísticas de notificaciones por canal
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
            
            # Últimas notificaciones de Telegram
            cursor.execute("""
                SELECT n.id, n.estado, n.fecha_creacion, n.fecha_envio,
                       c.nombres || ' ' || c.apellidos as cliente_nombre
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.canal = 'telegram'
                ORDER BY n.fecha_creacion DESC
                LIMIT 10
            """)
            ultimas_telegram = cursor.fetchall()
        
        return Response({
            'success': True,
            'data': {
                'clientes': {
                    'total': stats_clientes[0],
                    'con_telegram': stats_clientes[1],
                    'sin_telegram': stats_clientes[2],
                    'porcentaje_telegram': round((stats_clientes[1] / stats_clientes[0]) * 100, 2) if stats_clientes[0] > 0 else 0
                },
                'canales': [
                    {
                        'canal': row[0],
                        'total': row[1],
                        'enviadas': row[2],
                        'fallidas': row[3],
                        'pendientes': row[4]
                    } for row in stats_canales
                ],
                'ultimas_telegram': [
                    {
                        'id': row[0],
                        'estado': row[1],
                        'fecha_creacion': row[2].isoformat() if row[2] else None,
                        'fecha_envio': row[3].isoformat() if row[3] else None,
                        'cliente_nombre': row[4]
                    } for row in ultimas_telegram
                ]
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def limpiar_notificaciones(request):
    """Limpiar notificaciones según criterios"""
    try:
        data = request.data
        tipo_limpieza = data.get('tipo', 'todas')  # 'todas', 'enviadas', 'fallidas', 'antiguas'
        dias_antiguedad = data.get('dias', 30)  # Para limpiar notificaciones antiguas
        
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
                return Response({
                    'success': False,
                    'message': 'Tipo de limpieza no válido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener el número de registros eliminados
            registros_eliminados = cursor.rowcount
            
        return Response({
            'success': True,
            'message': mensaje,
            'data': {
                'registros_eliminados': registros_eliminados,
                'tipo_limpieza': tipo_limpieza
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error limpiando notificaciones: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al limpiar notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def actualizar_chat_id_cliente(request):
    """Actualizar el chat_id de Telegram de un cliente"""
    try:
        data = request.data
        cliente_id = data.get('cliente_id')
        chat_id = data.get('chat_id')
        
        if not all([cliente_id, chat_id]):
            return Response({
                'success': False,
                'message': 'Faltan datos: cliente_id y chat_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with connection.cursor() as cursor:
            # Verificar que el cliente existe
            cursor.execute("""
                SELECT id, nombres, apellidos, telegram_chat_id
                FROM clientes 
                WHERE id = %s
            """, [cliente_id])
            
            cliente = cursor.fetchone()
            if not cliente:
                return Response({
                    'success': False,
                    'message': 'Cliente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Actualizar el chat_id
            cursor.execute("""
                UPDATE clientes 
                SET telegram_chat_id = %s
                WHERE id = %s
            """, [chat_id, cliente_id])
            
            # Enviar mensaje de prueba
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            if bot_token:
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                payload = {
                    'chat_id': chat_id,
                    'text': f"✅ Hola {cliente[1]} {cliente[2]}, tu cuenta de TelTec ha sido configurada correctamente. Recibirás notificaciones importantes aquí.",
                    'parse_mode': 'HTML'
                }
                
                response = requests.post(url, json=payload)
                response_data = response.json()
                
                if response.status_code == 200 and response_data.get('ok'):
                    mensaje_exito = "Chat ID actualizado y mensaje de prueba enviado correctamente"
                else:
                    mensaje_exito = f"Chat ID actualizado pero error al enviar mensaje de prueba: {response_data.get('description', 'Error desconocido')}"
            else:
                mensaje_exito = "Chat ID actualizado pero no se pudo enviar mensaje de prueba (token no configurado)"
        
        return Response({
            'success': True,
            'message': mensaje_exito,
            'data': {
                'cliente_id': cliente_id,
                'chat_id': chat_id,
                'cliente_nombre': f"{cliente[1]} {cliente[2]}"
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error actualizando chat_id: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al actualizar chat_id: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def telegram_webhook(request):
    """Webhook para recibir mensajes de Telegram y registrar clientes automáticamente"""
    try:
        data = request.data
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
        
        # Función para enviar respuesta
        def send_telegram_response(response_text):
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                'chat_id': chat_id,
                'text': response_text,
                'parse_mode': 'HTML'
            }
            requests.post(url, json=payload)
        
        # Procesar comandos
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
            # Buscar cliente por cédula
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, nombres, apellidos, telegram_chat_id
                    FROM clientes 
                    WHERE cedula = %s
                """, [text])
                
                cliente = cursor.fetchone()
                
                if cliente:
                    cliente_id, nombres, apellidos, telegram_chat_id_existente = cliente
                    
                    if telegram_chat_id_existente:
                        if str(telegram_chat_id_existente) == str(chat_id):
                            response = f"✅ Ya estás registrado, {nombres} {apellidos}.\n\nTu servicio está activo y recibirás notificaciones importantes aquí."
                        else:
                            response = f"⚠️ Esta cédula ya está registrada con otro número de Telegram.\n\nSi es tu cédula, contacta a soporte técnico."
                    else:
                        # Registrar el chat_id
                        cursor.execute("""
                            UPDATE clientes 
                            SET telegram_chat_id = %s
                            WHERE id = %s
                        """, [chat_id, cliente_id])
                        
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
                        
                        # Crear notificación de bienvenida
                        cursor.execute("""
                            INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, [cliente_id, 'registro_exitoso', f"Cliente {nombres} {apellidos} registrado exitosamente en Telegram", 'telegram', 'enviado', timezone.now()])
                        
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
            # Buscar cliente por chat_id
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT nombres, apellidos, estado_pago, tipo_plan, precio_plan
                    FROM clientes 
                    WHERE telegram_chat_id = %s
                """, [chat_id])
                
                cliente = cursor.fetchone()
                
                if cliente:
                    nombres, apellidos, estado_pago, tipo_plan, precio_plan = cliente
                    status_message = f"""
📊 <b>Estado de tu servicio</b>

👤 <b>Cliente:</b> {nombres} {apellidos}
📡 <b>Plan:</b> {tipo_plan}
💰 <b>Precio:</b> ${precio_plan}
📋 <b>Estado:</b> {estado_pago.replace('_', ' ').title()}

✅ Tu servicio está activo y funcionando correctamente.
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
            # Mensaje no reconocido
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
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # URL del webhook (debe ser accesible desde internet)
        webhook_url = request.data.get('webhook_url', 'http://localhost:8000/api/notificaciones/telegram/webhook/')
        
        # Configurar webhook
        url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
        payload = {
            'url': webhook_url,
            'allowed_updates': ['message', 'callback_query']
        }
        
        response = requests.post(url, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('ok'):
            # Obtener información del webhook
            info_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
            info_response = requests.get(info_url)
            info_data = info_response.json()
            
            return Response({
                'success': True,
                'message': 'Webhook configurado exitosamente',
                'data': {
                    'webhook_url': webhook_url,
                    'webhook_info': info_data.get('result', {})
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': f'Error configurando webhook: {response_data.get("description", "Error desconocido")}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error configurando webhook: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error configurando webhook: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def obtener_updates_telegram(request):
    """Obtener las últimas actualizaciones de Telegram para obtener chat_ids reales"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Obtener actualizaciones
        url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
        response = requests.get(url)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('ok'):
            updates = response_data.get('result', [])
            
            # Procesar actualizaciones para extraer chat_ids
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
                    chat_ids.append({
                        'chat_id': chat_id,
                        'first_name': first_name,
                        'last_name': last_name,
                        'username': username,
                        'text': text,
                        'update_id': update.get('update_id')
                    })
            
            return Response({
                'success': True,
                'message': f'Se encontraron {len(chat_ids)} chat_ids',
                'data': {
                    'chat_ids': chat_ids,
                    'total_updates': len(updates)
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': f'Error obteniendo actualizaciones: {response_data.get("description", "Error desconocido")}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error obteniendo updates: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error obteniendo updates: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_notificacion_prueba(request):
    """Enviar notificación de prueba a un chat_id específico"""
    try:
        data = request.data
        chat_id = data.get('chat_id')
        mensaje = data.get('mensaje', '🔔 Prueba del sistema de notificaciones TelTec')
        
        if not chat_id:
            return Response({
                'success': False,
                'message': 'Falta chat_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return Response({
                'success': False,
                'message': 'Token de Telegram no configurado'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Enviar mensaje
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': mensaje,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get('ok'):
            return Response({
                'success': True,
                'message': 'Notificación enviada exitosamente',
                'data': {
                    'chat_id': chat_id,
                    'message_id': response_data.get('result', {}).get('message_id'),
                    'response': response_data
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': f'Error enviando notificación: {response_data.get("description", "Error desconocido")}',
                'data': {
                    'chat_id': chat_id,
                    'response': response_data
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error enviando notificación de prueba: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error enviando notificación de prueba: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_notificacion_individual(request, notificacion_id):
    """Enviar una notificación específica"""
    try:
        with connection.cursor() as cursor:
            # Obtener la notificación
            cursor.execute("""
                SELECT n.id, n.cliente_id, n.mensaje, n.tipo, n.canal, 
                       c.nombres, c.apellidos, c.telegram_chat_id
                FROM notificaciones n
                JOIN clientes c ON n.cliente_id = c.id
                WHERE n.id = %s
            """, [notificacion_id])
            
            notificacion = cursor.fetchone()
            if not notificacion:
                return Response({
                    'success': False,
                    'message': 'Notificación no encontrada'
                }, status=status.HTTP_404_NOT_FOUND)
            
            notif_id, cliente_id, mensaje, tipo, canal, nombres, apellidos, telegram_chat_id = notificacion
            
            # Verificar si ya fue enviada
            cursor.execute("""
                SELECT estado FROM notificaciones WHERE id = %s
            """, [notificacion_id])
            
            estado_actual = cursor.fetchone()[0]
            if estado_actual == 'enviado':
                return Response({
                    'success': False,
                    'message': 'La notificación ya fue enviada'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Enviar por Telegram si es el canal
            if canal == 'telegram' and telegram_chat_id:
                bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
                if bot_token:
                    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                    payload = {
                        'chat_id': telegram_chat_id,
                        'text': mensaje,
                        'parse_mode': 'HTML'
                    }
                    
                    response = requests.post(url, json=payload)
                    response_data = response.json()
                    
                    if response.status_code == 200 and response_data.get('ok'):
                        # Actualizar estado a enviado
                        cursor.execute("""
                            UPDATE notificaciones 
                            SET estado = 'enviado', fecha_envio = %s
                            WHERE id = %s
                        """, [timezone.now(), notificacion_id])
                        
                        return Response({
                            'success': True,
                            'message': 'Notificación enviada exitosamente',
                            'data': {
                                'notificacion_id': notificacion_id,
                                'cliente_nombre': f"{nombres} {apellidos}",
                                'canal': canal,
                                'fecha_envio': timezone.now().isoformat()
                            }
                        }, status=status.HTTP_200_OK)
                    else:
                        # Actualizar estado a fallido
                        cursor.execute("""
                            UPDATE notificaciones 
                            SET estado = 'fallido'
                            WHERE id = %s
                        """, [notificacion_id])
                        
                        return Response({
                            'success': False,
                            'message': f'Error enviando notificación: {response_data.get("description", "Error desconocido")}',
                            'data': {
                                'notificacion_id': notificacion_id,
                                'error': response_data.get('description')
                            }
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'success': False,
                        'message': 'Token de Telegram no configurado'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({
                    'success': False,
                    'message': f'Canal {canal} no soportado o cliente sin chat_id configurado'
                }, status=status.HTTP_400_BAD_REQUEST)
                
    except Exception as e:
        logger.error(f"Error enviando notificación individual: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error enviando notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
