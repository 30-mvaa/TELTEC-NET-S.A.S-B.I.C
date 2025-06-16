import { NextRequest, NextResponse } from "next/server"
// importamos el controlador **por defecto**
import RecaudacionController from "@/lib/controllers/RecaudacionController"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.has("onlyStats")) {
    const { data } = await RecaudacionController.getEstadisticas()
    return NextResponse.json({ success: true, data })
  }
  const res = await RecaudacionController.getAllPagos()
  return NextResponse.json(res, { status: res.success ? 200 : 500 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await RecaudacionController.createPago(body)
  return NextResponse.json(res, { status: res.success ? 201 : 400 })
}

export async function PUT(req: NextRequest) {
  const { id } = await req.json()
  const res = await RecaudacionController.markComprobanteSent(id)
  return NextResponse.json(res, { status: res.success ? 200 : 404 })
}
