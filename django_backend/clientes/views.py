from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db import connection
from .models import Cliente
from .serializers import ClienteSerializer, ClienteUpdateSerializer, ClienteListSerializer
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Cliente
    """
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'update' or self.action == 'partial_update':
            return ClienteUpdateSerializer
        elif self.action == 'list':
            return ClienteListSerializer
        return ClienteSerializer
    
    def list(self, request, *args, **kwargs):
        """Listar clientes con filtros"""
        try:
            with connection.cursor() as cursor:
                # Construir query base
                query = """
                    SELECT id, cedula, nombres, apellidos, tipo_plan, precio_plan,
                           fecha_nacimiento, direccion, sector, email, telefono,
                           telegram_chat_id, estado, fecha_registro, fecha_actualizacion,
                           fecha_ultimo_pago, meses_pendientes, monto_total_deuda,
                           fecha_vencimiento_pago, estado_pago
                    FROM clientes
                    WHERE 1=1
                """
                params = []
                
                # Filtro por búsqueda
                search = request.query_params.get('search', None)
                if search:
                    query += """ AND (
                        nombres ILIKE %s OR 
                        apellidos ILIKE %s OR 
                        cedula ILIKE %s OR 
                        email ILIKE %s OR 
                        telefono ILIKE %s
                    )"""
                    search_param = f'%{search}%'
                    params.extend([search_param] * 5)
                
                # Filtro por estado
                estado = request.query_params.get('estado', None)
                if estado and estado != 'todos':
                    query += " AND estado = %s"
                    params.append(estado)
                
                # Filtro por sector
                sector = request.query_params.get('sector', None)
                if sector and sector != 'todos':
                    query += " AND sector ILIKE %s"
                    params.append(sector)
                
                query += " ORDER BY fecha_registro DESC"
                
                cursor.execute(query, params)
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                
                return Response({
                    'success': True,
                    'data': results,
                    'count': len(results)
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al obtener clientes: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request, *args, **kwargs):
        """Crear un nuevo cliente usando SQL directo"""
        try:
            data = request.data
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO clientes (
                        cedula, nombres, apellidos, tipo_plan, precio_plan,
                        fecha_nacimiento, direccion, sector, email, telefono,
                        telegram_chat_id, estado, fecha_registro, fecha_actualizacion
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id
                """, [
                    data.get('cedula'),
                    data.get('nombres'),
                    data.get('apellidos'),
                    data.get('tipo_plan'),
                    data.get('precio_plan'),
                    data.get('fecha_nacimiento'),
                    data.get('direccion'),
                    data.get('sector'),
                    data.get('email'),
                    data.get('telefono'),
                    data.get('telegram_chat_id', ''),
                    data.get('estado', 'activo')
                ])
                
                cliente_id = cursor.fetchone()[0]
                
                # Obtener el cliente creado
                cursor.execute("""
                    SELECT id, cedula, nombres, apellidos, tipo_plan, precio_plan,
                           fecha_nacimiento, direccion, sector, email, telefono,
                           telegram_chat_id, estado, fecha_registro, fecha_actualizacion
                    FROM clientes WHERE id = %s
                """, [cliente_id])
                
                columns = [col[0] for col in cursor.description]
                cliente_data = dict(zip(columns, cursor.fetchone()))
                
                return Response({
                    'success': True,
                    'message': 'Cliente creado exitosamente',
                    'data': cliente_data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al crear cliente: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Actualizar un cliente existente"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            cliente = serializer.save()
            return Response({
                'success': True,
                'message': 'Cliente actualizado exitosamente',
                'data': ClienteSerializer(cliente).data
            }, status=status.HTTP_200_OK)
        return Response({
            'success': False,
            'message': 'Error al actualizar cliente',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar un cliente"""
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Cliente eliminado exitosamente'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def valores_unicos(self, request):
        """Obtener valores únicos para filtros - SOLO planes y sectores configurados"""
        try:
            from configuracion.models import Plan, Sector
            
            # Obtener SOLO sectores activos de la tabla de configuración
            sectores_activos = Sector.objects.filter(activo=True).values_list('nombre', flat=True)
            sectores_unicos = [s for s in sectores_activos if s and s.strip()]
            
            # Obtener SOLO planes activos de la tabla de configuración
            planes_activos = Plan.objects.filter(activo=True)
            planes_final = [
                {
                    "tipo_plan": plan.nombre,
                    "precio_plan": float(plan.precio)
                }
                for plan in planes_activos
                if plan.nombre and plan.nombre.strip()
            ]
            
            # Ordenar por precio
            planes_final.sort(key=lambda x: x["precio_plan"])
            
            return Response({
                'success': True,
                'sectores': sorted(sectores_unicos),
                'planes': planes_final
            })
            
        except Exception as e:
            print(f"Error en valores_unicos: {e}")
            # Si hay error, devolver listas vacías para forzar configuración
            return Response({
                'success': True,
                'sectores': [],
                'planes': []
            })
    
    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Obtener estadísticas de un cliente"""
        cliente = self.get_object()
        
        # Estadísticas básicas
        total_pagos = cliente.pagos.count()
        pagos_mes = cliente.pagos.filter(
            fecha_pago__month=timezone.now().month,
            fecha_pago__year=timezone.now().year
        ).count()
        
        return Response({
            'success': True,
            'data': {
                'total_pagos': total_pagos,
                'pagos_mes': pagos_mes,
                'estado': cliente.estado,
                'tiene_telegram': cliente.tiene_telegram
            }
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        """Obtener estadísticas generales"""
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM clientes")
            total_clientes = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM clientes WHERE estado = 'activo'")
            clientes_activos = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM clientes WHERE estado = 'suspendido'")
            clientes_suspendidos = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM clientes WHERE estado = 'inactivo'")
            clientes_inactivos = cursor.fetchone()[0]
        
        return Response({
            'success': True,
            'data': {
                'total_clientes': total_clientes,
                'clientes_activos': clientes_activos,
                'clientes_suspendidos': clientes_suspendidos,
                'clientes_inactivos': clientes_inactivos,
            }
        })

@api_view(['PUT'])
@permission_classes([AllowAny])
def actualizar_valor(request):
    """Actualizar valores únicos (planes o sectores)"""
    try:
        campo = request.data.get('campo')
        valor_antiguo = request.data.get('valorAntiguo')
        valor_nuevo = request.data.get('valorNuevo')
        precio_nuevo = request.data.get('precioNuevo')
        
        if not campo or not valor_antiguo or not valor_nuevo:
            return Response({
                'success': False,
                'message': 'Faltan parámetros requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with connection.cursor() as cursor:
            if campo == 'tipo_plan':
                if precio_nuevo:
                    cursor.execute("""
                        UPDATE clientes 
                        SET tipo_plan = %s, precio_plan = %s 
                        WHERE tipo_plan = %s
                    """, [valor_nuevo, precio_nuevo, valor_antiguo])
                else:
                    cursor.execute("""
                        UPDATE clientes 
                        SET tipo_plan = %s 
                        WHERE tipo_plan = %s
                    """, [valor_nuevo, valor_antiguo])
            elif campo == 'sector':
                cursor.execute("""
                    UPDATE clientes 
                    SET sector = %s 
                    WHERE sector = %s
                """, [valor_nuevo, valor_antiguo])
            else:
                return Response({
                    'success': False,
                    'message': 'Campo no válido'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': f'{campo} actualizado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar {campo}: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def eliminar_valor(request):
    """Eliminar valores únicos (planes o sectores)"""
    try:
        campo = request.data.get('campo')
        valor = request.data.get('valor')
        reemplazo = request.data.get('reemplazo', '')
        
        if not campo or not valor:
            return Response({
                'success': False,
                'message': 'Faltan parámetros requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with connection.cursor() as cursor:
            if campo == 'tipo_plan':
                cursor.execute("""
                    UPDATE clientes 
                    SET tipo_plan = %s, precio_plan = 0 
                    WHERE tipo_plan = %s
                """, [reemplazo, valor])
            elif campo == 'sector':
                cursor.execute("""
                    UPDATE clientes 
                    SET sector = %s 
                    WHERE sector = %s
                """, [reemplazo, valor])
            else:
                return Response({
                    'success': False,
                    'message': 'Campo no válido'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': f'{campo} eliminado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al eliminar {campo}: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_clientes(request):
    """Endpoint de prueba para clientes"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM clientes")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM clientes WHERE tipo_plan != '' AND precio_plan > 0")
            validos = cursor.fetchone()[0]
            
        return Response({
            'success': True,
            'total_clientes': total,
            'clientes_validos': validos,
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
