// lib/models/Pago.ts
import { query } from "@/lib/database/connection"

export interface Pago {
  id: number
  cliente_id: number
  cliente_nombre: string
  cliente_email: string
  cliente_cedula: string
  tipo_plan: string
  monto: number               // ahora siempre number
  fecha_pago: string
  metodo_pago: string
  concepto: string
  estado: "completado" | "pendiente" | "fallido"
  comprobante_enviado: boolean
  numero_comprobante: string
  fecha_creacion: string
}

export class PagoModel {
  static async getAll(): Promise<Pago[]> {
    
    const res = await query(`
      SELECT
        p.id,
        p.cliente_id,
        p.monto::float     AS monto,               -- cast a float
        p.fecha_pago,
        p.metodo_pago,
        p.concepto,
        p.estado,
        p.comprobante_enviado,
        p.numero_comprobante,
        p.fecha_creacion,
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        c.email                         AS cliente_email,
        c.cedula                        AS cliente_cedula,
        c.tipo_plan
      FROM pagos p
      JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.fecha_creacion DESC
    `)
    return res.rows
  }

  static async getById(id: number): Promise<Pago | null> {
    const res = await query(
      `
      SELECT
        p.id,
        p.cliente_id,
        p.monto::float     AS monto,               -- cast a float
        p.fecha_pago,
        p.metodo_pago,
        p.concepto,
        p.estado,
        p.comprobante_enviado,
        p.numero_comprobante,
        p.fecha_creacion,
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        c.email                         AS cliente_email,
        c.cedula                        AS cliente_cedula,
        c.tipo_plan
      FROM pagos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
      `,
      [id]
    )
    return res.rows[0] || null
  }

  static async create(data: {
    cliente_id: number
    monto: number
    metodo_pago: string
    concepto: string
    numero_comprobante: string;
  }): Promise<Pago> {
    const numeroComprobante = `COMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`
    const insert = await query(
      `
      INSERT INTO pagos
        (cliente_id, monto, fecha_pago, metodo_pago, concepto, estado, comprobante_enviado, numero_comprobante)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, 'completado', false, $5)
      RETURNING id
      `,
      [data.cliente_id, data.monto, data.metodo_pago, data.concepto, numeroComprobante]
    )
    const id = insert.rows[0].id
    const pago = await this.getById(id)
    if (!pago) throw new Error("Pago creado pero no encontrado")
    return pago
  }

  static async marcarComprobanteEnviado(id: number): Promise<boolean> {
    const res = await query(
      `UPDATE pagos SET comprobante_enviado = true WHERE id = $1`,
      [id]
    )
    return (res.rowCount ?? 0) > 0
  }

  static async getEstadisticas(): Promise<{
    total_pagos: number
    total_recaudado: number
    promedio_pago: number
    pagos_mes_actual: number
    recaudado_mes_actual: number
  }> {
    const res = await query(`
      SELECT 
        COUNT(*) AS total_pagos,
        COALESCE(SUM(monto),0)::float AS total_recaudado,  -- cast
        COALESCE(AVG(monto),0)::float AS promedio_pago,    -- cast
        COUNT(
          CASE 
            WHEN DATE_PART('month', fecha_pago) = DATE_PART('month', CURRENT_DATE)
             AND DATE_PART('year', fecha_pago) = DATE_PART('year', CURRENT_DATE)
            THEN 1 
          END
        ) AS pagos_mes_actual,
        COALESCE(SUM(
          CASE 
            WHEN DATE_PART('month', fecha_pago) = DATE_PART('month', CURRENT_DATE)
             AND DATE_PART('year', fecha_pago) = DATE_PART('year', CURRENT_DATE)
            THEN monto ELSE 0 END
        ),0)::float AS recaudado_mes_actual               -- cast
      FROM pagos
      WHERE estado = 'completado'
    `)
    return res.rows[0]
  }

  static async search(term: string): Promise<Pago[]> {
    const like = `%${term}%`
    const res = await query(
      `
      SELECT
        p.id,
        p.cliente_id,
        p.monto::float     AS monto,               -- cast a float
        p.fecha_pago,
        p.metodo_pago,
        p.concepto,
        p.estado,
        p.comprobante_enviado,
        p.numero_comprobante,
        p.fecha_creacion,
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        c.email                         AS cliente_email,
        c.cedula                        AS cliente_cedula,
        c.tipo_plan
      FROM pagos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE 
        LOWER(c.nombres) LIKE LOWER($1) OR
        LOWER(c.apellidos) LIKE LOWER($1) OR
        c.cedula LIKE $1 OR
        UPPER(p.numero_comprobante) LIKE UPPER($1) OR
        LOWER(p.concepto) LIKE LOWER($1)
      ORDER BY p.fecha_creacion DESC
      `,
      [like]
    )
    return res.rows
  }

  static async exportCSV(): Promise<string> {
    const pagos = await this.getAll()
    const header = [
      "Fecha",
      "Cliente",
      "Cédula",
      "Plan",
      "Monto",
      "Método",
      "Comprobante",
    ].join(",")
    const lines = pagos.map((p) =>
      [
        p.fecha_pago,
        `"${p.cliente_nombre}"`,
        p.cliente_cedula,
        `"${p.tipo_plan}"`,
        p.monto.toFixed(2),           // ahora sí funciona
        p.metodo_pago,
        p.numero_comprobante,
      ].join(",")
    )
    return [header, ...lines].join("\n")
  }
}