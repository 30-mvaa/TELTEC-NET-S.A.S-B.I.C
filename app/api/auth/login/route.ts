import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/database/connection"
import bcrypt from "bcryptjs"

// Helper para obtener configuración de control de login
async function getLoginConfig() {
  const res = await db.query(
    `SELECT clave, valor FROM configuracion WHERE clave IN ('login_intentos_maximos', 'login_minutos_congelacion')`
  )
  const config: Record<string, string> = {}
  for (const row of res.rows) config[row.clave] = row.valor
  console.log('VALOR CRUDO login_intentos_maximos:', config.login_intentos_maximos);
  return {
    intentosMax: Number.isNaN(parseInt(config.login_intentos_maximos, 10)) ? 3 : parseInt(config.login_intentos_maximos, 10),
    minutosBloqueo: Number.isNaN(parseInt(config.login_minutos_congelacion, 10)) ? 5 : parseInt(config.login_minutos_congelacion, 10),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    // 1. Control de intentos y bloqueo
    const { intentosMax, minutosBloqueo } = await getLoginConfig()
    console.log('DEBUG login_intentos_maximos:', intentosMax, 'login_minutos_congelacion:', minutosBloqueo)
    const now = new Date()
    let intentoRes = await db.query(
      `SELECT * FROM login_intentos WHERE email = $1`,
      [email]
    )
    const intento = intentoRes.rows[0]
    if (intento && intento.bloqueado_hasta && new Date(intento.bloqueado_hasta) > now) {
      const minutosRestantes = Math.ceil((new Date(intento.bloqueado_hasta).getTime() - now.getTime()) / 60000)
      return NextResponse.json(
        { success: false, message: `Demasiados intentos fallidos. Intente más tarde (${minutosRestantes} min).` },
        { status: 429 }
      )
    }

    // Buscar usuario por email
    const result = await db.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email]
    )
    const user = result.rows[0]

    // Registrar intento fallido si no existe usuario
    if (!user) {
      const res = await db.query(
        `INSERT INTO login_intentos (email, intentos, bloqueado_hasta)
         VALUES ($1, 1, NULL)
         ON CONFLICT (email) DO UPDATE SET intentos = login_intentos.intentos + 1
         RETURNING intentos`,
        [email]
      )
      const intentosActuales = res.rows[1]?.intentos || 1
      if (intentosActuales >= intentosMax) {
        const bloqueadoHasta = new Date(Date.now() + minutosBloqueo * 60000)
        await db.query(
          `UPDATE login_intentos SET bloqueado_hasta = $2 WHERE email = $1`,
          [email, bloqueadoHasta]
        )
        return NextResponse.json(
          { success: false, message: `Demasiados intentos fallidos. Intente más tarde (${minutosBloqueo} min).` },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      // Registrar intento fallido
      const res = await db.query(
        `INSERT INTO login_intentos (email, intentos, bloqueado_hasta)
         VALUES ($1, 1, NULL)
         ON CONFLICT (email) DO UPDATE SET intentos = login_intentos.intentos + 1
         RETURNING intentos`,
        [email]
      )
      const intentosActuales = res.rows[0]?.intentos || 1
      if (intentosActuales >= intentosMax) {
        const bloqueadoHasta = new Date(Date.now() + minutosBloqueo * 60000)
        await db.query(
          `UPDATE login_intentos SET bloqueado_hasta = $2 WHERE email = $1`,
          [email, bloqueadoHasta]
        )
        return NextResponse.json(
          { success: false, message: `Demasiados intentos fallidos. Intente más tarde (${minutosBloqueo} min).` },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { success: false, message: `Contraseña incorrecta. Intento ${intentosActuales} de ${intentosMax}` },
        { status: 401 }
      )
    }

    // Login exitoso: resetear intentos
    await db.query(
      `DELETE FROM login_intentos WHERE email = $1`,
      [email]
    )

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
