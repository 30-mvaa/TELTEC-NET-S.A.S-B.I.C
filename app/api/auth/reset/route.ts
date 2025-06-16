// app/api/auth/reset/route.ts
import { NextResponse } from "next/server"
import { AuthController } from "@/lib/controllers/AuthController"
import { sendEmail } from "@/lib/utils"


export async function POST(req: Request) {
  const { email } = await req.json()

  // Puedes añadir lógica para verificar si el email existe

  await sendEmail({
    to: email,
    subject: "Restablece tu contraseña",
    html: `<p>Haz clic <a href="http://localhost:3000/reset-password">aquí</a> para restablecer tu contraseña.</p>`,
  })

  return NextResponse.json({ success: true })
}
