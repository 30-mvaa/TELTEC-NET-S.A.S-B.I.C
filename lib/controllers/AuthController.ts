// CONTROLADOR - Autenticación
/*
import { UserModel, type User } from "../models/User"

export class AuthController {
  static async login(email: string, password: string) {
    try {
      if (!email || !password) {
        return {
          success: false,
          data: null,
          message: "Email y contraseña son requeridos",
        }
      }

      // Añadir await aquí - esto era el problema principal
      const user = await UserModel.authenticate(email, password)
      
      if (!user) {
        return {
          success: false,
          data: null,
          message: "Credenciales incorrectas",
        }
      }

      return {
        success: true,
        data: user,
        message: "Login exitoso",
      }
    } catch (error) {
      console.error("Error en AuthController.login:", error)
      return {
        success: false,
        data: null,
        message: "Error en el servidor",
      }
    }
  }

  static async validateUser(userId: number) {
    try {
      // Añadir await aquí también
      const user = await UserModel.getById(userId)
      
      if (!user || !user.activo) {
        return {
          success: false,
          data: null,
          message: "Usuario no válido",
        }
      }

      return {
        success: true,
        data: user,
        message: "Usuario válido",
      }
    } catch (error) {
      console.error("Error en AuthController.validateUser:", error)
      return {
        success: false,
        data: null,
        message: "Error al validar usuario",
      }
    }
  }

  static async getAllUsers() {
    try {
      // Añadir await
      const users = await UserModel.getAll()
      return {
        success: true,
        data: users,
        message: "Usuarios obtenidos",
      }
    } catch (error) {
      console.error("Error en AuthController.getAllUsers:", error)
      return {
        success: false,
        data: [],
        message: "Error al obtener usuarios",
      }
    }
  }

  static async createUser(userData: Omit<User, "id" | "fecha_creacion" | "fecha_actualizacion">) {
    try {
      // Añadir await
      const newUser = await UserModel.create(userData)
      return {
        success: true,
        data: newUser,
        message: "Usuario creado exitosamente",
      }
    } catch (error) {
      console.error("Error en AuthController.createUser:", error)
      return {
        success: false,
        data: null,
        message: "Error al crear usuario",
      }
    }
  }

  static async updateUser(id: number, userData: Partial<User>) {
    try {
      // Añadir await
      const updatedUser = await UserModel.update(id, userData)
      
      if (!updatedUser) {
        return {
          success: false,
          data: null,
          message: "Usuario no encontrado",
        }
      }

      return {
        success: true,
        data: updatedUser,
        message: "Usuario actualizado",
      }
    } catch (error) {
      console.error("Error en AuthController.updateUser:", error)
      return {
        success: false,
        data: null,
        message: "Error al actualizar usuario",
      }
    }
  }

  static async deleteUser(id: number) {
    try {
      // Añadir await
      const deleted = await UserModel.delete(id)
      
      if (!deleted) {
        return {
          success: false,
          data: null,
          message: "Usuario no encontrado",
        }
      }

      return {
        success: true,
        data: null,
        message: "Usuario eliminado",
      }
    } catch (error) {
      console.error("Error en AuthController.deleteUser:", error)
      return {
        success: false,
        data: null,
        message: "Error al eliminar usuario",
      }
    }
  }
  
}

*/



// lib/controllers/AuthController.ts
import { sendEmail } from "@/lib/email"  // IMPORTANTE: actualizar la importación
import crypto from "crypto"
import { UserModel, type User } from "../models/User"
import { hashPassword } from "@/lib/utils"  // Mantener la importación de hashPassword desde utils.ts
import { saveAuditLog } from "../models/auditLog";


