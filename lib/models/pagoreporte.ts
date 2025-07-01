// lib/models/pagoreporte.ts
import { query } from "@/lib/database/connection";

export interface PagoStats {
  total_pagos: number;
  total_recaudado: number;
  promedio_pago: number;
}

export class PagoModel {
  // ... otros métodos (getAll, getById, create, etc.)

  /**
   * Obtiene estadísticas de pagos completados para un mes y año específicos.
   * Devuelve solo los datos del periodo indicado.
   */
  static async getEstadisticas(filters: { month: string; year: string }): Promise<PagoStats> {
    const m = parseInt(filters.month, 10);
    const y = parseInt(filters.year, 10);

    const sql = `
      SELECT
        COUNT(*)::int            AS total_pagos,
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
