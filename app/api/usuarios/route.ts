import { NextRequest, NextResponse } from "next/server"
import { AuthController } from "@/lib/controllers/AuthController"
import { UserModel } from "@/lib/models/User"

export async function GET() {
  const result = await AuthController.getAllUsers()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, nombre, rol, password, activo } = body

    // Validaciones básicas
    if (!email || !nombre || !rol || !password) {
      return NextResponse.json(
        { success: false, message: "Faltan datos" },
        { status: 400 }
      )
    }

    // Verificar correo único
    const existing = await UserModel.getByEmail(email)
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email ya registrado" },
        { status: 409 }
      )
    }

    // Crear usuario
    const result = await AuthController.createUser({
      email,
      nombre,
      rol,
      password_hash: password,
      activo,
    })

    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error("Error en API de registro:", error)
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, rol, password, activo } = body

    if (!id || !nombre || !rol) {
      return NextResponse.json(
        { success: false, message: "Faltan datos para actualizar" },
        { status: 400 }
      )
    }

    // No permitimos cambiar email
    const updateData: any = { nombre, rol, activo }
    if (password) {
      updateData.password_hash = password
    }

    const result = await AuthController.updateUser(id, updateData)
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 404 })
    }
  } catch (error) {
    console.error("Error en API de actualización:", error)
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de usuario requerido" },
        { status: 400 }
      )
    }

    const result = await AuthController.deleteUser(id)
    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      // Mensaje especial si es admin principal
      return NextResponse.json(
        { success: false, message: "No se puede eliminar el administrador principal del sistema." },
        { status: 403 }
      )
    }
  } catch (error) {
    console.error("Error en API de eliminación:", error)
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    )
  }
}
