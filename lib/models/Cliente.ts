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

  static async getEstadisticas() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
        COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as inactivos,
        COUNT(CASE WHEN estado = 'suspendido' THEN 1 END) as suspendidos,
        COUNT(CASE WHEN DATE_PART('month', fecha_registro) = DATE_PART('month', CURRENT_DATE) 
                   AND DATE_PART('year', fecha_registro) = DATE_PART('year', CURRENT_DATE) 
                   THEN 1 END) as nuevos_mes
      FROM public.clientes
    `)
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
}