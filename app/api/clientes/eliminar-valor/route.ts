import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database/connection";

export async function PUT(request: NextRequest) {
  try {
    const { campo, valor, reemplazo } = await request.json();
    if (!["tipo_plan", "sector"].includes(campo)) {
      return NextResponse.json({ success: false, message: "Campo inválido" }, { status: 400 });
    }
    // Reemplaza el valor por otro o por vacío
    await db.query(
      `UPDATE clientes SET ${campo} = $1 WHERE ${campo} = $2`,
      [reemplazo || "", valor]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al eliminar valor" }, { status: 500 });
  }
} 