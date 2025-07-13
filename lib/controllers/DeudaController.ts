// lib/controllers/DeudaController.ts
import { ClienteDeudaModel, type ClienteDeuda, type CuotaMensual, type HistorialPago } from "@/lib/models/ClienteDeuda"

export default class DeudaController {
  // Obtener todos los clientes con información de deudas
  static async getAllClientesWithDeudas(): Promise<{ success: boolean; data: ClienteDeuda[] }> {
    try {
      const data = await ClienteDeudaModel.getAllWithDeudas()
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo clientes con deudas:", error)
      return { success: false, data: [] }
    }
  }

  // Obtener cliente específico con deudas
  static async getClienteWithDeudas(id: number): Promise<{ success: boolean; data: ClienteDeuda | null }> {
    try {
      const data = await ClienteDeudaModel.getByIdWithDeudas(id)
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo cliente con deudas:", error)
      return { success: false, data: null }
    }
  }

  // Obtener cuotas mensuales de un cliente
  static async getCuotasByCliente(clienteId: number): Promise<{ success: boolean; data: CuotaMensual[] }> {
    try {
      const data = await ClienteDeudaModel.getCuotasByCliente(clienteId)
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo cuotas del cliente:", error)
      return { success: false, data: [] }
    }
  }

  // Obtener historial de pagos de un cliente
  static async getHistorialByCliente(clienteId: number): Promise<{ success: boolean; data: HistorialPago[] }> {
    try {
      const data = await ClienteDeudaModel.getHistorialByCliente(clienteId)
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo historial del cliente:", error)
      return { success: false, data: [] }
    }
  }

  // Generar cuotas mensuales
  static async generarCuotasMensuales(): Promise<{ success: boolean; message: string }> {
    try {
      await ClienteDeudaModel.generarCuotasMensuales()
      return { success: true, message: "Cuotas mensuales generadas exitosamente" }
    } catch (error) {
      console.error("Error generando cuotas mensuales:", error)
      return { success: false, message: "Error generando cuotas mensuales" }
    }
  }

  // Marcar cuotas vencidas
  static async marcarCuotasVencidas(): Promise<{ success: boolean; message: string }> {
    try {
      await ClienteDeudaModel.marcarCuotasVencidas()
      return { success: true, message: "Cuotas vencidas marcadas exitosamente" }
    } catch (error) {
      console.error("Error marcando cuotas vencidas:", error)
      return { success: false, message: "Error marcando cuotas vencidas" }
    }
  }

  // Actualizar estados de pagos
  static async actualizarEstadosPagos(): Promise<{ success: boolean; message: string }> {
    try {
      await ClienteDeudaModel.actualizarEstadosPagos()
      return { success: true, message: "Estados de pagos actualizados exitosamente" }
    } catch (error) {
      console.error("Error actualizando estados de pagos:", error)
      return { success: false, message: "Error actualizando estados de pagos" }
    }
  }

  // Obtener estadísticas de deudas
  static async getEstadisticasDeudas(): Promise<{ success: boolean; data: any }> {
    try {
      const data = await ClienteDeudaModel.getEstadisticasDeudas()
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo estadísticas de deudas:", error)
      return { success: false, data: null }
    }
  }

  // Obtener clientes vencidos
  static async getClientesVencidos(): Promise<{ success: boolean; data: ClienteDeuda[] }> {
    try {
      const data = await ClienteDeudaModel.getClientesVencidos()
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo clientes vencidos:", error)
      return { success: false, data: [] }
    }
  }

  // Obtener clientes próximos al vencimiento
  static async getClientesProximosVencimiento(): Promise<{ success: boolean; data: ClienteDeuda[] }> {
    try {
      const data = await ClienteDeudaModel.getClientesProximosVencimiento()
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo clientes próximos al vencimiento:", error)
      return { success: false, data: [] }
    }
  }

  // Calcular monto a pagar para un cliente
  static async calcularMontoAPagar(clienteId: number): Promise<{ success: boolean; data: any }> {
    try {
      const data = await ClienteDeudaModel.calcularMontoAPagar(clienteId)
      return { success: true, data }
    } catch (error) {
      console.error("Error calculando monto a pagar:", error)
      return { success: false, data: null }
    }
  }

  // Obtener configuración de pagos
  static async getConfiguracionPagos(): Promise<{ success: boolean; data: any }> {
    try {
      const data = await ClienteDeudaModel.getConfiguracionPagos()
      return { success: true, data }
    } catch (error) {
      console.error("Error obteniendo configuración de pagos:", error)
      return { success: false, data: null }
    }
  }

  // Actualizar configuración de pagos
  static async updateConfiguracionPagos(config: {
    dia_vencimiento: number
    dias_gracia: number
    multa_por_atraso: number
  }): Promise<{ success: boolean; message: string }> {
    try {
      await ClienteDeudaModel.updateConfiguracionPagos(config)
      return { success: true, message: "Configuración actualizada exitosamente" }
    } catch (error) {
      console.error("Error actualizando configuración de pagos:", error)
      return { success: false, message: "Error actualizando configuración" }
    }
  }

  // Proceso completo de actualización del sistema de deudas
  static async actualizarSistemaDeudas(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Marcar cuotas vencidas
      await ClienteDeudaModel.marcarCuotasVencidas()
      
      // 2. Actualizar estados de clientes
      await ClienteDeudaModel.actualizarEstadosPagos()
      
      // 3. Generar cuotas del mes actual si no existen
      await ClienteDeudaModel.generarCuotasMensuales()
      
      return { success: true, message: "Sistema de deudas actualizado exitosamente" }
    } catch (error) {
      console.error("Error actualizando sistema de deudas:", error)
      return { success: false, message: "Error actualizando sistema de deudas" }
    }
  }
} 