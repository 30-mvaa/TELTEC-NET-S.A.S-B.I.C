import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database/connection";

export async function PUT(request: NextRequest) {
  try {
    const { campo, valorAntiguo, valorNuevo, precioNuevo } = await request.json();
    if (!["tipo_plan", "sector"].includes(campo)) {
      return NextResponse.json({ success: false, message: "Campo inválido" }, { status: 400 });
    }
    if (campo === "tipo_plan" && precioNuevo !== undefined) {
      await db.query(
        "UPDATE clientes SET tipo_plan = $1, precio_plan = $2 WHERE tipo_plan = $3",
        [valorNuevo, precioNuevo, valorAntiguo]
      );
    } else {
      await db.query(
        `UPDATE clientes SET ${campo} = $1 WHERE ${campo} = $2`,
        [valorNuevo, valorAntiguo]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al actualizar valor" }, { status: 500 });
  }
} 