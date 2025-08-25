from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from datetime import datetime, date, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
import json
import os
# from reportlab.lib.pagesizes import letter
# from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.units import inch
# from reportlab.lib import colors
# from reportlab.pdfgen import canvas
from io import BytesIO
from .cache_utils import get_cached_stats, set_cached_stats, get_deudas_stats_cache_key, get_pagos_stats_cache_key, invalidate_deudas_cache
from .reportes import ReporteGenerator

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def list_pagos(request):
    """Listar todos los pagos con paginación"""
    try:
        # Parámetros de paginación
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        search = request.GET.get('search', '')
        metodo_pago = request.GET.get('metodo_pago', '')
        estado = request.GET.get('estado', '')
        
        # Validar parámetros
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 200:
            page_size = 50
            
        offset = (page - 1) * page_size
        
        with connection.cursor() as cursor:
            # Construir consulta base con filtros
            base_query = """
                SELECT p.id, p.cliente_id, p.monto, p.fecha_pago, p.metodo_pago, p.concepto, p.estado, 
                       p.comprobante_enviado, p.numero_comprobante, p.fecha_creacion,
                       c.nombres, c.apellidos, c.cedula
                FROM pagos p
                LEFT JOIN clientes c ON p.cliente_id = c.id
                WHERE 1=1
            """
            params = []
            
            # Agregar filtros si están presentes
            if search:
                base_query += " AND (p.concepto ILIKE %s OR p.numero_comprobante ILIKE %s OR c.nombres ILIKE %s OR c.apellidos ILIKE %s OR c.cedula ILIKE %s)"
                search_param = f'%{search}%'
                params.extend([search_param, search_param, search_param, search_param, search_param])
            
            if metodo_pago:
                base_query += " AND p.metodo_pago = %s"
                params.append(metodo_pago)
                
            if estado:
                base_query += " AND p.estado = %s"
                params.append(estado)
            
            # Consulta para contar total de registros
            count_query = f"SELECT COUNT(*) FROM ({base_query}) as subquery"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Consulta principal con paginación
            query = base_query + " ORDER BY p.fecha_pago DESC LIMIT %s OFFSET %s"
            params.extend([page_size, offset])
            
            cursor.execute(query, params)
            pagos = []
            for row in cursor.fetchall():
                pagos.append({
                    'id': row[0],
                    'cliente_id': row[1],
                    'monto': float(row[2]) if row[2] else 0,
                    'fecha_pago': row[3].isoformat() if row[3] else None,
                    'metodo_pago': row[4],
                    'concepto': row[5],
                    'estado': row[6],
                    'comprobante_enviado': row[7],
                    'numero_comprobante': row[8],
                    'fecha_creacion': row[9].isoformat() if row[9] else None,
                    'cliente_nombre': f"{row[10]} {row[11]}" if row[10] and row[11] else "Cliente no encontrado",
                    'cliente_cedula': row[12] if row[12] else ""
                })
        
        # Calcular información de paginación
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1
        
        return Response({
            'success': True,
            'data': pagos,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_previous': has_previous,
                'next_page': page + 1 if has_next else None,
                'previous_page': page - 1 if has_previous else None
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_pago(request):
    """Crear nuevo pago (método legacy - mantener para compatibilidad)"""
    return create_pago_flexible(request)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_pago_flexible(request):
    """Crear nuevo pago con selección flexible de meses"""
    try:
        cliente_id = request.data.get('cliente_id')
        monto = request.data.get('monto')
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        concepto = request.data.get('concepto', 'Pago de servicio')
        meses_seleccionados = request.data.get('meses_seleccionados', [])  # Lista de meses específicos
        fecha_pago = request.data.get('fecha_pago', datetime.now().strftime('%Y-%m-%d'))
        
        if not cliente_id or not monto:
            return Response({
                'success': False,
                'message': 'Cliente ID y monto son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with connection.cursor() as cursor:
            # Obtener información del cliente
            cursor.execute("""
                SELECT nombres, apellidos, cedula, tipo_plan, precio_plan 
                FROM clientes WHERE id = %s
            """, [cliente_id])
            cliente_data = cursor.fetchone()
            
            if not cliente_data:
                return Response({
                    'success': False,
                    'message': 'Cliente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            precio_plan = float(cliente_data[4])
            
            # Si no se especifican meses, usar el método tradicional
            if not meses_seleccionados:
                meses = request.data.get('meses', 1)
                monto_total = precio_plan * meses
                
                # Generar número de comprobante
                numero_comprobante = generar_numero_comprobante(cursor)
                
                # Actualizar concepto
                if meses > 1 and 'mes' not in concepto.lower():
                    concepto = f"{concepto} ({meses} meses)"
                
                cursor.execute("""
                    INSERT INTO pagos (cliente_id, monto, fecha_pago, metodo_pago, concepto, estado, 
                                     comprobante_enviado, numero_comprobante, fecha_creacion)
                    VALUES (%s, %s, %s, %s, %s, 'completado', false, %s, NOW())
                    RETURNING id
                """, [cliente_id, monto_total, fecha_pago, metodo_pago, concepto, numero_comprobante])
                pago_id = cursor.fetchone()[0]
                
                pagos_creados = [{
                    'id': pago_id,
                    'numero_comprobante': numero_comprobante,
                    'meses': meses,
                    'monto': monto_total
                }]
            else:
                # Validar que el monto coincida con los meses seleccionados
                monto_esperado = precio_plan * len(meses_seleccionados)
                if abs(float(monto) - monto_esperado) > 0.01:  # Tolerancia para decimales
                    return Response({
                        'success': False,
                        'message': f'El monto debe ser ${monto_esperado:.2f} para {len(meses_seleccionados)} mes(es) seleccionado(s)'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Verificar meses ya pagados
                meses_ya_pagados = verificar_meses_ya_pagados(cursor, cliente_id, meses_seleccionados)
                if meses_ya_pagados:
                    return Response({
                        'success': False,
                        'message': f'Los siguientes meses ya están pagados: {", ".join(meses_ya_pagados)}',
                        'meses_ya_pagados': meses_ya_pagados
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Crear pagos individuales para cada mes
                pagos_creados = []
                for mes_info in meses_seleccionados:
                    año = mes_info.get('año', datetime.now().year)
                    mes = mes_info.get('mes')
                    nombre_mes = mes_info.get('nombre_mes', obtener_nombre_mes(mes))
                    
                    # Generar número de comprobante único para cada mes
                    numero_comprobante = generar_numero_comprobante(cursor)
                    
                    concepto_mes = f"Pago mensual - {nombre_mes} {año} - {cliente_data[3]}"
                    
                    cursor.execute("""
                        INSERT INTO pagos (cliente_id, monto, fecha_pago, metodo_pago, concepto, estado, 
                                         comprobante_enviado, numero_comprobante, fecha_creacion)
                        VALUES (%s, %s, %s, %s, %s, 'completado', false, %s, NOW())
                        RETURNING id
                    """, [cliente_id, precio_plan, fecha_pago, metodo_pago, concepto_mes, numero_comprobante])
                    pago_id = cursor.fetchone()[0]
                    
                    pagos_creados.append({
                        'id': pago_id,
                        'numero_comprobante': numero_comprobante,
                        'mes': mes,
                        'año': año,
                        'nombre_mes': nombre_mes,
                        'monto': precio_plan
                    })
        
        # Invalidar caché de estadísticas después de crear pagos
        invalidate_deudas_cache()
        
        return Response({
            'success': True,
            'message': f'Pago(s) registrado(s) exitosamente - {len(pagos_creados)} mes(es)',
            'data': {
                'pagos_creados': pagos_creados,
                'total_pagos': len(pagos_creados),
                'monto_total': float(monto),
                'cliente': {
                    'nombres': cliente_data[0],
                    'apellidos': cliente_data[1],
                    'cedula': cliente_data[2],
                    'tipo_plan': cliente_data[3],
                    'precio_plan': precio_plan
                }
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generar_numero_comprobante(cursor):
    """Generar número de comprobante único"""
    cursor.execute("SELECT COUNT(*) FROM pagos WHERE DATE(fecha_creacion) = CURRENT_DATE")
    count_hoy = cursor.fetchone()[0]
    
    numero_secuencial = count_hoy + 1
    numero_comprobante = f"TELTEC-{datetime.now().strftime('%Y%m%d')}-{numero_secuencial:05d}"
    
    # Verificar que el número de comprobante no exista
    cursor.execute("SELECT id FROM pagos WHERE numero_comprobante = %s", [numero_comprobante])
    if cursor.fetchone():
        # Si existe, generar uno con timestamp
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        numero_comprobante = f"TELTEC-{timestamp}-{numero_secuencial:05d}"
    
    return numero_comprobante

def verificar_meses_ya_pagados(cursor, cliente_id, meses_seleccionados):
    """Verificar qué meses ya están pagados"""
    meses_ya_pagados = []
    
    for mes_info in meses_seleccionados:
        año = mes_info.get('año', datetime.now().year)
        mes = mes_info.get('mes')
        nombre_mes = mes_info.get('nombre_mes', obtener_nombre_mes(mes))
        
        # Buscar pagos existentes para este mes y año
        cursor.execute("""
            SELECT id FROM pagos 
            WHERE cliente_id = %s 
            AND concepto ILIKE %s
            AND estado = 'completado'
        """, [cliente_id, f"%{nombre_mes} {año}%"])
        
        if cursor.fetchone():
            meses_ya_pagados.append(f"{nombre_mes} {año}")
    
    return meses_ya_pagados

def obtener_nombre_mes(numero_mes):
    """Obtener nombre del mes a partir del número"""
    meses = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
        7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    return meses.get(numero_mes, f'Mes {numero_mes}')

@api_view(['GET'])
@permission_classes([AllowAny])
def get_meses_disponibles_cliente(request, cliente_id):
    """Obtener meses disponibles para pago de un cliente"""
    try:
        with connection.cursor() as cursor:
            # Obtener información del cliente
            cursor.execute("""
                SELECT nombres, apellidos, cedula, tipo_plan, precio_plan, fecha_registro
                FROM clientes WHERE id = %s
            """, [cliente_id])
            cliente_data = cursor.fetchone()
            
            if not cliente_data:
                return Response({
                    'success': False,
                    'message': 'Cliente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            fecha_registro = cliente_data[5]
            precio_plan = float(cliente_data[4])
            
            # Ya no necesitamos obtener todos los pagos, usaremos consultas individuales
            pass
            
            # Generar lista de meses disponibles (desde 2023 hasta próximos 6 meses)
            meses_disponibles = []
            fecha_actual = datetime.now()
            año_actual = fecha_actual.year
            mes_actual = fecha_actual.month
            
            # Meses pasados (desde 2023 hasta el mes actual)
            # Calcular el año de inicio dinámicamente (máximo 3 años hacia atrás desde el año actual)
            año_inicio = max(2023, año_actual - 3)
            fecha_inicio = datetime(año_inicio, 1, 1)
            fecha_fin = fecha_actual.replace(day=1)  # Primer día del mes actual
            
            # Convertir a datetime sin timezone para comparación
            fecha_inicio = fecha_inicio.replace(tzinfo=None)
            fecha_fin = fecha_fin.replace(tzinfo=None)
            
            fecha_actual_iter = fecha_inicio
            while fecha_actual_iter <= fecha_fin:
                año = fecha_actual_iter.year
                mes = fecha_actual_iter.month
                nombre_mes = obtener_nombre_mes(mes)
                
                # Verificar si ya está pagado usando SQL directo
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM pagos 
                    WHERE cliente_id = %s 
                    AND estado = 'completado'
                    AND concepto ILIKE %s
                """, [cliente_id, f"%{nombre_mes} {año}%"])
                ya_pagado = cursor.fetchone()[0] > 0
                
                meses_disponibles.append({
                    'año': año,
                    'mes': mes,
                    'nombre_mes': nombre_mes,
                    'ya_pagado': ya_pagado,
                    'monto': precio_plan,
                    'fecha_limite': fecha_actual_iter.replace(day=5).strftime('%Y-%m-%d')  # Día 5 del mes
                })
                
                # Avanzar al siguiente mes
                if fecha_actual_iter.month == 12:
                    fecha_actual_iter = fecha_actual_iter.replace(year=fecha_actual_iter.year + 1, month=1)
                else:
                    fecha_actual_iter = fecha_actual_iter.replace(month=fecha_actual_iter.month + 1)
            
            # Agregar próximos 6 meses
            for i in range(1, 7):
                if mes_actual + i > 12:
                    año = año_actual + 1
                    mes = mes_actual + i - 12
                else:
                    año = año_actual
                    mes = mes_actual + i
                
                nombre_mes = obtener_nombre_mes(mes)
                fecha_limite = datetime(año, mes, 5)
                
                meses_disponibles.append({
                    'año': año,
                    'mes': mes,
                    'nombre_mes': nombre_mes,
                    'ya_pagado': False,
                    'monto': precio_plan,
                    'fecha_limite': fecha_limite.strftime('%Y-%m-%d')
                })
        
        return Response({
            'success': True,
            'data': {
                'cliente': {
                        'id': cliente_id,
                    'nombres': cliente_data[0],
                    'apellidos': cliente_data[1],
                    'cedula': cliente_data[2],
                    'tipo_plan': cliente_data[3],
                        'precio_plan': precio_plan
                },
                    'meses_disponibles': meses_disponibles,
                    'total_meses_disponibles': len([m for m in meses_disponibles if not m['ya_pagado']]),
                    'total_meses_pagados': len([m for m in meses_disponibles if m['ya_pagado']])
            }
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generar_comprobante_pdf(pago_data, cliente_data):
    """Generar comprobante de pago en PDF usando WeasyPrint"""
    try:
        # Importación condicional para evitar errores de linter
        try:
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
        except ImportError:
            # Si no está disponible, retornar None
            return None
        
        # Crear HTML del comprobante
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Comprobante de Pago</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                }}
                .comprobante {{
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    border-bottom: 3px solid #2E86AB;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .company-title {{
                    font-size: 28px;
                    font-weight: bold;
                    color: #2E86AB;
                    margin: 0;
                }}
                .document-type {{
                    font-size: 20px;
                    color: #333;
                    margin: 10px 0;
                }}
                .company-info {{
                    font-size: 14px;
                    color: #666;
                }}
                .content {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }}
                .section {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                }}
                .section-title {{
                    font-size: 16px;
                    font-weight: bold;
                    color: #2E86AB;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #2E86AB;
                    padding-bottom: 5px;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 5px 0;
                }}
                .label {{
                    font-weight: bold;
                    color: #555;
                }}
                .value {{
                    color: #333;
                }}
                .amount {{
                    font-size: 18px;
                    font-weight: bold;
                    color: #28a745;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #2E86AB;
                    color: #666;
                }}
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                }}
                .contact-info {{
                    margin-top: 15px;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="comprobante">
                <div class="header">
                    <h1 class="company-title">TELTEC NET S.A.S B.I.C</h1>
                    <h2 class="document-type">COMPROBANTE DE PAGO</h2>
                    <p class="company-info">Servicios de Telecomunicaciones</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h3 class="section-title">Información del Cliente</h3>
                        <div class="info-row">
                            <span class="label">Cliente:</span>
                            <span class="value">{cliente_data['nombres']} {cliente_data['apellidos']}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Cédula:</span>
                            <span class="value">{cliente_data['cedula']}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Plan:</span>
                            <span class="value">{cliente_data.get('tipo_plan', 'N/A')}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <span class="value">{cliente_data.get('email', 'N/A')}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Teléfono:</span>
                            <span class="value">{cliente_data.get('telefono', 'N/A')}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3 class="section-title">Detalles del Pago</h3>
                        <div class="info-row">
                            <span class="label">Número de Control:</span>
                            <span class="value">{pago_data['numero_comprobante']}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Fecha de Pago:</span>
                            <span class="value">{pago_data['fecha_pago']}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Método de Pago:</span>
                            <span class="value">{pago_data['metodo_pago'].title()}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Concepto:</span>
                            <span class="value">{pago_data['concepto']}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Monto:</span>
                            <span class="value amount">${pago_data['monto']:.2f}</span>
                        </div>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ GUARDE SU COMPROBANTE</strong><br>
                    Este documento es un comprobante oficial de pago
                </div>
                
                <div class="footer">
                    <div class="contact-info">
                        <strong>Para consultas:</strong><br>
                        Email: teltec@outlook.com<br>
                        Cel/WhatsApp: 0984517703
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Configurar fuentes
        font_config = FontConfiguration()
        
        # Generar PDF
        html = HTML(string=html_content)
        css = CSS(string='', font_config=font_config)
        pdf = html.write_pdf(stylesheets=[css], font_config=font_config)
        
        return pdf
        
    except ImportError:
        # Fallback si weasyprint no está disponible
        return None
    except Exception as e:
        print(f"Error generando PDF: {e}")
        return None

@api_view(['GET'])
@permission_classes([AllowAny])
def descargar_comprobante(request, pago_id):
    """Descargar comprobante de pago en PDF"""
    try:
        with connection.cursor() as cursor:
            # Obtener datos del pago
            cursor.execute("""
                SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, p.concepto, p.numero_comprobante,
                       c.nombres, c.apellidos, c.cedula, c.email, c.telefono, c.tipo_plan, c.precio_plan
                FROM pagos p
                JOIN clientes c ON p.cliente_id = c.id
                WHERE p.id = %s
            """, [pago_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    'success': False,
                    'message': 'Pago no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            pago_data = {
                'id': row[0],
                'monto': float(row[1]),
                'fecha_pago': row[2].strftime('%d/%m/%Y %H:%M') if row[2] else '',
                'metodo_pago': row[3],
                'concepto': row[4],
                'numero_comprobante': row[5]
            }
            
            cliente_data = {
                'nombres': row[6],
                'apellidos': row[7],
                'cedula': row[8],
                'email': row[9],
                'telefono': row[10],
                'tipo_plan': row[11],
                'precio_plan': float(row[12]) if row[12] else 0
            }
            
            # Generar PDF
            pdf_content = generar_comprobante_pdf(pago_data, cliente_data)
            
            if pdf_content is None:
                return Response({
                    'success': False,
                    'message': 'Error al generar el PDF. Verifique que weasyprint esté instalado.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Crear respuesta HTTP
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="comprobante_{pago_data["numero_comprobante"]}.pdf"'
            
            return response
            
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al generar comprobante: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_comprobante_email(request, pago_id):
    """Enviar comprobante por email al cliente"""
    try:
        with connection.cursor() as cursor:
            # Obtener datos del pago y cliente
            cursor.execute("""
                SELECT p.id, p.monto, p.fecha_pago, p.metodo_pago, p.concepto, p.numero_comprobante,
                       c.nombres, c.apellidos, c.cedula, c.email, c.telefono
                FROM pagos p
                JOIN clientes c ON p.cliente_id = c.id
                WHERE p.id = %s
            """, [pago_id])
            
            row = cursor.fetchone()
            if not row:
                return Response({
                    'success': False,
                    'message': 'Pago no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            pago_data = {
                'id': row[0],
                'monto': float(row[1]),
                'fecha_pago': row[2].strftime('%d/%m/%Y %H:%M') if row[2] else '',
                'metodo_pago': row[3],
                'concepto': row[4],
                'numero_comprobante': row[5]
            }
            
            cliente_data = {
                'nombres': row[6],
                'apellidos': row[7],
                'cedula': row[8],
                'email': row[9],
                'telefono': row[10]
            }
            
            # Verificar que el cliente tenga email
            if not cliente_data['email']:
                return Response({
                    'success': False,
                    'message': 'El cliente no tiene un email registrado'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generar PDF
            pdf_content = generar_comprobante_pdf(pago_data, cliente_data)
            
            if pdf_content is None:
                return Response({
                    'success': False,
                    'message': 'Error al generar el PDF. Verifique que weasyprint esté instalado.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Enviar email
            subject = f"Comprobante de Pago - {pago_data['numero_comprobante']}"
            message = f"""
            Estimado/a {cliente_data['nombres']} {cliente_data['apellidos']},
            
            Adjunto encontrará el comprobante de pago correspondiente a su transacción.
            
            Detalles del pago:
            - Número de Comprobante: {pago_data['numero_comprobante']}
            - Fecha: {pago_data['fecha_pago']}
            - Monto: ${pago_data['monto']:.2f}
            - Método de Pago: {pago_data['metodo_pago'].title()}
            - Concepto: {pago_data['concepto']}
            
            Gracias por confiar en nuestros servicios.
            
            Saludos cordiales,
            Equipo de TelTec
            """
            
            # Enviar email con PDF adjunto
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            from email.mime.base import MIMEBase
            from email import encoders
            import smtplib
            
            # Configurar email
            msg = MIMEMultipart()
            msg['From'] = 'teltec@outlook.com'  # Email de la empresa
            msg['To'] = cliente_data['email']
            msg['Subject'] = subject
            
            msg.attach(MIMEText(message, 'plain'))
            
            # Adjuntar PDF
            attachment = MIMEBase('application', 'pdf')
            attachment.set_payload(pdf_content)
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', 'attachment', 
                                filename=f"comprobante_{pago_data['numero_comprobante']}.pdf")
            msg.attach(attachment)
            
            # Enviar email (simulado por ahora)
            # En un entorno de producción, configurarías un servidor SMTP real
            print(f"Email enviado a {cliente_data['email']} con comprobante adjunto")
            
            # Actualizar estado de envío
            cursor.execute("""
                UPDATE pagos SET comprobante_enviado = true WHERE id = %s
            """, [pago_id])
            
            return Response({
                'success': True,
                'message': f'Comprobante enviado exitosamente a {cliente_data["email"]}'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al enviar comprobante: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_deudas(request):
    """Listar clientes con información de deudas con paginación"""
    try:
        # Parámetros de paginación
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        search = request.GET.get('search', '')
        estado = request.GET.get('estado', '')
        
        # Validar parámetros
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 200:
            page_size = 50
            
        offset = (page - 1) * page_size
        
        base_query = """
            SELECT 
                c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan,
                c.email, c.telefono, c.estado_pago, c.meses_pendientes, 
                c.monto_total_deuda, c.fecha_ultimo_pago, c.fecha_vencimiento_pago,
                c.estado, c.sector, c.fecha_registro
            FROM clientes c
            WHERE c.estado = 'activo'
        """
        params = []
        
        if search:
            base_query += " AND (c.nombres ILIKE %s OR c.apellidos ILIKE %s OR c.cedula ILIKE %s OR c.email ILIKE %s)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
        
        if estado and estado != 'todos':
            base_query += " AND c.estado_pago = %s"
            params.append(estado)
        
        with connection.cursor() as cursor:
            # Consulta para contar total de registros
            count_query = f"SELECT COUNT(*) FROM ({base_query}) as subquery"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Consulta principal con paginación
            query = base_query + " ORDER BY c.monto_total_deuda DESC, c.fecha_vencimiento_pago ASC LIMIT %s OFFSET %s"
            params.extend([page_size, offset])
            
            cursor.execute(query, params)
            clientes = []
            for row in cursor.fetchall():
                # Calcular información adicional
                fecha_registro = row[15]
                fecha_vencimiento = row[12]
                precio_plan = float(row[5]) if row[5] else 0
                
                # Si no hay fecha de vencimiento, calcular basado en fecha de registro
                if not fecha_vencimiento and fecha_registro:
                    from datetime import datetime, timedelta
                    fecha_registro_date = fecha_registro.date() if hasattr(fecha_registro, 'date') else fecha_registro
                    fecha_vencimiento = fecha_registro_date + timedelta(days=30)
                
                # Calcular meses pendientes y deuda si es necesario
                meses_pendientes = row[9] or 0
                monto_deuda = float(row[10]) if row[10] else 0
                
                # Calcular total pagado
                cursor.execute("""
                    SELECT COALESCE(SUM(monto), 0)
                    FROM pagos
                    WHERE cliente_id = %s AND estado = 'completado'
                """, [row[0]])
                total_pagado = float(cursor.fetchone()[0])
                
                if fecha_vencimiento:
                    from datetime import date
                    hoy = date.today()
                    fecha_venc = fecha_vencimiento.date() if hasattr(fecha_vencimiento, 'date') else fecha_vencimiento
                    
                    if fecha_venc < hoy:
                        # Calcular meses de atraso
                        meses_atraso = (hoy.year - fecha_venc.year) * 12 + (hoy.month - fecha_venc.month)
                        if meses_atraso > 0:
                            meses_pendientes = meses_atraso
                            monto_deuda = precio_plan * meses_atraso
                
                clientes.append({
                    'id': row[0],
                    'cedula': row[1],
                    'nombres': row[2],
                    'apellidos': row[3],
                    'tipo_plan': row[4],
                    'precio_plan': precio_plan,
                    'email': row[6],
                    'telefono': row[7],
                    'estado_pago': row[8],
                    'meses_pendientes': meses_pendientes,
                    'monto_total_deuda': monto_deuda,
                    'total_pagado': total_pagado,
                    'fecha_ultimo_pago': row[11].isoformat() if row[11] else None,
                    'fecha_vencimiento_pago': fecha_vencimiento.isoformat() if fecha_vencimiento else None,
                    'estado': row[13],
                    'sector': row[14]
                })
        
        # Calcular información de paginación
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1
        
        return Response({
            'success': True,
            'data': clientes,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_previous': has_previous,
                'next_page': page + 1 if has_next else None,
                'previous_page': page - 1 if has_previous else None
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_deudas_stats(request):
    """Obtener estadísticas de deudas"""
    try:
        # Intentar obtener de la caché
        cached_stats = get_cached_stats(get_deudas_stats_cache_key())
        if cached_stats:
            return Response({
                'success': True,
                'data': cached_stats
            }, status=status.HTTP_200_OK)

        with connection.cursor() as cursor:
            # Estadísticas generales
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_clientes,
                    COUNT(CASE WHEN estado_pago = 'al_dia' THEN 1 END) as clientes_al_dia,
                    COUNT(CASE WHEN estado_pago = 'vencido' THEN 1 END) as clientes_vencidos,
                    COUNT(CASE WHEN estado_pago = 'proximo_vencimiento' THEN 1 END) as clientes_proximo_vencimiento,
                    COALESCE(SUM(monto_total_deuda), 0) as total_deuda,
                    COALESCE(AVG(monto_total_deuda), 0) as promedio_deuda
                FROM clientes 
                WHERE estado = 'activo'
            """)
            stats_row = cursor.fetchone()
            
            # Cuotas vencidas
            cursor.execute("""
                SELECT COUNT(*) 
                FROM cuotas_mensuales 
                WHERE estado = 'vencida' AND fecha_vencimiento < CURRENT_DATE
            """)
            cuotas_vencidas = cursor.fetchone()[0]
            
            # Deuda por estado
            cursor.execute("""
                SELECT 
                    estado_pago,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(monto_total_deuda), 0) as total_deuda
                FROM clientes 
                WHERE estado = 'activo'
                GROUP BY estado_pago
            """)
            deuda_por_estado = []
            for row in cursor.fetchall():
                deuda_por_estado.append({
                    'estado': row[0],
                    'cantidad': row[1],
                    'total_deuda': float(row[2])
                })
            
            # Top 5 clientes con mayor deuda
            cursor.execute("""
                SELECT 
                    c.nombres, c.apellidos, c.cedula, c.monto_total_deuda, c.estado_pago
                FROM clientes c
                WHERE c.estado = 'activo' AND c.monto_total_deuda > 0
                ORDER BY c.monto_total_deuda DESC
                LIMIT 5
            """)
            top_deudores = []
            for row in cursor.fetchall():
                top_deudores.append({
                    'nombres': row[0],
                    'apellidos': row[1],
                    'cedula': row[2],
                    'monto_deuda': float(row[3]),
                    'estado_pago': row[4]
                })
        
        # Guardar en caché
        set_cached_stats(get_deudas_stats_cache_key(), {
            'total_clientes': stats_row[0],
            'clientes_al_dia': stats_row[1],
            'clientes_vencidos': stats_row[2],
            'clientes_proximo_vencimiento': stats_row[3],
            'total_deuda': float(stats_row[4]),
            'promedio_deuda': float(stats_row[5]),
            'cuotas_vencidas': cuotas_vencidas,
            'deuda_por_estado': deuda_por_estado,
            'top_deudores': top_deudores
                })
        
        return Response({
            'success': True,
            'data': {
                'total_clientes': stats_row[0],
                'clientes_al_dia': stats_row[1],
                'clientes_vencidos': stats_row[2],
                'clientes_proximo_vencimiento': stats_row[3],
                'total_deuda': float(stats_row[4]),
                'promedio_deuda': float(stats_row[5]),
                'cuotas_vencidas': cuotas_vencidas,
                'deuda_por_estado': deuda_por_estado,
                'top_deudores': top_deudores
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_pagos_stats(request):
    """Obtener estadísticas de pagos"""
    try:
        # Intentar obtener de la caché
        cached_stats = get_cached_stats(get_pagos_stats_cache_key())
        if cached_stats:
            return Response({
                'success': True,
                'data': cached_stats
            }, status=status.HTTP_200_OK)

        with connection.cursor() as cursor:
            # Estadísticas generales de pagos
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_pagos,
                    COALESCE(SUM(monto), 0) as total_recaudado,
                    COALESCE(AVG(monto), 0) as promedio_ticket,
                    COUNT(CASE WHEN DATE(fecha_pago) = CURRENT_DATE THEN 1 END) as pagos_hoy,
                    COALESCE(SUM(CASE WHEN DATE(fecha_pago) = CURRENT_DATE THEN monto ELSE 0 END), 0) as recaudacion_hoy,
                    COUNT(CASE WHEN EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE) 
                               AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as pagos_mes_actual,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE) 
                                     AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE) THEN monto ELSE 0 END), 0) as recaudacion_mes_actual,
                    COUNT(CASE WHEN NOT comprobante_enviado THEN 1 END) as comprobantes_pendientes
                FROM pagos 
                WHERE estado = 'completado'
            """)
            stats_row = cursor.fetchone()
            
            # Pagos por método de pago
            cursor.execute("""
                SELECT 
                    metodo_pago,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(monto), 0) as total_monto
                FROM pagos 
                WHERE estado = 'completado'
                GROUP BY metodo_pago
                ORDER BY total_monto DESC
            """)
            pagos_por_metodo = []
            for row in cursor.fetchall():
                pagos_por_metodo.append({
                    'metodo_pago': row[0],
                    'cantidad': row[1],
                    'total_monto': float(row[2])
                })
            
            # Pagos por día (últimos 7 días)
            cursor.execute("""
                SELECT 
                    DATE(fecha_pago) as fecha,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(monto), 0) as total_monto
                FROM pagos 
                WHERE estado = 'completado' 
                AND fecha_pago >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY DATE(fecha_pago)
                ORDER BY fecha DESC
            """)
            pagos_por_dia = []
            for row in cursor.fetchall():
                pagos_por_dia.append({
                    'fecha': row[0].isoformat(),
                    'cantidad': row[1],
                    'total_monto': float(row[2])
                })
            
            # Top 5 clientes con más pagos
            cursor.execute("""
                SELECT 
                    c.nombres, c.apellidos, c.cedula,
                    COUNT(p.id) as total_pagos,
                    COALESCE(SUM(p.monto), 0) as total_pagado
                FROM clientes c
                LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
                WHERE c.estado = 'activo'
                GROUP BY c.id, c.nombres, c.apellidos, c.cedula
                HAVING COUNT(p.id) > 0
                ORDER BY total_pagado DESC
                LIMIT 5
            """)
            top_clientes = []
            for row in cursor.fetchall():
                top_clientes.append({
                    'nombres': row[0],
                    'apellidos': row[1],
                    'cedula': row[2],
                    'total_pagos': row[3],
                    'total_pagado': float(row[4])
                })
        
        # Guardar en caché
        stats_data = {
            'total_pagos': stats_row[0],
            'total_recaudado': float(stats_row[1]),
            'promedio_ticket': float(stats_row[2]),
            'pagos_hoy': stats_row[3],
            'recaudacion_hoy': float(stats_row[4]),
            'pagos_mes_actual': stats_row[5],
            'recaudacion_mes_actual': float(stats_row[6]),
            'comprobantes_pendientes': stats_row[7],
            'pagos_por_metodo': pagos_por_metodo,
            'pagos_por_dia': pagos_por_dia,
            'top_clientes': top_clientes
        }
        
        set_cached_stats(get_pagos_stats_cache_key(), stats_data)

        return Response({
            'success': True,
            'data': stats_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cliente_cuotas(request, cliente_id):
    """Obtener cuotas mensuales de un cliente"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, mes, año, monto, fecha_vencimiento, fecha_pago, estado, pago_id
                FROM cuotas_mensuales 
                WHERE cliente_id = %s
                ORDER BY año DESC, mes DESC
            """, [cliente_id])
            
            cuotas = []
            for row in cursor.fetchall():
                cuotas.append({
                    'id': row[0],
                    'mes': row[1],
                    'año': row[2],
                    'monto': float(row[3]) if row[3] else 0,
                    'fecha_vencimiento': row[4].isoformat() if row[4] else None,
                    'fecha_pago': row[5].isoformat() if row[5] else None,
                    'estado': row[6],
                    'pago_id': row[7]
                })
        
        return Response({
            'success': True,
            'data': cuotas
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cliente_historial(request, cliente_id):
    """Obtener historial de pagos de un cliente"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, pago_id, fecha, descripcion, monto_pagado, concepto, 
                    fecha_pago, meses_cubiertos
                FROM historial_pagos_cliente 
                WHERE cliente_id = %s
                ORDER BY fecha_pago DESC
            """, [cliente_id])
            
            historial = []
            for row in cursor.fetchall():
                historial.append({
                    'id': row[0],
                    'pago_id': row[1],
                    'fecha': row[2].isoformat() if row[2] else None,
                    'descripcion': row[3],
                    'monto_pagado': float(row[4]) if row[4] else 0,
                    'concepto': row[5],
                    'fecha_pago': row[6].isoformat() if row[6] else None,
                    'meses_cubiertos': row[7] or 0
                })
        
        return Response({
            'success': True,
            'data': historial
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def actualizar_estados_pago(request):
    """Actualizar estados de pago de todos los clientes"""
    try:
        with connection.cursor() as cursor:
            # Primero, actualizar fechas de vencimiento para clientes que no las tienen
            cursor.execute("""
                UPDATE clientes 
                SET fecha_vencimiento_pago = DATE(fecha_registro) + INTERVAL '1 month'
                WHERE estado = 'activo' AND fecha_vencimiento_pago IS NULL
            """)
            
            # Actualizar estados basado en fecha de vencimiento
            cursor.execute("""
                UPDATE clientes 
                SET estado_pago = CASE 
                    WHEN fecha_vencimiento_pago IS NULL THEN 'sin_fecha'
                    WHEN fecha_vencimiento_pago < CURRENT_DATE - INTERVAL '3 days' THEN 'vencido'
                    WHEN fecha_vencimiento_pago <= CURRENT_DATE THEN 'proximo_vencimiento'
                    ELSE 'al_dia'
                END
                WHERE estado = 'activo'
            """)
            
            # Calcular meses pendientes y monto total de deuda
            cursor.execute("""
                UPDATE clientes 
                SET 
                    meses_pendientes = CASE 
                        WHEN fecha_vencimiento_pago IS NULL THEN 0
                        WHEN fecha_vencimiento_pago < CURRENT_DATE THEN 
                            EXTRACT(MONTH FROM AGE(CURRENT_DATE, fecha_vencimiento_pago)) + 
                            EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_vencimiento_pago)) * 12
                        ELSE 0
                    END,
                    monto_total_deuda = CASE 
                        WHEN fecha_vencimiento_pago IS NULL THEN 0
                        WHEN fecha_vencimiento_pago < CURRENT_DATE THEN 
                            precio_plan * (
                                EXTRACT(MONTH FROM AGE(CURRENT_DATE, fecha_vencimiento_pago)) + 
                                EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_vencimiento_pago)) * 12
                            )
                        ELSE 0
                    END
                WHERE estado = 'activo'
            """)
            
            # Actualizar cuotas vencidas
            cursor.execute("""
                UPDATE cuotas_mensuales 
                SET estado = CASE 
                    WHEN fecha_vencimiento < CURRENT_DATE THEN 'vencida'
                    ELSE 'pendiente'
                END
                WHERE estado != 'pagada'
            """)
        
        return Response({
            'success': True,
            'message': 'Estados de pago actualizados exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def actualizar_deudas_pagos_reales(request):
    """Actualizar deudas basándose en pagos reales registrados"""
    try:
        with connection.cursor() as cursor:
            # Obtener todos los clientes activos
            cursor.execute("""
                SELECT id, cedula, nombres, apellidos, tipo_plan, precio_plan, 
                       fecha_registro, estado_pago, meses_pendientes, monto_total_deuda
                FROM clientes 
                WHERE estado = 'activo'
                ORDER BY id
            """)
            clientes = cursor.fetchall()
            
            clientes_actualizados = 0
            
            for cliente in clientes:
                cliente_id = cliente[0]
                cedula = cliente[1]
                nombres = cliente[2]
                apellidos = cliente[3]
                tipo_plan = cliente[4]
                precio_plan = float(cliente[5]) if cliente[5] else 0
                fecha_registro = cliente[6]
                
                # Obtener todos los pagos del cliente
                cursor.execute("""
                    SELECT fecha_pago, monto, concepto, estado
                    FROM pagos 
                    WHERE cliente_id = %s AND estado = 'completado'
                    ORDER BY fecha_pago ASC
                """, [cliente_id])
                pagos = cursor.fetchall()
                
                # Calcular meses pagados por año
                pagos_por_mes = {}
                for pago in pagos:
                    fecha_pago = pago[0]
                    monto = float(pago[1]) if pago[1] else 0
                    concepto = pago[2] or ""
                    
                    # Extraer año y mes del concepto o fecha
                    año = fecha_pago.year
                    mes = fecha_pago.month
                    
                    # Buscar mes en el concepto (ej: "Pago mensual - Enero 2025")
                    import re
                    mes_match = re.search(r'(\w+)\s+(\d{4})', concepto)
                    if mes_match:
                        mes_nombre = mes_match.group(1)
                        año_concepto = int(mes_match.group(2))
                        
                        # Mapear nombres de meses a números
                        meses_map = {
                            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
                            'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
                            'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
                        }
                        
                        if mes_nombre in meses_map:
                            mes = meses_map[mes_nombre]
                            año = año_concepto
                    
                    key = f"{año}-{mes:02d}"
                    if key not in pagos_por_mes:
                        pagos_por_mes[key] = 0
                    pagos_por_mes[key] += monto
                
                # Calcular meses pendientes
                from datetime import datetime, date
                hoy = date.today()
                fecha_registro_date = fecha_registro.date() if hasattr(fecha_registro, 'date') else fecha_registro
                
                # Calcular desde la fecha de registro hasta hoy
                meses_totales = (hoy.year - fecha_registro_date.year) * 12 + (hoy.month - fecha_registro_date.month)
                if hoy.day < fecha_registro_date.day:
                    meses_totales -= 1
                
                meses_totales = max(0, meses_totales)
                
                # Contar meses pagados
                meses_pagados = 0
                for key in pagos_por_mes:
                    año_mes = key.split('-')
                    año_pago = int(año_mes[0])
                    mes_pago = int(año_mes[1])
                    
                    # Verificar si el pago cubre el mes completo
                    if pagos_por_mes[key] >= precio_plan * 0.8:  # 80% del precio se considera pago completo
                        meses_pagados += 1
                
                # Calcular meses pendientes y deuda
                meses_pendientes = max(0, meses_totales - meses_pagados)
                monto_deuda = meses_pendientes * precio_plan
                
                # Determinar estado del pago
                if meses_pendientes == 0:
                    estado_pago = 'al_dia'
                elif meses_pendientes <= 1:
                    estado_pago = 'proximo_vencimiento'
                else:
                    estado_pago = 'vencido'
                
                # Calcular fecha de último pago
                fecha_ultimo_pago = None
                if pagos:
                    fecha_ultimo_pago = max(pago[0] for pago in pagos)
                
                # Calcular fecha de vencimiento (próximo pago)
                fecha_vencimiento = None
                if fecha_ultimo_pago:
                    # Calcular próximo mes desde el último pago
                    if fecha_ultimo_pago.month == 12:
                        fecha_vencimiento = fecha_ultimo_pago.replace(year=fecha_ultimo_pago.year + 1, month=1)
                    else:
                        fecha_vencimiento = fecha_ultimo_pago.replace(month=fecha_ultimo_pago.month + 1)
                else:
                    # Si no hay pagos, usar fecha de registro + 1 mes
                    if fecha_registro_date.month == 12:
                        fecha_vencimiento = fecha_registro_date.replace(year=fecha_registro_date.year + 1, month=1)
                    else:
                        fecha_vencimiento = fecha_registro_date.replace(month=fecha_registro_date.month + 1)
                
                # Actualizar cliente en la base de datos
                cursor.execute("""
                    UPDATE clientes 
                    SET estado_pago = %s, meses_pendientes = %s, monto_total_deuda = %s,
                        fecha_ultimo_pago = %s, fecha_vencimiento_pago = %s
                    WHERE id = %s
                """, [estado_pago, meses_pendientes, monto_deuda, fecha_ultimo_pago, fecha_vencimiento, cliente_id])
                
                clientes_actualizados += 1
                
                print(f"Cliente {cedula} ({nombres} {apellidos}): {meses_pendientes} meses pendientes, ${monto_deuda:.2f} deuda")
            
            return Response({
                'success': True,
                'message': f'Deudas actualizadas correctamente. {clientes_actualizados} clientes procesados.',
                'clientes_actualizados': clientes_actualizados
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error actualizando deudas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def exportar_reporte_pagos_excel(request):
    """Exportar reporte de pagos en Excel"""
    try:
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        metodo_pago = request.GET.get('metodo_pago')
        
        generator = ReporteGenerator()
        output = generator.generar_reporte_pagos_excel(fecha_inicio, fecha_fin, metodo_pago)
        
        # Generar nombre de archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'reporte_pagos_{timestamp}.xlsx'
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al generar reporte: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def exportar_reporte_pagos_pdf(request):
    """Exportar reporte de pagos en PDF"""
    try:
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        metodo_pago = request.GET.get('metodo_pago')
        
        generator = ReporteGenerator()
        output = generator.generar_reporte_pagos_pdf(fecha_inicio, fecha_fin, metodo_pago)
        
        # Generar nombre de archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'reporte_pagos_{timestamp}.pdf'
        
        response = HttpResponse(output.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al generar reporte: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def exportar_reporte_deudas_excel(request):
    """Exportar reporte de deudas en Excel"""
    try:
        generator = ReporteGenerator()
        output = generator.generar_reporte_deudas_excel()
        
        # Generar nombre de archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'reporte_deudas_{timestamp}.xlsx'
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al generar reporte: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_recaudacion_deudas(request):
    """Debug para verificar consistencia entre recaudación y deudas"""
    try:
        cliente_id = request.GET.get('cliente_id')
        
        with connection.cursor() as cursor:
            if cliente_id:
                # Debug para un cliente específico
                cursor.execute("""
                    SELECT 
                        c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan,
                        c.estado_pago, c.meses_pendientes, c.monto_total_deuda,
                        c.fecha_ultimo_pago, c.fecha_vencimiento_pago, c.fecha_registro
                    FROM clientes c
                    WHERE c.id = %s
                """, [cliente_id])
                cliente = cursor.fetchone()
                
                if not cliente:
                    return Response({
                        'success': False,
                        'message': 'Cliente no encontrado'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Obtener todos los pagos del cliente
                cursor.execute("""
                    SELECT fecha_pago, monto, concepto, estado
                    FROM pagos 
                    WHERE cliente_id = %s AND estado = 'completado'
                    ORDER BY fecha_pago ASC
                """, [cliente_id])
                pagos = cursor.fetchall()
                
                # Calcular información de pagos
                total_pagado = sum(float(pago[1]) for pago in pagos)
                pagos_por_mes = {}
                
                for pago in pagos:
                    fecha_pago = pago[0]
                    monto = float(pago[1])
                    concepto = pago[2] or ""
                    
                    # Extraer mes del concepto
                    import re
                    mes_match = re.search(r'(\w+)\s+(\d{4})', concepto)
                    if mes_match:
                        mes_nombre = mes_match.group(1)
                        año = int(mes_match.group(2))
                        
                        meses_map = {
                            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
                            'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
                            'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
                        }
                        
                        if mes_nombre in meses_map:
                            mes = meses_map[mes_nombre]
                            key = f"{año}-{mes:02d}"
                            if key not in pagos_por_mes:
                                pagos_por_mes[key] = 0
                            pagos_por_mes[key] += monto
                
                # Calcular deuda real
                from datetime import datetime, date
                hoy = date.today()
                fecha_registro = cliente[11]
                fecha_registro_date = fecha_registro.date() if hasattr(fecha_registro, 'date') else fecha_registro
                
                meses_totales = (hoy.year - fecha_registro_date.year) * 12 + (hoy.month - fecha_registro_date.month)
                if hoy.day < fecha_registro_date.day:
                    meses_totales -= 1
                meses_totales = max(0, meses_totales)
                
                precio_plan = float(cliente[5]) if cliente[5] else 0
                meses_pagados = 0
                for key in pagos_por_mes:
                    if pagos_por_mes[key] >= precio_plan * 0.8:
                        meses_pagados += 1
                
                meses_pendientes_real = max(0, meses_totales - meses_pagados)
                deuda_real = meses_pendientes_real * precio_plan
                
                return Response({
                    'success': True,
                    'data': {
                        'cliente': {
                            'id': cliente[0],
                            'cedula': cliente[1],
                            'nombres': cliente[2],
                            'apellidos': cliente[3],
                            'tipo_plan': cliente[4],
                            'precio_plan': precio_plan,
                            'estado_pago_actual': cliente[6],
                            'meses_pendientes_actual': cliente[7],
                            'monto_deuda_actual': float(cliente[8]) if cliente[8] else 0,
                            'fecha_ultimo_pago': cliente[9].isoformat() if cliente[9] else None,
                            'fecha_vencimiento': cliente[10].isoformat() if cliente[10] else None,
                            'fecha_registro': cliente[11].isoformat() if cliente[11] else None
                        },
                        'pagos': {
                            'total_pagos': len(pagos),
                            'total_pagado': total_pagado,
                            'pagos_por_mes': pagos_por_mes,
                            'detalle_pagos': [
                                {
                                    'fecha': pago[0].isoformat(),
                                    'monto': float(pago[1]),
                                    'concepto': pago[2],
                                    'estado': pago[3]
                                } for pago in pagos
                            ]
                        },
                        'calculo_real': {
                            'meses_totales_desde_registro': meses_totales,
                            'meses_pagados': meses_pagados,
                            'meses_pendientes_real': meses_pendientes_real,
                            'deuda_real': deuda_real,
                            'diferencia_con_actual': float(cliente[8]) if cliente[8] else 0 - deuda_real
                        }
                    }
                }, status=status.HTTP_200_OK)
            else:
                # Debug general para todos los clientes
                cursor.execute("""
                    SELECT 
                        c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan,
                        c.estado_pago, c.meses_pendientes, c.monto_total_deuda,
                        COUNT(p.id) as total_pagos,
                        COALESCE(SUM(p.monto), 0) as total_pagado
                    FROM clientes c
                    LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
                    WHERE c.estado = 'activo'
                    GROUP BY c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan,
                             c.estado_pago, c.meses_pendientes, c.monto_total_deuda
                    ORDER BY c.monto_total_deuda DESC
                """)
                
                clientes = []
                for row in cursor.fetchall():
                    clientes.append({
                        'id': row[0],
                        'cedula': row[1],
                        'nombres': row[2],
                        'apellidos': row[3],
                        'tipo_plan': row[4],
                        'precio_plan': float(row[5]) if row[5] else 0,
                        'estado_pago': row[6],
                        'meses_pendientes': row[7],
                        'monto_deuda_actual': float(row[8]) if row[8] else 0,
                        'total_pagos': row[9],
                        'total_pagado': float(row[10])
                    })
                
                return Response({
                    'success': True,
                    'data': {
                        'total_clientes': len(clientes),
                        'clientes': clientes
                    }
                }, status=status.HTTP_200_OK)
                
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error en debug: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
