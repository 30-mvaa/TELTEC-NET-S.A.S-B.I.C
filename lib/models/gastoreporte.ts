// lib/models/pagoreporte.ts
import { query } from "@/lib/database/connection";

export interface PagoStats {
  total_pagos: number;
  total_recaudado: number;
  promedio_pago: number;
}

export class PagoModel {
  /**
   * Obtiene todos los pagos (sin filtrar).
   */
  static async getAll(): Promise<any[]> {
    const res = await query(`
      SELECT *
      FROM pagos
      ORDER BY fecha_creacion DESC
    `);
    return res.rows;
  }

  /**
   * Obtiene un pago por ID.
   */
  static async getById(id: number): Promise<any | null> {
    const res = await query(
      `SELECT * FROM pagos WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Crea un nuevo pago.
   */
  static async create(data: {
    cliente_id: number;
    monto: number;
    metodo_pago: string;
    concepto: string;
  }): Promise<any> {
    const numeroComprobante = `COMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2,6)
      .toUpperCase()}`;
    const res = await query(
      `
      INSERT INTO pagos (cliente_id, monto, fecha_pago, metodo_pago, concepto, estado, comprobante_enviado, numero_comprobante)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, 'completado', false, $5)
      RETURNING id
      `,
      [data.cliente_id, data.monto, data.metodo_pago, data.concepto, numeroComprobante]
    );
    return this.getById(res.rows[0].id);
  }

  /**
   * Obtiene estadísticas de pagos completados para un mes y año específicos.
   * - total_pagos: número de registros
   * - total_recaudado: suma de montos
   * - promedio_pago: promedio de montos
   */
  static async getEstadisticas(filters: { month: string; year: string }): Promise<PagoStats> {
    const m = parseInt(filters.month, 10);
    const y = parseInt(filters.year, 10);

    const sql = `
      SELECT
        COUNT(*)::int               AS total_pagos,
        COALESCE(SUM(monto),0)::float AS total_recaudado,
        COALESCE(AVG(monto),0)::float AS promedio_pago
      FROM pagos
      WHERE estado = 'completado'
        AND DATE_PART('month', fecha_pago) = $1
        AND DATE_PART('year',  fecha_pago) = $2
    `;

    const res = await query(sql, [m, y]);
    return res.rows[0];
  }
}


// lib/models/gastoreporte.ts
import { query as gastoQuery } from "@/lib/database/connection";

export interface GastoStats {
  total_gastos: number;
  total_gastado: number;
  promedio_gasto: number;
}

export class GastoModel {
  /**
   * Obtiene todas las entradas de gastos.
   */
  static async getAll(): Promise<any[]> {
    const res = await gastoQuery(`
      SELECT *
      FROM gastos
      ORDER BY fecha_creacion DESC
    `);
    return res.rows;
  }

  /**
   * Obtiene un gasto por ID.
   */
  static async getById(id: number): Promise<any | null> {
    const res = await gastoQuery(
      `SELECT * FROM gastos WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Crea un nuevo registro de gasto.
   */
  static async create(data: {
    descripcion: string;
    categoria: string;
    monto: number;
    fecha_gasto: string;
    proveedor?: string;
    metodo_pago?: string;
    comprobante_url?: string;
    usuario_id: number;
  }): Promise<any> {
    const res = await gastoQuery(
      `
      INSERT INTO gastos (descripcion, categoria, monto, fecha_gasto, proveedor, metodo_pago, comprobante_url, usuario_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
      `,
      [
        data.descripcion,
        data.categoria,
        data.monto,
        data.fecha_gasto,
        data.proveedor,
        data.metodo_pago,
        data.comprobante_url,
        data.usuario_id,
      ]
    );
    return this.getById(res.rows[0].id);
  }

  /**
   * Obtiene estadísticas de gastos para un mes y año específicos.
   */
  static async getEstadisticas(filters: { month: string; year: string }): Promise<GastoStats> {
    const m = parseInt(filters.month, 10);
    const y = parseInt(filters.year, 10);

    const sql = `
      SELECT
        COUNT(*)::int                 AS total_gastos,
        COALESCE(SUM(monto),0)::float   AS total_gastado,
        COALESCE(AVG(monto),0)::float   AS promedio_gasto
      FROM gastos
      WHERE DATE_PART('month', fecha_gasto) = $1
        AND DATE_PART('year',  fecha_gasto) = $2
    `;

    const res = await gastoQuery(sql, [m, y]);
    return res.rows[0];
  }
}