export class AuthController {
  static async login(email: string, password: string) {
    try {
      if (!email || !password) {
        return { success: false, data: null, message: "Email y contraseña son requeridos" }
      }
      const user = await UserModel.authenticate(email, password)
      if (!user) {
        return { success: false, data: null, message: "Credenciales incorrectas" }
      }
      // Registrar auditoría de login exitoso
      await saveAuditLog({
        userId: user.id,
        role: user.rol, // corregido: era 'role', debe ser 'rol'
        action: 'login',
        details: 'Inicio de sesión exitoso',
        sessionId: undefined // Puedes pasar un identificador de sesión si lo tienes
      });
      return { success: true, data: user, message: "Login exitoso" }
    } catch (error) {
      console.error("Error en AuthController.login:", error)
      return { success: false, data: null, message: "Error en el servidor" }
    }
  }

  static async validateUser(userId: number) {
    try {
      const user = await UserModel.getById(userId)
      if (!user || !user.activo) {
        return { success: false, data: null, message: "Usuario no válido" }
      }
      return { success: true, data: user, message: "Usuario válido" }
    } catch (error) {
      console.error("Error en AuthController.validateUser:", error)
      return { success: false, data: null, message: "Error al validar usuario" }
    }
  }

  static async getAllUsers() {
    try {
      const users = await UserModel.getAll()
      return { success: true, data: users, message: "Usuarios obtenidos" }
    } catch (error) {
      console.error("Error en AuthController.getAllUsers:", error)
      return { success: false, data: [], message: "Error al obtener usuarios" }
    }
  }

  static async createUser(userData: Omit<User, "id" | "fecha_creacion" | "fecha_actualizacion">) {
    try {
      const newUser = await UserModel.create(userData)
      return { success: true, data: newUser, message: "Usuario creado exitosamente" }
    } catch (error) {
      console.error("Error en AuthController.createUser:", error)
      return { success: false, data: null, message: "Error al crear usuario" }
    }
  }

  static async updateUser(id: number, userData: Partial<User>) {
    try {
      const updatedUser = await UserModel.update(id, userData)
      if (!updatedUser) {
        return { success: false, data: null, message: "Usuario no encontrado" }
      }
      return { success: true, data: updatedUser, message: "Usuario actualizado" }
    } catch (error) {
      console.error("Error en AuthController.updateUser:", error)
      return { success: false, data: null, message: "Error al actualizar usuario" }
    }
  }

  static async deleteUser(id: number) {
    try {
      const deleted = await UserModel.delete(id)
      if (!deleted) {
        return { success: false, data: null, message: "Usuario no encontrado" }
      }
      return { success: true, data: null, message: "Usuario eliminado" }
    } catch (error) {
      console.error("Error en AuthController.deleteUser:", error)
      return { success: false, data: null, message: "Error al eliminar usuario" }
    }
  }

  // -------------------------------------------------------
  // Olvidé mi contraseña
  // -------------------------------------------------------

  static async forgotPassword(email: string) {
    try {
      if (!email) {
        return { success: false, message: "Email es requerido" }
      }
      const user = await UserModel.getByEmail(email)
      if (!user) {
        return { success: false, message: "Email no registrado" }
      }
      // Generar token y caducidad (1 hora)
      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + 3600_000)
      await UserModel.setResetToken(user.id, token, expires)

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`
      await sendEmail({
        to: email,
        subject: "TelTec Net — Recuperar contraseña",
        html: `<p>Haz clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña.</p>`,
      })

      return { success: true, message: "Enlace de recuperación enviado" }
    } catch (error) {
      console.error("Error en AuthController.forgotPassword:", error)
      return { success: false, message: "Error al enviar enlace de recuperación" }
    }
  }

  // -------------------------------------------------------
  // Restablecer contraseña
  // -------------------------------------------------------

  static async resetPassword(token: string, newPassword: string) {
    try {
      const record = await UserModel.getByResetToken(token)
      if (!record || record.reset_expires < new Date()) {
        return { success: false, message: "Token inválido o expirado" }
      }
      const hashed = await hashPassword(newPassword)
      await UserModel.updatePassword(record.user_id, hashed)
      await UserModel.clearResetToken(record.user_id)
      return { success: true, message: "Contraseña restablecida con éxito" }
    } catch (error) {
      console.error("Error en AuthController.resetPassword:", error)
      return { success: false, message: "Error al restablecer contraseña" }
    }
  }
}
