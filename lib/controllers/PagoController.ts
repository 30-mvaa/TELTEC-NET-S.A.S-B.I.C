// CONTROLADOR - Pago
import { PagoModel } from "../models/Pago"
import { ClienteModel } from "../models/Cliente"

export class PagoController {
  static async getAllPagos() {
    try {
      return {
        success: true,
        data: PagoModel.getAll(),
        message: "Pagos obtenidos exitosamente",
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Error al obtener pagos",
      }
    }
  }

  static async createPago(pagoData: {
    cliente_id: number
    monto: number
    metodo_pago: string
    concepto: string
  }) {
    try {
      // Obtener información del cliente
      const cliente = ClienteModel.getById(pagoData.cliente_id)
      if (!cliente) {
        return {
          success: false,
          data: null,
          message: "Cliente no encontrado",
        }
      }

      // Crear el pago con información completa del cliente
      const newPago = PagoModel.create({
        cliente_id: pagoData.cliente_id,
        cliente_nombre: `${cliente.nombres} ${cliente.apellidos}`,
        cliente_email: cliente.email,
        cliente_cedula: cliente.cedula,
        tipo_plan: cliente.tipo_plan,
        monto: pagoData.monto,
        metodo_pago: pagoData.metodo_pago,
        concepto: pagoData.concepto,
      })

      return {
        success: true,
        data: newPago,
        message: "Pago registrado exitosamente",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "Error al registrar pago",
      }
    }
  }

  static async enviarComprobante(pagoId: number) {
    try {
      // Simular envío de email
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const success = PagoModel.marcarComprobanteEnviado(pagoId)
      if (!success) {
        return {
          success: false,
          data: null,
          message: "Pago no encontrado",
        }
      }

      return {
        success: true,
        data: null,
        message: "Comprobante enviado exitosamente",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "Error al enviar comprobante",
      }
    }
  }

  static async generarComprobante(pagoId: number) {
    try {
      const pago = PagoModel.getById(pagoId)
      if (!pago) {
        return {
          success: false,
          data: null,
          message: "Pago no encontrado",
        }
      }

      const comprobanteHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprobante de Pago - ${pago.numero_comprobante}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; background: linear-gradient(45deg, #0891b2, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .info { margin: 10px 0; }
            .total { font-size: 18px; font-weight: bold; background: #f1f5f9; padding: 10px; text-align: center; border-radius: 8px; }
            .footer { text-align: center; font-size: 12px; margin-top: 20px; color: #666; }
            .plan-badge { background: linear-gradient(45deg, #0891b2, #3b82f6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">TelTec Net</div>
            <div>Sistema de Gestión Empresarial</div>
            <div>Comprobante de Pago</div>
          </div>
          
          <div class="info"><strong>Comprobante:</strong> ${pago.numero_comprobante}</div>
          <div class="info"><strong>Fecha:</strong> ${pago.fecha_pago}</div>
          <div class="info"><strong>Cliente:</strong> ${pago.cliente_nombre}</div>
          <div class="info"><strong>Cédula:</strong> ${pago.cliente_cedula}</div>
          <div class="info"><strong>Plan:</strong> <span class="plan-badge">${pago.tipo_plan}</span></div>
          <div class="info"><strong>Concepto:</strong> ${pago.concepto}</div>
          <div class="info"><strong>Método de Pago:</strong> ${pago.metodo_pago}</div>
          
          <div class="total">
            <div>TOTAL PAGADO</div>
            <div style="font-size: 24px; color: #0891b2;">$${pago.monto.toFixed(2)}</div>
          </div>
          
          <div class="footer">
            <p>¡Gracias por su pago!</p>
            <p>TelTec Net - Servicio de Internet de Calidad</p>
            <p>Teléfono: 0999859689</p>
            <p>Email: vangamarca4@gmail.com</p>
          </div>
        </body>
        </html>
      `

      return {
        success: true,
        data: comprobanteHTML,
        message: "Comprobante generado",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "Error al generar comprobante",
      }
    }
  }

  static async getEstadisticas() {
    try {
      const stats = PagoModel.getEstadisticas()
      return {
        success: true,
        data: stats,
        message: "Estadísticas obtenidas",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "Error al obtener estadísticas",
      }
    }
  }

  static async getReportePorMetodo() {
    try {
      const reporte = PagoModel.getReportePorMetodo()
      return {
        success: true,
        data: reporte,
        message: "Reporte generado",
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Error al generar reporte",
      }
    }
  }

  static async filterPagos(filters: {
    searchTerm?: string
    metodo?: string
    estado?: string
  }) {
    try {
      let pagos = PagoModel.getAll()

      if (filters.searchTerm) {
        pagos = PagoModel.search(filters.searchTerm)
      }

      if (filters.metodo && filters.metodo !== "todos") {
        pagos = pagos.filter((p) => p.metodo_pago === filters.metodo)
      }

      if (filters.estado && filters.estado !== "todos") {
        pagos = pagos.filter((p) => p.estado === filters.estado)
      }

      return {
        success: true,
        data: pagos,
        message: `${pagos.length} pagos encontrados`,
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Error al filtrar pagos",
      }
    }
  }

  static async exportarReporte() {
    try {
      const pagos = PagoModel.getAll()
      const csvContent = [
        ["Comprobante", "Fecha", "Cliente", "Cédula", "Plan", "Concepto", "Método", "Monto", "Estado"].join(","),
        ...pagos.map((pago) =>
          [
            pago.numero_comprobante,
            pago.fecha_pago,
            `"${pago.cliente_nombre}"`,
            pago.cliente_cedula,
            `"${pago.tipo_plan}"`,
            `"${pago.concepto}"`,
            pago.metodo_pago,
            pago.monto,
            pago.estado,
          ].join(","),
        ),
      ].join("\n")

      return {
        success: true,
        data: csvContent,
        message: "Reporte exportado",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "Error al exportar reporte",
      }
    }
  }
}
