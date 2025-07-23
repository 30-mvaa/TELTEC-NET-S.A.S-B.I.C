
/*// MODELO USER CON POSTGRESQL
import { query } from "../database/connection"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  email: string
  password_hash: string
  nombre: string
  rol: "administrador" | "economia" | "atencion_cliente"
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export class UserModel {
  static async getAll(): Promise<Omit<User, "password_hash">[]> {
    const result = await query(`
      SELECT id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
      FROM usuarios 
      ORDER BY fecha_creacion DESC
    `)
    return result.rows
  }

  static async getById(id: number): Promise<Omit<User, "password_hash"> | null> {
    const result = await query(
      `
      SELECT id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
      FROM usuarios 
      WHERE id = $1
    `,
      [id],
    )
    return result.rows[0] || null
  }

  static async getByEmail(email: string): Promise<User | null> {
    const result = await query("SELECT * FROM usuarios WHERE email = $1", [email])
    return result.rows[0] || null
  }

  static async authenticate(email: string, password: string): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.getByEmail(email)
    if (!user || !user.activo) return null

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) return null

    // Retornar usuario sin password_hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  static async create(
    userData: Omit<User, "id" | "fecha_creacion" | "fecha_actualizacion">,
  ): Promise<Omit<User, "password_hash">> {
    // Hash de la contraseña
    const saltRounds = 12
    const password_hash = await bcrypt.hash(userData.password_hash, saltRounds)

    const result = await query(
      `
      INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
    `,
      [userData.email, password_hash, userData.nombre, userData.rol, userData.activo ?? true],
    )
    return result.rows[0]
  }



  static async update(id: number, userData: Partial<User>): Promise<Omit<User, "password_hash"> | null> {
    const updateData = { ...userData }

    // Si se está actualizando la contraseña, hashearla
    if (updateData.password_hash) {
      const saltRounds = 12
      updateData.password_hash = await bcrypt.hash(updateData.password_hash, saltRounds)
    }

    const fields = Object.keys(updateData).filter((key) => key !== "id")
    const values = fields.map((field) => updateData[field as keyof User])
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ")

    if (fields.length === 0) return null

    const result = await query(
      `
      UPDATE usuarios 
      SET ${setClause}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
    `,
      [id, ...values],
    )

    return result.rows[0] || null
  }

  static async delete(id: number): Promise<boolean> {
    // Obtener el admin principal
    const adminPrincipal = await query(
      `SELECT id FROM usuarios WHERE rol = 'administrador' ORDER BY id ASC LIMIT 1`
    );
    if (adminPrincipal.rows.length && adminPrincipal.rows[0].id === id) {
      // No permitir eliminar el admin principal
      return false;
    }
    const result = await query("DELETE FROM usuarios WHERE id = $1", [id])
     return (result.rowCount ?? 0) > 0
  }

  static async changePassword(id: number, newPassword: string): Promise<boolean> {
    const saltRounds = 12
    const password_hash = await bcrypt.hash(newPassword, saltRounds)

    const result = await query(
      `
      UPDATE usuarios 
      SET password_hash = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [password_hash, id],
    )

     return (result.rowCount ?? 0) > 0
  }

  static async toggleActive(id: number): Promise<boolean> {
    const result = await query(
      `
      UPDATE usuarios 
      SET activo = NOT activo, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [id],
    )

     return (result.rowCount ?? 0) > 0
  }
}


*/


// lib/models/User.ts
import { query } from "../database/connection"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  email: string
  password_hash: string
  nombre: string
  rol: "administrador" | "economia" | "atencion_cliente"
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
  // Campos para recuperación de contraseña
  reset_token?: string | null
  reset_expires?: Date | null
}

export class UserModel {
  static async getAll(): Promise<Omit<User, "password_hash">[]> {
    const result = await query(`
      SELECT id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
      FROM usuarios 
      ORDER BY fecha_creacion DESC
    `)
    return result.rows
  }

  static async getById(id: number): Promise<Omit<User, "password_hash"> | null> {
    const result = await query(
      `
      SELECT id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
      FROM usuarios 
      WHERE id = $1
    `,
      [id],
    )
    return result.rows[0] || null
  }

