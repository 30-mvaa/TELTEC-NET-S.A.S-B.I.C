import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/database/connection"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Faltan datos" },
        { status: 400 }
      )
    }

    // Buscar usuario por email
    const result = await db.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Contraseña incorrecta" },
        { status: 401 }
      )
    }

    // (Aquí podrías generar token o sesión si estás usando JWT o cookies)
    return NextResponse.json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
