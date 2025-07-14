import type { Cliente } from "@/lib/models/Cliente"
import { ClienteModel } from "@/lib/models/Cliente"
import { query } from "@/lib/database/connection"

interface ControllerResult<T> {
  success: boolean
  data: T | T[] | null
  message: string
}

export class ClienteController {
  /**
   * Obtiene todos los clientes de la base de datos
   */
  static async getAllClientes(): Promise<ControllerResult<Cliente[]>> {
    try {
      const clientes = await ClienteModel.getAll()
      return { success: true, data: clientes, message: "Clientes obtenidos exitosamente" }
    } catch (error) {
      console.error("Error en ClienteController.getAllClientes:", error)
      return { success: false, data: [], message: "Error obteniendo clientes" }
    }
  }

  /**
   * Obtiene un cliente por ID
   */
  static async getClienteById(id: number): Promise<ControllerResult<Cliente>> {
    try {
      const cliente = await ClienteModel.getById(id)
      if (!cliente) {
        return { success: false, data: null, message: "Cliente no encontrado" }
      }
      return { success: true, data: cliente, message: "Cliente encontrado" }
    } catch (error) {
      console.error("Error en ClienteController.getClienteById:", error)
      return { success: false, data: null, message: "Error obteniendo cliente" }
    }
  }

  /**
   * Busca un cliente por cédula
   */
  static async getByCedula(cedula: string): Promise<ControllerResult<Cliente>> {
    try {
      const cliente = await ClienteModel.getByCedula(cedula)
      return { success: true, data: cliente, message: cliente ? "Cliente encontrado" : "Cliente no encontrado" }
    } catch (error) {
      console.error("Error en ClienteController.getByCedula:", error)
      return { success: false, data: null, message: "Error buscando cliente por cédula" }
    }
  }

  /**
   * Busca un cliente por email
   */
  static async getByEmail(email: string): Promise<ControllerResult<Cliente>> {
    try {
      const cliente = await ClienteModel.getByEmail(email)
      return { success: true, data: cliente, message: cliente ? "Cliente encontrado" : "Cliente no encontrado" }
    } catch (error) {
      console.error("Error en ClienteController.getByEmail:", error)
      return { success: false, data: null, message: "Error buscando cliente por email" }
    }
  }

  /**
   * Crea un nuevo cliente
   */
  static async createCliente(
    clienteData: Omit<Cliente, "id" | "fecha_creacion" | "fecha_actualizacion">
  ): Promise<ControllerResult<Cliente>> {
    try {
      // Verificar cedula única
      const existeCedula = await ClienteModel.getByCedula(clienteData.cedula)
      if (existeCedula) {
        return { success: false, data: null, message: "Ya existe un cliente con esta cédula" }
      }
      // Verificar email único
      const existeEmail = await ClienteModel.getByEmail(clienteData.email)
      if (existeEmail) {
        return { success: false, data: null, message: "Ya existe un cliente con este email" }
      }
      const nuevo = await ClienteModel.create(clienteData)
      // Crear cuota inicial para el mes de registro
      const fechaRegistro = nuevo.fecha_registro || new Date().toISOString().slice(0, 10)
      const fecha = new Date(fechaRegistro)
      const mes = fecha.getMonth() + 1 // JS: 0-11, SQL: 1-12
      const año = fecha.getFullYear()
      await query(
        `INSERT INTO cuotas_mensuales (cliente_id, mes, año, monto, fecha_vencimiento, estado)
         VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
        [
          nuevo.id,
          mes,
          año,
          nuevo.precio_plan,
          fechaRegistro // puedes ajustar la lógica de vencimiento si lo deseas
        ]
      )
      return { success: true, data: nuevo, message: "Cliente creado exitosamente" }
    } catch (error) {
      console.error("Error en ClienteController.createCliente:", error)
      return { success: false, data: null, message: "Error creando cliente" }
    }
  }

  /**
   * Actualiza un cliente existente
   */
  static async updateCliente(
    id: number,
    updates: Partial<Omit<Cliente, "id" | "fecha_creacion" | "fecha_actualizacion">>
  ): Promise<ControllerResult<Cliente>> {
    try {
      // Si actualiza email, verificar unicidad
      if (updates.email) {
        const existing = await ClienteModel.getByEmail(updates.email)
        if (existing && existing.id !== id) {
          return { success: false, data: null, message: "El email ya está en uso" }
        }
      }
      const actualizado = await ClienteModel.update(id, updates)
      if (!actualizado) {
        return { success: false, data: null, message: "Cliente no encontrado" }
      }
      return { success: true, data: actualizado, message: "Cliente actualizado exitosamente" }
    } catch (error) {
      console.error("Error en ClienteController.updateCliente:", error)
      return { success: false, data: null, message: "Error actualizando cliente" }
    }
  }

  /**
   * Elimina un cliente por ID
   */
  static async deleteCliente(id: number): Promise<ControllerResult<null>> {
    try {
      const eliminado = await ClienteModel.delete(id)
      if (!eliminado) {
        return { success: false, data: null, message: "Cliente no encontrado" }
      }
      return { success: true, data: null, message: "Cliente eliminado exitosamente" }
    } catch (error) {
      console.error("Error en ClienteController.deleteCliente:", error)
      return { success: false, data: null, message: "Error eliminando cliente" }
    }
  }
}
