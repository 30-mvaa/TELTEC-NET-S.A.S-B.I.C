import { NextRequest, NextResponse } from "next/server";
import { saveAuditLog } from "@/lib/models/auditLog";

export async function POST(request: NextRequest) {
  try {
    const { userId, rol } = await request.json();

    if (!userId || !rol) {
      return NextResponse.json({ success: false, message: "Faltan datos de usuario" }, { status: 400 });
    }

    await saveAuditLog({
      userId,
      role: rol,
      action: "logout",
      details: "Cierre de sesión",
      sessionId: undefined,
    });

    return NextResponse.json({ success: true, message: "Logout registrado" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error al registrar logout" }, { status: 500 });
  }
} 