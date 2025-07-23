import { NextResponse } from 'next/server'
import { GastoController } from 'lib/controllers/GastoController'

export async function GET() {
  try {
    const result = await GastoController.getAllGastos()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error obteniendo los gastos." }, { status: 500 })
  }
}
