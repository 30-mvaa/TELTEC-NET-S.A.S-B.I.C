// app/api/deudas/route.ts
import { NextRequest, NextResponse } from "next/server"
import DeudaController from "@/lib/controllers/DeudaController"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get("action")
  const clienteId = url.searchParams.get("clienteId")

  try {
    switch (action) {
      case "estadisticas":
        const statsRes = await DeudaController.getEstadisticasDeudas()
        return NextResponse.json(statsRes, { status: statsRes.success ? 200 : 500 })

      case "clientes-vencidos":
        const vencidosRes = await DeudaController.getClientesVencidos()
        return NextResponse.json(vencidosRes, { status: vencidosRes.success ? 200 : 500 })

      case "clientes-proximos":
        const proximosRes = await DeudaController.getClientesProximosVencimiento()
        return NextResponse.json(proximosRes, { status: proximosRes.success ? 200 : 500 })

      case "cuotas":
        if (!clienteId) {
          return NextResponse.json({ success: false, message: "clienteId requerido" }, { status: 400 })
        }
        const cuotasRes = await DeudaController.getCuotasByCliente(Number(clienteId))
        return NextResponse.json(cuotasRes, { status: cuotasRes.success ? 200 : 500 })

      case "historial":
        if (!clienteId) {
          return NextResponse.json({ success: false, message: "clienteId requerido" }, { status: 400 })
        }
        const historialRes = await DeudaController.getHistorialByCliente(Number(clienteId))
        return NextResponse.json(historialRes, { status: historialRes.success ? 200 : 500 })

      case "monto-pagar":
        if (!clienteId) {
          return NextResponse.json({ success: false, message: "clienteId requerido" }, { status: 400 })
        }
        const montoRes = await DeudaController.calcularMontoAPagar(Number(clienteId))
        return NextResponse.json(montoRes, { status: montoRes.success ? 200 : 500 })

      case "configuracion":
        const configRes = await DeudaController.getConfiguracionPagos()
        return NextResponse.json(configRes, { status: configRes.success ? 200 : 500 })

      default:
        // Obtener todos los clientes con deudas
        const allRes = await DeudaController.getAllClientesWithDeudas()
        return NextResponse.json(allRes, { status: allRes.success ? 200 : 500 })
    }
  } catch (error) {
    console.error("Error en GET /api/deudas:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get("action")

  try {
    switch (action) {
      case "generar-cuotas":
        const generarRes = await DeudaController.generarCuotasMensuales()
        return NextResponse.json(generarRes, { status: generarRes.success ? 200 : 500 })

      case "marcar-vencidas":
        const marcarRes = await DeudaController.marcarCuotasVencidas()
        return NextResponse.json(marcarRes, { status: marcarRes.success ? 200 : 500 })

      case "actualizar-estados":
        const actualizarRes = await DeudaController.actualizarEstadosPagos()
        return NextResponse.json(actualizarRes, { status: actualizarRes.success ? 200 : 500 })

      case "actualizar-sistema":
        const sistemaRes = await DeudaController.actualizarSistemaDeudas()
        return NextResponse.json(sistemaRes, { status: sistemaRes.success ? 200 : 500 })

      default:
        return NextResponse.json(
          { success: false, message: "Acción no válida" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error en POST /api/deudas:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get("action")

  try {
    if (action === "configuracion") {
      const body = await req.json()
      const configRes = await DeudaController.updateConfiguracionPagos(body)
      return NextResponse.json(configRes, { status: configRes.success ? 200 : 500 })
    }

    return NextResponse.json(
      { success: false, message: "Acción no válida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error en PUT /api/deudas:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 