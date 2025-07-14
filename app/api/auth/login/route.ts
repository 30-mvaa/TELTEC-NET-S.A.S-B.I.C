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
    
    // Buscar usuario por email primero para obtener el ID
    const userResult = await db.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email]
    )
    const user = userResult.rows[0]
    
    // Si el usuario existe, verificar intentos de login
    if (user) {
      let intentoRes = await db.query(
        `SELECT * FROM login_intentos WHERE usuario_id = $1`,
        [user.id]
      )
      const intento = intentoRes.rows[0]
      
      // Verificar si está bloqueado por tiempo
      if (intento && intento.fecha_ultimo_intento) {
        const tiempoTranscurrido = now.getTime() - new Date(intento.fecha_ultimo_intento).getTime()
        const minutosTranscurridos = tiempoTranscurrido / 60000
        
        if (intento.intentos >= intentosMax && minutosTranscurridos < minutosBloqueo) {
          const minutosRestantes = Math.ceil(minutosBloqueo - minutosTranscurridos)
          return NextResponse.json(
            { success: false, message: `Demasiados intentos fallidos. Intente más tarde (${minutosRestantes} min).` },
            { status: 429 }
          )
        }
      }
    }

    // Registrar intento fallido si no existe usuario
    if (!user) {
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
        `INSERT INTO login_intentos (usuario_id, intentos, fecha_ultimo_intento)
         VALUES ($1, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (usuario_id) DO UPDATE SET 
           intentos = login_intentos.intentos + 1,
           fecha_ultimo_intento = CURRENT_TIMESTAMP
         RETURNING intentos`,
        [user.id]
      )
      const intentosActuales = res.rows[0]?.intentos || 1
      return NextResponse.json(
        { success: false, message: `Contraseña incorrecta. Intento ${intentosActuales} de ${intentosMax}` },
        { status: 401 }
      )
    }

    // Login exitoso: resetear intentos
    await db.query(
      `DELETE FROM login_intentos WHERE usuario_id = $1`,
      [user.id]
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
