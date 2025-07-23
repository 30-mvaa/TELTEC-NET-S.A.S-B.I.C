import { NextResponse } from 'next/server'
import { ClienteModel } from '@/lib/models/Cliente'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'general'
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let data = []
    let resumen = undefined
    let anio = year ? parseInt(year) : new Date().getFullYear()

    switch (action) {
      case 'anual':
        data = await ClienteModel.getClientesPorAnio(anio)
        break
      case 'mensual':
        if (!month) return NextResponse.json({ success: false, error: 'Falta el mes' }, { status: 400 })
        data = await ClienteModel.getClientesPorMes(anio, parseInt(month))
        break
      case 'detallado':
        // Devuelve clientes con pagos por mes y resumen anual
        const detallado = await ClienteModel.getReporteDetallado(anio)
        data = detallado.clientes
        resumen = detallado.resumen
        break
      case 'general':
      default:
        data = await ClienteModel.getAllActivos()
        break
    }
    return NextResponse.json({ success: true, data, resumen, anio })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error obteniendo reporte de clientes' }, { status: 500 })
  }
}
