import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database/connection";

export async function GET() {
  try {
    const planesRes = await db.query("SELECT DISTINCT tipo_plan, precio_plan FROM clientes WHERE tipo_plan IS NOT NULL AND tipo_plan != '' ORDER BY tipo_plan");
    const sectoresRes = await db.query("SELECT DISTINCT sector FROM clientes WHERE sector IS NOT NULL AND sector != '' ORDER BY sector");
    return NextResponse.json({
      success: true,
      planes: planesRes.rows,
      sectores: sectoresRes.rows.map(r => r.sector),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al obtener valores únicos" }, { status: 500 });
  }
} 