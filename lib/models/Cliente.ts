import { query } from "../database/connection"

export interface Cliente {
  id: number
  cedula: string
  nombres: string
  apellidos: string
  tipo_plan: string
  precio_plan: number
  fecha_nacimiento: string
  direccion: string
  sector: string
  email: string
  telefono: string
  telegram_chat_id?: string
  estado: "activo" | "inactivo" | "suspendido"
  fecha_registro: string
  fecha_actualizacion: string
}

export class ClienteModel {
  static async getAll(): Promise<Cliente[]> {
    const result = await query(`
      SELECT id, cedula, nombres, apellidos, tipo_plan, precio_plan, fecha_nacimiento, 
             direccion, sector, email, telefono, estado, fecha_registro, fecha_actualizacion
      FROM public.clientes 
      ORDER BY fecha_registro DESC
    `)
    return result.rows
  }

  static async getAllActivos(): Promise<Cliente[]> {
    const result = await query(
      `SELECT * FROM public.clientes WHERE estado = 'activo' ORDER BY nombres, apellidos`
    )
    return result.rows
  }

  static async getById(id: number): Promise<Cliente | null> {
    const result = await query("SELECT * FROM public.clientes WHERE id = $1", [id])
    return result.rows[0] || null
  }

  static async getByCedula(cedula: string): Promise<Cliente | null> {
    const result = await query("SELECT * FROM public.clientes WHERE cedula = $1", [cedula])
    return result.rows[0] || null
  }

  /**  
   * Nuevo: busca cliente por email
   */
  static async getByEmail(email: string): Promise<Cliente | null> {
    const result = await query("SELECT * FROM public.clientes WHERE email = $1", [email])
    return result.rows[0] || null
  }

  static async create(
    clienteData: Omit<Cliente, "id" | "fecha_registro" | "fecha_actualizacion">
  ): Promise<Cliente> {
    const result = await query(
      `
      INSERT INTO public.clientes (
        cedula, nombres, apellidos, tipo_plan, precio_plan, fecha_nacimiento,
        direccion, sector, email, telefono, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        clienteData.cedula,
        clienteData.nombres,
        clienteData.apellidos,
        clienteData.tipo_plan,
        clienteData.precio_plan,
        clienteData.fecha_nacimiento,
        clienteData.direccion,
        clienteData.sector,
        clienteData.email,
        clienteData.telefono,
        clienteData.estado || "activo",
      ],
    )
    return result.rows[0]
  }

  static async update(
    id: number,
    clienteData: Partial<Cliente>
  ): Promise<Cliente | null> {
    const fields = Object.keys(clienteData).filter((key) => key !== "id")
    const values = fields.map((field) => clienteData[field as keyof Cliente])
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ")

    if (fields.length === 0) return null

    const result = await query(
      `
      UPDATE public.clientes 
      SET ${setClause}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id, ...values],
    )

