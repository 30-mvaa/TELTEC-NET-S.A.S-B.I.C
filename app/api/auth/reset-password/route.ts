import { NextResponse } from "next/server"
import db from "@/lib/database/connection"
import { hashPassword } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    // Validación de entrada
    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Datos incompletos o inválidos" },
        { status: 400 }
      )
    }

    // Buscar usuario con token válido y no expirado
    const userResult = await db.query(
      `SELECT id FROM usuarios WHERE reset_token = $1 AND reset_expires > NOW()`,
      [token]
    )

    const user = userResult.rows[0]

    // Si no se encuentra un usuario con ese token o está expirado
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Token inválido, expirado o ya usado" },
        { status: 400 }
      )
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(password)

    // Actualizar la contraseña y eliminar el token
    const update = await db.query(
      `UPDATE usuarios
       SET password_hash = $1,
           reset_token = NULL,
           reset_expires = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    )

    // Confirmación
    if (update.rowCount === 1) {
      return NextResponse.json({ success: true, message: "Contraseña actualizada con éxito" })
    } else {
      return NextResponse.json(
        { success: false, message: "No se pudo actualizar la contraseña" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
