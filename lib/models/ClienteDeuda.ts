// lib/models/ClienteDeuda.ts
import { query } from "@/lib/database/connection"

export interface ClienteDeuda {
  id: number
  cedula: string
  nombres: string
  apellidos: string
  tipo_plan: string
  precio_plan: number
  estado: string
  fecha_ultimo_pago: string | null
  meses_pendientes: number
  monto_total_deuda: number
  fecha_vencimiento_pago: string | null
  estado_pago: 'al_dia' | 'proximo_vencimiento' | 'vencido' | 'corte_pendiente'
}

export interface CuotaMensual {
  id: number
  cliente_id: number
  mes: number
  año: number
  monto: number
  fecha_vencimiento: string
  fecha_pago: string | null
  estado: 'pendiente' | 'pagado' | 'vencido'
  pago_id: number | null
}

export interface HistorialPago {
  id: number
  cliente_id: number
  pago_id: number
  monto_pagado: number
  concepto: string
  fecha_pago: string
  meses_cubiertos: number
}

export class ClienteDeudaModel {
  // Obtener todos los clientes con información de deudas
  static async getAllWithDeudas(): Promise<ClienteDeuda[]> {
    const res = await query(`
      SELECT 
        c.id,
        c.cedula,
        c.nombres,
        c.apellidos,
        c.tipo_plan,
        c.precio_plan,
        c.estado,
        c.fecha_ultimo_pago,
        c.meses_pendientes,
        c.monto_total_deuda,
        c.fecha_vencimiento_pago,
        c.estado_pago
      FROM clientes c
      WHERE c.estado = 'activo'
      ORDER BY c.estado_pago DESC, c.monto_total_deuda DESC
    `)
    return res.rows
  }

  // Obtener cliente específico con deudas
  static async getByIdWithDeudas(id: number): Promise<ClienteDeuda | null> {
    const res = await query(`
      SELECT 
        c.id,
        c.cedula,
        c.nombres,
        c.apellidos,
        c.tipo_plan,
        c.precio_plan,
        c.estado,
        c.fecha_ultimo_pago,
        c.meses_pendientes,
        c.monto_total_deuda,
        c.fecha_vencimiento_pago,
        c.estado_pago
      FROM clientes c
      WHERE c.id = $1
    `, [id])
    return res.rows[0] || null
  }

  // Obtener cuotas mensuales de un cliente
  static async getCuotasByCliente(clienteId: number): Promise<CuotaMensual[]> {
    const res = await query(`
      SELECT 
        id,
        cliente_id,
        mes,
        año,
        monto,
        fecha_vencimiento,
        fecha_pago,
        estado,
        pago_id
      FROM cuotas_mensuales
      WHERE cliente_id = $1
      ORDER BY año DESC, mes DESC
    `, [clienteId])
    return res.rows
  }

  // Obtener historial de pagos de un cliente
  static async getHistorialByCliente(clienteId: number): Promise<HistorialPago[]> {
    const res = await query(`
      SELECT 
        h.id,
        h.cliente_id,
        h.pago_id,
        h.monto_pagado,
        h.concepto,
        h.fecha_pago,
        h.meses_cubiertos
      FROM historial_pagos_cliente h
      WHERE h.cliente_id = $1
      ORDER BY h.fecha_pago DESC
    `, [clienteId])
    return res.rows
  }

  // Generar cuotas mensuales para todos los clientes activos
  static async generarCuotasMensuales(): Promise<void> {
    await query('SELECT generar_cuotas_mensuales()')
  }

  // Marcar cuotas vencidas
  static async marcarCuotasVencidas(): Promise<void> {
    await query('SELECT marcar_cuotas_vencidas()')
  }

  // Actualizar estado de pagos de todos los clientes
  static async actualizarEstadosPagos(): Promise<void> {
    await query('SELECT actualizar_estado_pagos_clientes()')
  }

