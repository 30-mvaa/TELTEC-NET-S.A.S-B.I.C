import { NextResponse } from "next/server"
import db from "@/lib/database/connection"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ success: false, message: "Email requerido" }, { status: 400 })
  }

  // Verificar si el email existe
  const userResult = await db.query(`SELECT * FROM usuarios WHERE email = $1`, [email])
  const user = userResult.rows[0]

  if (!user) {
    return NextResponse.json({ success: true, message: "Si el correo existe, se enviará un enlace" }) // respuesta neutra por seguridad
  }

  // Generar token y expiración
  const resetToken = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minuto , despues de eso se expira 

  // Guardar en DB
  await db.query(
    `UPDATE usuarios SET reset_token = $1, reset_expires = $2 WHERE email = $3`,
    [resetToken, expires, email]
  )

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`

  // Enviar correo
  await sendEmail({
    to: email,
    subject: "Restablecimiento de contraseña",
    html: `<p>Haz clic <a href="${resetUrl}">aquí</a> para restablecer tu contraseña. El enlace expirará en 15 minutos.</p>`,
  })

  return NextResponse.json({ success: true, message: "Correo enviado si el email existe" })
}
