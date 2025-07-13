import { NextRequest, NextResponse } from "next/server";
import { ConfiguracionModel } from "@/lib/models/Configuracion";

// Obtener toda la configuración
export async function GET() {
  try {
    const config = await ConfiguracionModel.getAll();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al obtener configuración" }, { status: 500 });
  }
}

// Actualizar varias claves de configuración
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PUT /api/configuracion body:', body);
    // body debe ser un array de objetos: [{ clave, valor, descripcion? }, ...]
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Formato inválido" }, { status: 400 });
    }
    const results = [];
    for (const item of body) {
      if (!item.clave || typeof item.valor === "undefined") continue;
      const updated = await ConfiguracionModel.setConfig(item.clave, item.valor, item.descripcion);
      results.push(updated);
    }
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al actualizar configuración" }, { status: 500 });
  }
} 