// app/api/clientes/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { ClienteController } from "@/lib/controllers/ClienteController";
import type { Cliente } from "@/lib/models/Cliente";
import { validarCedulaEcuatoriana, validarMayorEdad } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const result = await ClienteController.getAllClientes();
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Forzamos a Cliente[] aun cuando TS infiera Cliente[][] | null
    const clientesArray: Cliente[] = (Array.isArray(result.data) ? result.data : []) as Cliente[];

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const estado = searchParams.get("estado") || "todos";
    const sector = searchParams.get("sector") || "todos";

    let clientes = clientesArray;

    // Filtros en memoria
    if (search) {
      const term = search.toLowerCase();
      clientes = clientes.filter((c) =>
        c.nombres.toLowerCase().includes(term) ||
        c.apellidos.toLowerCase().includes(term) ||
        c.cedula.includes(search) ||
        c.email.toLowerCase().includes(term) ||
        c.telefono.includes(search)
      );
    }
    if (estado !== "todos") {
      clientes = clientes.filter((c) => c.estado === estado);
    }
    if (sector !== "todos") {
      clientes = clientes.filter((c) =>
        c.sector.toLowerCase() === sector.toLowerCase()
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: clientes,
        total: clientes.length,
        message: `Clientes obtenidos: ${clientes.length}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en GET /api/clientes:", error);
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Datos recibidos para crear cliente:", body);
    
    // Validar cédula ecuatoriana
    if (!validarCedulaEcuatoriana(body.cedula)) {
      console.log("Cédula inválida:", body.cedula);
      return NextResponse.json(
        { success: false, message: "Cédula ecuatoriana inválida" },
        { status: 400 }
      );
    }
    
    // Validar edad mínima
    if (!validarMayorEdad(body.fecha_nacimiento)) {
      console.log("Fecha de nacimiento inválida:", body.fecha_nacimiento);
      return NextResponse.json(
        { success: false, message: "El usuario debe ser mayor de 18 años" },
        { status: 400 }
      );
    }
    
    const result = await ClienteController.createCliente(body);
    console.log("Resultado de creación:", result);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    console.error("Error en POST /api/clientes:", error);
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    // Validar cédula ecuatoriana si se está actualizando
    if (updates.cedula && !validarCedulaEcuatoriana(updates.cedula)) {
      return NextResponse.json(
        { success: false, message: "Cédula ecuatoriana inválida" },
        { status: 400 }
      );
    }
    
    // Validar edad mínima si se está actualizando
    if (updates.fecha_nacimiento && !validarMayorEdad(updates.fecha_nacimiento)) {
      return NextResponse.json(
        { success: false, message: "El usuario debe ser mayor de 18 años" },
        { status: 400 }
      );
    }
    
    const result = await ClienteController.updateCliente(id, updates);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error) {
    console.error("Error en PUT /api/clientes:", error);
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const result = await ClienteController.deleteCliente(id);
    return NextResponse.json(result, { status: result.success ? 200 : 404 });
  } catch (error) {
    console.error("Error en DELETE /api/clientes:", error);
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}

