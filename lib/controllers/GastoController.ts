import type { Gasto } from "@/lib/models/Gasto"
import { GastoModel } from "@/lib/models/Gasto"

interface ControllerResult<T> {
  success: boolean
  data: T | T[] | null
  message: string
}

export class GastoController {
  /**
   * Obtiene todos los gastos de la base de datos
   */
  static async getAllGastos(): Promise<ControllerResult<Gasto[]>> {
    try {
      const gastos = await GastoModel.getAll()
      return {
        success: true,
        data: gastos,
        message: "Gastos obtenidos exitosamente",
      }
    } catch (error) {
      console.error("Error en getAllGastos:", error)
      return {
        success: false,
        data: [],
        message: "Error obteniendo gastos",
      }
    }
  }

  /**
   * Obtiene un gasto por su ID
   */
  static async getGastoById(id: number): Promise<ControllerResult<Gasto>> {
    try {
      const gasto = await GastoModel.getById(id)
      if (!gasto) {
        return { success: false, data: null, message: "Gasto no encontrado" }
      }
      return { success: true, data: gasto, message: "Gasto encontrado" }
    } catch (error) {
      console.error("Error en getGastoById:", error)
      return { success: false, data: null, message: "Error obteniendo gasto" }
    }
  }

  /**
   * Crea un nuevo gasto
   */
  static async createGasto(
    gastoData: Omit<Gasto, "id" | "fecha_creacion" | "usuario_nombre">
  ): Promise<ControllerResult<Gasto>> {
    try {
      const nuevo = await GastoModel.create(gastoData)
      return { success: true, data: nuevo, message: "Gasto creado exitosamente" }
    } catch (error) {
      console.error("Error en createGasto:", error)
      return { success: false, data: null, message: "Error creando gasto" }
    }
  }

  /**
   * Actualiza un gasto existente
   */
  static async updateGasto(
    id: number,
    updates: Partial<Gasto>
  ): Promise<ControllerResult<Gasto>> {
    try {
      const actualizado = await GastoModel.update(id, updates)
      if (!actualizado) {
        return { success: false, data: null, message: "Gasto no encontrado" }
      }
      return { success: true, data: actualizado, message: "Gasto actualizado exitosamente" }
    } catch (error) {
      console.error("Error en updateGasto:", error)
      return { success: false, data: null, message: "Error actualizando gasto" }
    }
  }

  /**
   * Elimina un gasto por su ID
   */
  static async deleteGasto(id: number): Promise<ControllerResult<null>> {
    try {
      const eliminado = await GastoModel.delete(id)
      if (!eliminado) {
        return { success: false, data: null, message: "Gasto no encontrado" }
      }
      return { success: true, data: null, message: "Gasto eliminado exitosamente" }
    } catch (error) {
      console.error("Error en deleteGasto:", error)
      return { success: false, data: null, message: "Error eliminando gasto" }
    }
  }
}
