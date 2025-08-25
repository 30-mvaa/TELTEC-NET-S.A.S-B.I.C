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
    
#     def generar_reporte_pagos_excel(self, fecha_inicio=None, fecha_fin=None, metodo_pago=None):
#         """Generar reporte de pagos en Excel"""
#         # Función comentada debido a problemas de compatibilidad con reportlab
#         # TODO: Implementar cuando se resuelvan los problemas de arquitectura
#         pass
#         """Agregar hoja de resumen al reporte de pagos"""
#         # Función comentada debido a problemas de compatibilidad con reportlab
#         # TODO: Implementar cuando se resuelvan los problemas de arquitectura
#         pass
    
#     def generar_reporte_deudas_excel(self):
#         """Generar reporte de deudas en Excel"""
#         # Función comentada debido a problemas de compatibilidad con reportlab
#         # TODO: Implementar cuando se resuelvan los problemas de arquitectura
#         pass
    
#     def agregar_hoja_resumen_deudas(self, workbook):
#         """Agregar hoja de resumen al reporte de deudas"""
#         # Función comentada debido a problemas de compatibilidad con reportlab
#         # TODO: Implementar cuando se resuelvan los problemas de arquitectura
#         pass
    
    # def generar_reporte_pagos_pdf(self, fecha_inicio=None, fecha_fin=None, metodo_pago=None):
    #     """Generar reporte de pagos en PDF"""
    #     # Función comentada debido a problemas de compatibilidad con reportlab
    #     # TODO: Implementar cuando se resuelvan los problemas de arquitectura
    #     pass