    return result.rows[0] || null
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query("DELETE FROM public.clientes WHERE id = $1", [id])
    return (result.rowCount ?? 0) > 0
  }

  static async search(term: string): Promise<Cliente[]> {
    const result = await query(
      `
      SELECT * FROM public.clientes 
      WHERE 
        LOWER(nombres) LIKE LOWER($1) OR
        LOWER(apellidos) LIKE LOWER($1) OR
        cedula LIKE $1 OR
        LOWER(email) LIKE LOWER($1) OR
        telefono LIKE $1
      ORDER BY nombres, apellidos
      `,
      [`%${term}%`],
    )
    return result.rows
  }

  static async getByEstado(estado: string): Promise<Cliente[]> {
    const result = await query(
      "SELECT * FROM public.clientes WHERE estado = $1 ORDER BY nombres, apellidos",
      [estado],
    )
    return result.rows
  }

  static async getBySector(sector: string): Promise<Cliente[]> {
    const result = await query(
      "SELECT * FROM public.clientes WHERE LOWER(sector) = LOWER($1) ORDER BY nombres, apellidos",
      [sector],
    )
    return result.rows
  }

  /**
   * Obtiene estadísticas de clientes para un mes y año específicos.
   * - total: total de clientes
   * - activos: clientes activos
   * - inactivos: clientes inactivos
   * - suspendidos: clientes suspendidos
   * - nuevos_mes: clientes registrados en el mes/año indicado
   */
  static async getEstadisticas(filters: { month: string; year: string }) {
    const m = parseInt(filters.month, 10);
    const y = parseInt(filters.year, 10);
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
        COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as inactivos,
        COUNT(CASE WHEN estado = 'suspendido' THEN 1 END) as suspendidos,
        COUNT(CASE WHEN DATE_PART('month', fecha_registro) = $1 
                   AND DATE_PART('year', fecha_registro) = $2 
                   THEN 1 END) as nuevos_mes
      FROM public.clientes
    `, [m, y])
    return result.rows[0]
  }

  static async getEstadistica() {
    const result = await query(`
      SELECT tipo_plan, COUNT(*) AS clientes, SUM(precio_plan) AS ingresos
      FROM public.clientes
      GROUP BY tipo_plan
    `)
    return result.rows[0]
  }

  // --- Reporte Anual ---
  static async getClientesPorAnio(anio: number): Promise<any[]> {
    // Obtener todos los clientes activos registrados hasta el año dado
    const clientes = await query(
      `SELECT c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan, c.sector, c.estado, c.fecha_registro
       FROM public.clientes c
       WHERE c.estado = 'activo' AND DATE_PART('year', c.fecha_registro) <= $1
       ORDER BY c.nombres, c.apellidos`,
      [anio]
    )
    // Obtener pagos por cliente y mes para el año dado
    const pagos = await query(
      `SELECT p.cliente_id, EXTRACT(MONTH FROM p.fecha_pago) AS mes, SUM(p.monto) AS total, COUNT(*) AS cantidad
       FROM pagos p
       WHERE p.estado = 'completado' AND EXTRACT(YEAR FROM p.fecha_pago) = $1
       GROUP BY p.cliente_id, mes`,
      [anio]
    )
    // Mapear pagos por cliente y mes
    const pagosPorCliente: Record<number, Record<number, { total: number, cantidad: number }>> = {}
    pagos.rows.forEach((p: any) => {
      if (!pagosPorCliente[p.cliente_id]) pagosPorCliente[p.cliente_id] = {}
      pagosPorCliente[p.cliente_id][p.mes] = { total: Number(p.total), cantidad: Number(p.cantidad) }
    })
    // Construir estructura de clientes con pagos por mes y totales
    const clientesAnual = clientes.rows.map((c: any) => {
      let total_pagado_anio = 0
      let total_pagos_anio = 0
      const pagos_por_mes: Record<number, { total: number, cantidad: number } | null> = {}
      for (let m = 1; m <= 12; m++) {
        const pagoMes = pagosPorCliente[c.id]?.[m]
        pagos_por_mes[m] = pagoMes ? pagoMes : null
        if (pagoMes) {
          total_pagado_anio += pagoMes.total
          total_pagos_anio += pagoMes.cantidad
        }
      }
      return {
        ...c,
        pagos_por_mes,
        total_pagado_anio,
        total_pagos_anio
      }
    })
    return clientesAnual
  }

  // --- Reporte Mensual ---
  static async getClientesPorMes(anio: number, mes: number): Promise<any[]> {
    // Clientes activos que hayan realizado pagos en ese mes/año, con monto, cantidad y fechas
    const result = await query(
      `SELECT c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan, c.sector, c.estado, c.fecha_registro,
            SUM(p.monto) AS monto_pagado_mes,
            COUNT(p.id) AS cantidad_pagos_mes,
            ARRAY_AGG(p.fecha_pago) AS fechas_pago_mes
     FROM public.clientes c
     JOIN pagos p ON p.cliente_id = c.id
     WHERE c.estado = 'activo'
       AND DATE_PART('year', p.fecha_pago) = $1
       AND DATE_PART('month', p.fecha_pago) = $2
     GROUP BY c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan, c.sector, c.estado, c.fecha_registro
     ORDER BY c.nombres, c.apellidos`,
      [anio, mes]
    )
    return result.rows
  }

  // --- Reporte Detallado ---
  static async getReporteDetallado(anio: number): Promise<{ clientes: any[], resumen: any }> {
    // Pagos por mes y totales por cliente
    const clientes = await query(
      `SELECT c.id, c.cedula, c.nombres, c.apellidos, c.tipo_plan, c.precio_plan, c.sector, c.estado, c.fecha_registro
       FROM public.clientes c
       WHERE c.estado = 'activo'
       ORDER BY c.nombres, c.apellidos`
    )
    const pagos = await query(
      `SELECT p.cliente_id, EXTRACT(MONTH FROM p.fecha_pago) AS mes, SUM(p.monto) AS total, COUNT(*) AS cantidad
       FROM pagos p
       WHERE p.estado = 'completado' AND EXTRACT(YEAR FROM p.fecha_pago) = $1
       GROUP BY p.cliente_id, mes`,
      [anio]
    )
    // Mapear pagos por cliente y mes
    const pagosPorCliente: Record<number, Record<number, { total: number, cantidad: number }>> = {}
    pagos.rows.forEach((p: any) => {
      if (!pagosPorCliente[p.cliente_id]) pagosPorCliente[p.cliente_id] = {}
      pagosPorCliente[p.cliente_id][p.mes] = { total: Number(p.total), cantidad: Number(p.cantidad) }
    })
    // Construir estructura de clientes detallados
    const clientesDetallados = clientes.rows.map((c: any) => {
      let total_pagado_anio = 0
      let total_pagos_anio = 0
      const pagos_por_mes: Record<number, { total: number, cantidad: number } | null> = {}
      for (let m = 1; m <= 12; m++) {
        const pagoMes = pagosPorCliente[c.id]?.[m]
        pagos_por_mes[m] = pagoMes ? pagoMes : null
        if (pagoMes) {
          total_pagado_anio += pagoMes.total
          total_pagos_anio += pagoMes.cantidad
        }
      }
      return {
        ...c,
        pagos_por_mes,
        total_pagado_anio,
        total_pagos_anio
      }
    })
    // Resumen general
    const total_clientes = clientes.rows.length
    const total_recaudado_anio = clientesDetallados.reduce((sum, c) => sum + c.total_pagado_anio, 0)
    const total_pagos_anio = clientesDetallados.reduce((sum, c) => sum + c.total_pagos_anio, 0)
    const clientes_con_pagos = clientesDetallados.filter(c => c.total_pagado_anio > 0).length
    const clientes_sin_pagos = total_clientes - clientes_con_pagos
    const resumen = { total_recaudado_anio, total_pagos_anio, clientes_con_pagos, clientes_sin_pagos }
    return { clientes: clientesDetallados, resumen }
  }
}