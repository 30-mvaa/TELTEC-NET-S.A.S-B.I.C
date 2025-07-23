import { PagoModel } from "@/lib/models/Pago"
import type { Pago } from "@/lib/models/Pago"
import { query } from "@/lib/database/connection"
import { sendEmail } from "@/lib/email"

type Stats = {
  total_pagos: number
  total_recaudado: number
  promedio_pago: number
  pagos_mes_actual: number
  recaudado_mes_actual: number
}

function generarNumeroComprobante(codigoEmpresa = "EIDZ"): string {
  const prefijo = "COMP";
  const timestamp = Date.now();
  return `${prefijo}-${timestamp}-${codigoEmpresa}`;
}

export default class RecaudacionController {
  static async getAllPagos(): Promise<{ success: boolean; data: Pago[] }> {
    const data = await PagoModel.getAll()
    return { success: true, data }
  }

  static async createPago(body: {
    cliente_id: number
    monto: number
    metodo_pago: string
    concepto: string
  }): Promise<{ success: boolean; message: string; data: Pago }> {
    console.log("[Recaudacion] Iniciando registro de pago", body)
    // Generamos el número único de comprobante
    const numero_comprobante = generarNumeroComprobante()
    console.log("[Recaudacion] Numero comprobante generado:", numero_comprobante)

    // Añadimos el número al cuerpo para crear el pago
    let data: Pago
    try {
      data = await PagoModel.create({ ...body, numero_comprobante })
      console.log("[Recaudacion] Pago creado en la base de datos", data)
    } catch (error) {
      console.error("[Recaudacion] Error creando el pago:", error)
      throw error
    }

    // Marcar como pagada la cuota pendiente más antigua del cliente
    try {
      await query(`
        UPDATE cuotas_mensuales
        SET estado = 'pagado', fecha_pago = CURRENT_DATE, pago_id = $1
        WHERE cliente_id = $2 AND estado = 'pendiente'
        ORDER BY año ASC, mes ASC
        LIMIT 1
      `, [data.id, body.cliente_id])
      console.log("[Recaudacion] Cuota pendiente marcada como pagada")
    } catch (error) {
      console.error("[Recaudacion] Error actualizando cuota:", error)
    }

    // Retornar la respuesta al frontend primero
    setImmediate(async () => {
      try {
        const comprobante = await this.generateComprobanteHTML(data.id)
        if (comprobante.success) {
          await sendEmail({
            to: data.cliente_email,
            subject: "Comprobante de Pago - TelTec Net",
            html: comprobante.data,
          })
          await PagoModel.marcarComprobanteEnviado(data.id)
          console.log("[Recaudacion] Comprobante enviado por email y marcado como enviado")
        }
      } catch (error) {
        console.error("Error enviando comprobante por email:", error)
      }
    })

    console.log("[Recaudacion] Pago registrado exitosamente, retornando al frontend")
    return { success: true, message: "Pago creado exitosamente", data }
  }

  static async markComprobanteSent(id: number): Promise<{ success: boolean; message: string }> {
    const ok = await PagoModel.marcarComprobanteEnviado(id)
    return {
      success: ok,
      message: ok ? "Comprobante marcado como enviado" : "Pago no encontrado",
    }
  }

  static async getEstadisticas(): Promise<{ success: boolean; data: Stats }> {
    const data = await PagoModel.getEstadisticas()
    return { success: true, data }
  }

  static async exportCSV(): Promise<{ success: boolean; data: string }> {
    const csv = await PagoModel.exportCSV()
    return { success: true, data: csv }
  }

  static async generateComprobanteHTML(
    id: number
  ): Promise<{ success: boolean; data: string; message?: string }> {
    const pago = await PagoModel.getById(id)
    if (!pago) {
      return { success: false, data: "", message: "Pago no encontrado" }
    }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8"/>
        <title>Comprobante ${pago.numero_comprobante}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { display: flex; align-items: center; background: #004aad; padding: 16px; color: #fff; }
          .header img { height: 40px; margin-right: 12px; }
          .header h1 { font-size: 20px; margin: 0; }
          .content { padding: 24px; }
          .content h2 { margin-top: 0; color: #333; }
          .details { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .details td { padding: 8px; border-bottom: 1px solid #eee; }
          .details td.label { width: 30%; color: #555; }
          .footer { text-align: center; padding: 16px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="/logo-teltec.jpg" alt="TelTec Net Logo" />
            <h1>TelTec Net</h1>
          </div>
          <div class="content">
            <h2>Comprobante de Pago </h2>
            <table class="details">
              <tr>
                <td class="label"><strong>Número</strong></td>
                <td>${pago.numero_comprobante}</td>
              </tr>
              <tr>
                <td class="label"><strong>Cliente</strong></td>
                <td>${pago.cliente_nombre}</td>
              </tr>
              <tr>
                <td class="label"><strong>Cédula</strong></td>
                <td>${pago.cliente_cedula}</td>
              </tr>
              <tr>
                <td class="label"><strong>Plan</strong></td>
                <td>${pago.tipo_plan}</td>
              </tr>
              <tr>
                <td class="label"><strong>Monto</strong></td>
                <td>$${pago.monto.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label"><strong>Método</strong></td>
                <td>${pago.metodo_pago}</td>
              </tr>
              <tr>
                <td class="label"><strong>Fecha Pago</strong></td>
                <td>${pago.fecha_pago}</td>
              </tr>
            </table>
            <p>Gracias por su pago y por confiar en <strong>TelTec Net</strong>.</p>
          </div>
          <div class="footer">
            TelTec Net &bull; www.teltecnet.com &bull; contacto@teltecnet.com
          </div>
        </div>
      </body>
      </html>
    `
    return { success: true, data: html }
  }

  static async generarCuotasMensuales(): Promise<void> {
    await query('SELECT generar_cuotas_mensuales()')
  }
}
