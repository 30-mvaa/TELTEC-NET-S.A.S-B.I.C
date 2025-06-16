import { NextRequest, NextResponse } from "next/server"
import RecaudacionController from "@/lib/controllers/RecaudacionController"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const res = await RecaudacionController.generateComprobanteHTML(id)

  if (!res.success) {
    return NextResponse.json({ success: false, message: res.message }, { status: 404 })
  }

  // Devolvemos el HTML directamente para que window.open lo muestre
  return new NextResponse(res.data, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
