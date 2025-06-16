import { NextRequest, NextResponse } from "next/server"
import { GastoController } from "@/lib/controllers/GastoController"

export async function GET(request: NextRequest) {
  const result = await GastoController.getAllGastos()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await GastoController.createGasto(body)
  return NextResponse.json(result, { status: result.success ? 201 : 400 })
}

export async function PUT(request: NextRequest) {
  const { id, ...updates } = await request.json()
  const result = await GastoController.updateGasto(id, updates)
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const result = await GastoController.deleteGasto(id)
  return NextResponse.json(result, { status: result.success ? 200 : 404 })
}
