from django.db import connection
from django.http import HttpResponse
from django.conf import settings
from datetime import datetime, date, timedelta
import xlsxwriter
from io import BytesIO
# from reportlab.lib.pagesizes import letter, A4
# from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.units import inch
# from reportlab.lib import colors
import json

class ReporteGenerator:
    """Clase para generar reportes avanzados usando WeasyPrint"""
    
    def __init__(self):
        pass
    
    def generar_reporte_pagos_pdf(self, fecha_inicio=None, fecha_fin=None, metodo_pago=None):
        """Generar reporte de pagos en PDF usando ReportLab"""
        try:
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from io import BytesIO
            
            # Obtener datos
            query = """
                SELECT p.id, c.nombres, c.apellidos, c.cedula, p.monto, p.fecha_pago, 
                       p.metodo_pago, p.concepto, p.estado
                FROM pagos p
                LEFT JOIN clientes c ON p.cliente_id = c.id
                WHERE 1=1
            """
            params = []
            
            if fecha_inicio:
                query += " AND p.fecha_pago >= %s"
                params.append(fecha_inicio)
            
            if fecha_fin:
                query += " AND p.fecha_pago <= %s"
                params.append(fecha_fin)
            
            if metodo_pago:
                query += " AND p.metodo_pago = %s"
                params.append(metodo_pago)
            
            query += " ORDER BY p.fecha_pago DESC LIMIT 100"
            
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                data = cursor.fetchall()
            
            # Crear buffer para el PDF
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
            story = []
            
            # Estilos
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=20,
                alignment=1  # Centrado
            )
            normal_style = styles['Normal']
            
            # Título
            story.append(Paragraph("REPORTE DE PAGOS - TELTEC", title_style))
            story.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", normal_style))
            story.append(Spacer(1, 20))
            
            # Filtros aplicados
            filtros_text = "Filtros aplicados: "
            if fecha_inicio:
                filtros_text += f"Desde: {fecha_inicio} "
            if fecha_fin:
                filtros_text += f"Hasta: {fecha_fin} "
            if metodo_pago:
                filtros_text += f"Método: {metodo_pago} "
            filtros_text += f"Total registros: {len(data)}"
            
            story.append(Paragraph(filtros_text, normal_style))
            story.append(Spacer(1, 20))
            
            # Tabla de datos
            if data:
                table_data = [['ID', 'Cliente', 'Cédula', 'Monto', 'Fecha', 'Método', 'Estado']]
                total_monto = 0
                
                for row in data:
                    total_monto += float(row[4])
                    table_data.append([
                        str(row[0]),
                        f"{row[1]} {row[2]}",
                        str(row[3]),
                        f"${row[4]:.2f}",
                        row[5].strftime('%d/%m/%Y') if row[5] else '',
                        str(row[6]),
                        str(row[8])
                    ])
                
                # Agregar fila de total
                table_data.append(['', '', 'TOTAL', f"${total_monto:.2f}", '', '', ''])
                
                table = Table(table_data, colWidths=[0.5*inch, 2*inch, 1*inch, 1*inch, 1*inch, 1*inch, 1*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.lightgreen),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(table)
            else:
                story.append(Paragraph("No hay datos para mostrar", normal_style))
            
            story.append(Spacer(1, 20))
            story.append(Paragraph("Reporte generado automáticamente por el sistema TelTec", normal_style))
            
            # Construir PDF
            doc.build(story)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            return pdf_content
            
        except ImportError:
            return None
        except Exception as e:
            print(f"Error generando reporte PDF: {e}")
            return None

    def generar_reporte_pagos_excel(self, fecha_inicio=None, fecha_fin=None, metodo_pago=None):
        """Generar reporte de pagos en Excel usando xlsxwriter"""
        try:
            # Obtener datos
            query = """
                SELECT p.id, c.nombres, c.apellidos, c.cedula, p.monto, p.fecha_pago,
                       p.metodo_pago, p.concepto, p.estado
                FROM pagos p
                LEFT JOIN clientes c ON p.cliente_id = c.id
                WHERE 1=1
            """
            params = []

            if fecha_inicio:
                query += " AND p.fecha_pago >= %s"
                params.append(fecha_inicio)

            if fecha_fin:
                query += " AND p.fecha_pago <= %s"
                params.append(fecha_fin)

            if metodo_pago:
                query += " AND p.metodo_pago = %s"
                params.append(metodo_pago)

            query += " ORDER BY p.fecha_pago DESC LIMIT 1000"

            with connection.cursor() as cursor:
                cursor.execute(query, params)
                data = cursor.fetchall()

            # Crear buffer para el Excel
            output = BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Pagos')

            # Formatos
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            money_format = workbook.add_format({
                'num_format': '$#,##0.00',
                'border': 1
            })

            date_format = workbook.add_format({
                'num_format': 'dd/mm/yyyy',
                'border': 1
            })

            cell_format = workbook.add_format({
                'border': 1
            })

            total_format = workbook.add_format({
                'bold': True,
                'bg_color': '#E7E6E6',
                'num_format': '$#,##0.00',
                'border': 1
            })

            # Encabezados
            headers = ['ID', 'Cliente', 'Cédula', 'Monto', 'Fecha Pago', 'Método', 'Concepto', 'Estado']
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
                worksheet.set_column(col, col, 15)  # Ancho de columna

            # Ajustar ancho de columnas específicas
            worksheet.set_column(1, 1, 25)  # Cliente
            worksheet.set_column(2, 2, 15)  # Cédula
            worksheet.set_column(6, 6, 30)  # Concepto

            # Datos
            total_monto = 0
            for row_num, row in enumerate(data, start=1):
                total_monto += float(row[4])
                worksheet.write(row_num, 0, row[0], cell_format)  # ID
                worksheet.write(row_num, 1, f"{row[1]} {row[2]}", cell_format)  # Cliente
                worksheet.write(row_num, 2, row[3], cell_format)  # Cédula
                worksheet.write(row_num, 3, float(row[4]), money_format)  # Monto
                worksheet.write(row_num, 4, row[5], date_format if row[5] else cell_format)  # Fecha
                worksheet.write(row_num, 5, row[6], cell_format)  # Método
                worksheet.write(row_num, 6, row[7], cell_format)  # Concepto
                worksheet.write(row_num, 7, row[8], cell_format)  # Estado

            # Fila de total
            total_row = len(data) + 1
            worksheet.write(total_row, 0, '', cell_format)
            worksheet.write(total_row, 1, '', cell_format)
            worksheet.write(total_row, 2, 'TOTAL', total_format)
            worksheet.write(total_row, 3, total_monto, total_format)
            worksheet.write(total_row, 4, '', cell_format)
            worksheet.write(total_row, 5, '', cell_format)
            worksheet.write(total_row, 6, '', cell_format)
            worksheet.write(total_row, 7, '', cell_format)

            # Cerrar workbook
            workbook.close()
            output.seek(0)

            return output

        except Exception as e:
            print(f"Error generando reporte Excel de pagos: {e}")
            return None

    def generar_reporte_deudas_excel(self):
        """Generar reporte de deudas en Excel usando xlsxwriter"""
        try:
            # Obtener datos de deudas
            query = """
                SELECT c.id, c.cedula, c.nombres, c.apellidos, c.estado,
                       c.meses_pendientes, c.monto_total_deuda, c.fecha_vencimiento_pago,
                       COALESCE(s.nombre_sector, 'Sin sector') as sector,
                       COALESCE(p.tipo_plan, 'Sin plan') as tipo_plan
                FROM clientes c
                LEFT JOIN sectores s ON c.id_sector = s.id_sector
                LEFT JOIN clientes_planes cp ON c.id = cp.id_cliente AND cp.estado = 'activo'
                LEFT JOIN planes p ON cp.id_plan = p.id_plan
                WHERE c.meses_pendientes > 0 OR c.monto_total_deuda > 0
                ORDER BY c.monto_total_deuda DESC
            """

            with connection.cursor() as cursor:
                cursor.execute(query)
                data = cursor.fetchall()

            # Crear buffer para el Excel
            output = BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Deudas')

            # Formatos
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            money_format = workbook.add_format({
                'num_format': '$#,##0.00',
                'border': 1
            })

            date_format = workbook.add_format({
                'num_format': 'dd/mm/yyyy',
                'border': 1
            })

            cell_format = workbook.add_format({
                'border': 1
            })

            total_format = workbook.add_format({
                'bold': True,
                'bg_color': '#E7E6E6',
                'num_format': '$#,##0.00',
                'border': 1
            })

            # Encabezados
            headers = ['ID', 'Cédula', 'Cliente', 'Estado', 'Meses Pendientes',
                       'Monto Deuda', 'Fecha Vencimiento', 'Sector', 'Plan']
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)
                worksheet.set_column(col, col, 15)  # Ancho de columna

            # Ajustar ancho de columnas específicas
            worksheet.set_column(1, 1, 15)  # Cédula
            worksheet.set_column(2, 2, 25)  # Cliente
            worksheet.set_column(6, 6, 18)  # Fecha Vencimiento

            # Datos
            total_deuda = 0
            for row_num, row in enumerate(data, start=1):
                total_deuda += float(row[6]) if row[6] else 0
                worksheet.write(row_num, 0, row[0], cell_format)  # ID
                worksheet.write(row_num, 1, row[1], cell_format)  # Cédula
                worksheet.write(row_num, 2, f"{row[2]} {row[3]}", cell_format)  # Cliente
                worksheet.write(row_num, 3, row[4], cell_format)  # Estado
                worksheet.write(row_num, 4, row[5] if row[5] else 0, cell_format)  # Meses pendientes
                worksheet.write(row_num, 5, float(row[6]) if row[6] else 0, money_format)  # Monto deuda
                worksheet.write(row_num, 6, row[7], date_format if row[7] else cell_format)  # Fecha vencimiento
                worksheet.write(row_num, 7, row[8], cell_format)  # Sector
                worksheet.write(row_num, 8, row[9], cell_format)  # Plan

            # Fila de total
            total_row = len(data) + 1
            worksheet.write(total_row, 0, '', cell_format)
            worksheet.write(total_row, 1, '', cell_format)
            worksheet.write(total_row, 2, 'TOTAL DEUDA', total_format)
            worksheet.write(total_row, 3, '', cell_format)
            worksheet.write(total_row, 4, '', cell_format)
            worksheet.write(total_row, 5, total_deuda, total_format)
            worksheet.write(total_row, 6, '', cell_format)
            worksheet.write(total_row, 7, '', cell_format)
            worksheet.write(total_row, 8, '', cell_format)

            # Cerrar workbook
            workbook.close()
            output.seek(0)

            return output

        except Exception as e:
            print(f"Error generando reporte Excel de deudas: {e}")
            return None
