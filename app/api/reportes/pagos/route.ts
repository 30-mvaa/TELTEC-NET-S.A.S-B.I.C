import { NextResponse } from 'next/server'
import { PagoModel } from '@/lib/models/Pago'
import RecaudacionController from '@/lib/controllers/RecaudacionController'
import { sendEmail } from '@/lib/email'

export async function GET() {
  try {
    const pagos = await PagoModel.getAll()
    return NextResponse.json({ success: true, data: pagos })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error obteniendo los pagos." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { pagoIds } = await req.json()
    if (!Array.isArray(pagoIds) || pagoIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Debe enviar un array de IDs de pagos.' }, { status: 400 })
    }
    const resultados = []
    for (const id of pagoIds) {
      try {
        const comprobante = await RecaudacionController.generateComprobanteHTML(id)
        if (!comprobante.success) {
          resultados.push({ id, success: false, message: comprobante.message })
          continue
        }
        // Obtener email del cliente
        const pago = await PagoModel.getById(id)
        if (!pago || !pago.cliente_email) {
          resultados.push({ id, success: false, message: 'Pago o email no encontrado' })
          continue
        }
        await sendEmail({
          to: pago.cliente_email,
          subject: `Comprobante de Pago - TelTec Net`,
          html: comprobante.data,
        })
        await PagoModel.marcarComprobanteEnviado(id)
        resultados.push({ id, success: true })
      } catch (err) {
        resultados.push({ id, success: false, message: err instanceof Error ? err.message : 'Error desconocido' })
      }
    }
    return NextResponse.json({ success: true, resultados })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error en el envío masivo de comprobantes.' }, { status: 500 })
  }
}