  static async getByEmail(email: string): Promise<User | null> {
    const result = await query("SELECT * FROM usuarios WHERE email = $1", [email])
    return result.rows[0] || null
  }

  static async authenticate(email: string, password: string): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.getByEmail(email)
    if (!user || !user.activo) return null

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) return null

    const { password_hash, ...u } = user
    return u
  }

  static async create(
    userData: Omit<User, "id" | "fecha_creacion" | "fecha_actualizacion" | "reset_token" | "reset_expires">,
  ): Promise<Omit<User, "password_hash">> {
    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(userData.password_hash, salt)

    const result = await query(
      `
      INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
    `,
      [userData.email, hash, userData.nombre, userData.rol, userData.activo ?? true],
    )
    return result.rows[0]
  }

  static async update(id: number, userData: Partial<User>): Promise<Omit<User, "password_hash"> | null> {
    const data: Record<string, any> = { ...userData }

    if (data.password_hash) {
      const salt = await bcrypt.genSalt(12)
      data.password_hash = await bcrypt.hash(data.password_hash, salt)
    }

    const fields = Object.keys(data).filter((f) => f !== "id")
    if (!fields.length) return null

    const setCols = fields.map((f, i) => `${f}=$${i+2}`).join(", ")
    const values = fields.map((f) => data[f as keyof User])

    const result = await query(
      `
      UPDATE usuarios
      SET ${setCols}, fecha_actualizacion=CURRENT_TIMESTAMP
      WHERE id=$1
      RETURNING id, email, nombre, rol, activo, fecha_creacion, fecha_actualizacion
    `,
      [id, ...values],
    )
    return result.rows[0] || null
  }

  static async delete(id: number): Promise<boolean> {
    // Obtener el admin principal
    const adminPrincipal = await query(
      `SELECT id FROM usuarios WHERE rol = 'administrador' ORDER BY id ASC LIMIT 1`
    );
    if (adminPrincipal.rows.length && adminPrincipal.rows[0].id === id) {
      // No permitir eliminar el admin principal
      return false;
    }
    const res = await query("DELETE FROM usuarios WHERE id=$1", [id])
    return (res.rowCount ?? 0) > 0
  }

  static async changePassword(id: number, newPassword: string): Promise<boolean> {
    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(newPassword, salt)
    const res = await query(
      `UPDATE usuarios SET password_hash=$1, fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=$2`,
      [hash, id],
    )
    return (res.rowCount ?? 0) > 0
  }

  static async toggleActive(id: number): Promise<boolean> {
    const res = await query(
      `UPDATE usuarios SET activo=NOT activo, fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=$1`,
      [id],
    )
    return (res.rowCount ?? 0) > 0
  }

  //
  // ————— Funciones para recuperación de contraseña —————
  //

  /** Guarda el token y su expiración para un usuario */
  static async setResetToken(userId: number, token: string, expires: Date): Promise<boolean> {
    const res = await query(
      `UPDATE usuarios SET reset_token=$1, reset_expires=$2 WHERE id=$3`,
      [token, expires, userId],
    )
    return (res.rowCount ?? 0) > 0
  }

  /** Busca el registro de token, devolviendo user_id y expiración */
  static async getByResetToken(token: string): Promise<{ user_id: number; reset_expires: Date } | null> {
    const res = await query(
      `SELECT id AS user_id, reset_expires FROM usuarios WHERE reset_token=$1`,
      [token],
    )
    return res.rows[0] || null
  }

  /** Reemplaza la contraseña (ya hasheada) y actualiza fecha */
  static async updatePassword(userId: number, hashedPassword: string): Promise<boolean> {
    const res = await query(
      `UPDATE usuarios SET password_hash=$1, fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=$2`,
      [hashedPassword, userId],
    )
    return (res.rowCount ?? 0) > 0
  }

  /** Limpia token y expiración tras un reset exitoso */
  static async clearResetToken(userId: number): Promise<boolean> {
    const res = await query(
      `UPDATE usuarios SET reset_token=NULL, reset_expires=NULL WHERE id=$1`,
      [userId],
    )
    return (res.rowCount ?? 0) > 0
  }
}