  // Obtener estadísticas de deudas
  static async getEstadisticasDeudas(): Promise<{
    total_clientes: number
    clientes_al_dia: number
    clientes_vencidos: number
    clientes_corte_pendiente: number
    total_deuda: number
    promedio_deuda: number
  }> {
    const res = await query(`
      SELECT 
        COUNT(*) as total_clientes,
        COUNT(CASE WHEN estado_pago = 'al_dia' THEN 1 END) as clientes_al_dia,
        COUNT(CASE WHEN estado_pago = 'vencido' THEN 1 END) as clientes_vencidos,
        COUNT(CASE WHEN estado_pago = 'corte_pendiente' THEN 1 END) as clientes_corte_pendiente,
        COALESCE(SUM(monto_total_deuda), 0) as total_deuda,
        COALESCE(AVG(monto_total_deuda), 0) as promedio_deuda
      FROM clientes 
      WHERE estado = 'activo'
    `)
    return res.rows[0]
  }

  // Obtener clientes con deudas vencidas
  static async getClientesVencidos(): Promise<ClienteDeuda[]> {
    const res = await query(`
      SELECT 
        c.id,
        c.cedula,
        c.nombres,
        c.apellidos,
        c.tipo_plan,
        c.precio_plan,
        c.estado,
        c.fecha_ultimo_pago,
        c.meses_pendientes,
        c.monto_total_deuda,
        c.fecha_vencimiento_pago,
        c.estado_pago
      FROM clientes c
      WHERE c.estado = 'activo' 
      AND c.estado_pago IN ('vencido', 'corte_pendiente')
      ORDER BY c.monto_total_deuda DESC
    `)
    return res.rows
  }

  // Obtener clientes próximos al vencimiento
  static async getClientesProximosVencimiento(): Promise<ClienteDeuda[]> {
    const res = await query(`
      SELECT 
        c.id,
        c.cedula,
        c.nombres,
        c.apellidos,
        c.tipo_plan,
        c.precio_plan,
        c.estado,
        c.fecha_ultimo_pago,
        c.meses_pendientes,
        c.monto_total_deuda,
        c.fecha_vencimiento_pago,
        c.estado_pago
      FROM clientes c
      WHERE c.estado = 'activo' 
      AND c.estado_pago = 'proximo_vencimiento'
      ORDER BY c.fecha_vencimiento_pago ASC
    `)
    return res.rows
  }

  // Calcular monto a pagar para un cliente (incluyendo multas)
  static async calcularMontoAPagar(clienteId: number): Promise<{
    monto_base: number
    multas: number
    total: number
    cuotas_vencidas: number
  }> {
    const res = await query(`
      SELECT 
        COALESCE(SUM(monto), 0) as monto_base,
        COUNT(*) as cuotas_vencidas
      FROM cuotas_mensuales
      WHERE cliente_id = $1 AND estado = 'vencido'
    `, [clienteId])
    
    const { monto_base, cuotas_vencidas } = res.rows[0]
    const multas = monto_base * 0.05 // 5% de multa por cuotas vencidas
    const total = monto_base + multas
    
    return {
      monto_base: Number(monto_base),
      multas: Number(multas),
      total: Number(total),
      cuotas_vencidas: Number(cuotas_vencidas)
    }
  }

  // Obtener configuración de pagos
  static async getConfiguracionPagos(): Promise<{
    dia_vencimiento: number
    dias_gracia: number
    multa_por_atraso: number
  }> {
    const res = await query(`
      SELECT dia_vencimiento, dias_gracia, multa_por_atraso
      FROM configuracion_pagos
      LIMIT 1
    `)
    return res.rows[0] || { dia_vencimiento: 5, dias_gracia: 3, multa_por_atraso: 5.00 }
  }

  // Actualizar configuración de pagos
  static async updateConfiguracionPagos(config: {
    dia_vencimiento: number
    dias_gracia: number
    multa_por_atraso: number
  }): Promise<void> {
    await query(`
      UPDATE configuracion_pagos 
      SET 
        dia_vencimiento = $1,
        dias_gracia = $2,
        multa_por_atraso = $3
      WHERE id = 1
    `, [config.dia_vencimiento, config.dias_gracia, config.multa_por_atraso])
  }
} 