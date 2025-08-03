import { type NextRequest, NextResponse } from "next/server"
import { ClienteController } from "@/lib/controllers/ClienteController"
import { validarCedulaEcuatoriana, validarMayorEdad } from "@/lib/utils"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    
    console.log(`Actualizando cliente ${id}:`, body)
    
    // Validar cédula ecuatoriana si se está actualizando
    if (body.cedula && !validarCedulaEcuatoriana(body.cedula)) {
      return NextResponse.json(
        { success: false, message: "Cédula ecuatoriana inválida" },
        { status: 400 }
      )
    }
    
    // Validar edad mínima si se está actualizando
    if (body.fecha_nacimiento && !validarMayorEdad(body.fecha_nacimiento)) {
      return NextResponse.json(
        { success: false, message: "El usuario debe ser mayor de 18 años" },
        { status: 400 }
      )
    }
    
    // Extraer solo los campos que se pueden actualizar
    const { id: clientId, ...updateData } = body
    
    const result = await ClienteController.updateCliente(id, updateData)
    
    if (result.success) {
      console.log(`✅ Cliente ${id} actualizado exitosamente:`, result.data)
      return NextResponse.json(result, { status: 200 })
    } else {
      console.log(`❌ Error actualizando cliente ${id}:`, result.message)
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error("Error actualizando cliente:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno al actualizar cliente",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Simular eliminación
    console.log(`Cliente ${id} eliminado (simulado)`)

    return NextResponse.json({
      success: true,
      message: "Cliente eliminado exitosamente (simulado)",
    })
  } catch (error) {
    console.error("Error eliminando cliente:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al eliminar cliente",
      },
      { status: 500 },
    )
  }
}
