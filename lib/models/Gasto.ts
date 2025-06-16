// MODELO GASTO CON POSTGRESQL
import { query } from "../database/connection"

export interface Gasto {
  id: number
  descripcion: string
  categoria: string
  monto: number
  fecha_gasto: string
  proveedor?: string
  metodo_pago?: string
  comprobante_url?: string
  usuario_id: number
  usuario_nombre?: string
  fecha_creacion: string
}

export class GastoModel {
  static async getAll(): Promise<Gasto[]> {
    const result = await query(`
      SELECT 
        g.*,
        u.nombre as usuario_nombre
      FROM gastos g
      LEFT JOIN usuarios u ON g.usuario_id = u.id
      ORDER BY g.fecha_creacion DESC
    `)
    return result.rows
  }

  static async getById(id: number): Promise<Gasto | null> {
    const result = await query(
      `
      SELECT 
        g.*,
        u.nombre as usuario_nombre
      FROM gastos g
      LEFT JOIN usuarios u ON g.usuario_id = u.id
      WHERE g.id = $1
    `,
      [id],
    )
    return result.rows[0] || null
  }

  static async create(gastoData: Omit<Gasto, "id" | "fecha_creacion" | "usuario_nombre">): Promise<Gasto> {
    const result = await query(
      `
      INSERT INTO gastos (
        descripcion, categoria, monto, fecha_gasto, 
        proveedor, metodo_pago, comprobante_url, usuario_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        gastoData.descripcion,
        gastoData.categoria,
        gastoData.monto,
        gastoData.fecha_gasto,
        gastoData.proveedor,
        gastoData.metodo_pago,
        gastoData.comprobante_url,
        gastoData.usuario_id,
      ],
    )

    return (await this.getById(result.rows[0].id)) as Gasto
  }

  static async update(id: number, gastoData: Partial<Gasto>): Promise<Gasto | null> {
    const fields = Object.keys(gastoData).filter((key) => key !== "id" && key !== "usuario_nombre")
    const values = fields.map((field) => gastoData[field as keyof Gasto])
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ")

    if (fields.length === 0) return null

    const result = await query(
      `
      UPDATE gastos 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `,
      [id, ...values],
    )

    if (result.rows[0]) {
      return await this.getById(result.rows[0].id)
    }
    return null
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query("DELETE FROM gastos WHERE id = $1", [id])
    return result.rowCount > 0
  }

  static async getEstadisticas() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_gastos,
        SUM(monto) as total_gastado,
        AVG(monto) as promedio_gasto,
        COUNT(CASE WHEN DATE_PART('month', fecha_gasto) = DATE_PART('month', CURRENT_DATE) 
                   AND DATE_PART('year', fecha_gasto) = DATE_PART('year', CURRENT_DATE) 
                   THEN 1 END) as gastos_mes_actual,
        SUM(CASE WHEN DATE_PART('month', fecha_gasto) = DATE_PART('month', CURRENT_DATE) 
                 AND DATE_PART('year', fecha_gasto) = DATE_PART('year', CURRENT_DATE) 
                 THEN monto ELSE 0 END) as gastado_mes_actual
      FROM gastos
    `)
    return result.rows[0]
  }

  static async getGastosPorCategoria() {
    const result = await query(`
      SELECT 
        categoria,
        COUNT(*) as cantidad,
        SUM(monto) as total,
        AVG(monto) as promedio
      FROM gastos 
      GROUP BY categoria 
      ORDER BY total DESC
    `)
    return result.rows
  }

  static async getGastosPorMes(year: number) {
    const result = await query(
      `
      SELECT 
        DATE_PART('month', fecha_gasto) as mes,
        COUNT(*) as cantidad_gastos,
        SUM(monto) as total_gastado
      FROM gastos 
      WHERE DATE_PART('year', fecha_gasto) = $1
      GROUP BY DATE_PART('month', fecha_gasto)
      ORDER BY mes
    `,
      [year],
    )
    return result.rows
  }

  static async getCategorias(): Promise<string[]> {
    const result = await query(`
      SELECT DISTINCT categoria 
      FROM gastos 
      WHERE categoria IS NOT NULL 
      ORDER BY categoria
    `)
    return result.rows.map((row) => row.categoria)
  }

  static async search(term: string): Promise<Gasto[]> {
    const result = await query(
      `
      SELECT 
        g.*,
        u.nombre as usuario_nombre
      FROM gastos g
      LEFT JOIN usuarios u ON g.usuario_id = u.id
      WHERE 
        LOWER(g.descripcion) LIKE LOWER($1) OR
        LOWER(g.categoria) LIKE LOWER($1) OR
        LOWER(g.proveedor) LIKE LOWER($1) OR
        LOWER(u.nombre) LIKE LOWER($1)
      ORDER BY g.fecha_creacion DESC
    `,
      [`%${term}%`],
    )
    return result.rows
  }
}
