import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 API estadísticas de clientes llamada")

    // Datos de ejemplo para estadísticas
    const estadisticas = {
      total_clientes: 8,
      clientes_activos: 6,
      clientes_suspendidos: 1,
      clientes_inactivos: 1,
      nuevos_este_mes: 3,
      sectores_activos: 5,
      planes: {
        "Básico 10MB": 2,
        "Estándar 25MB": 2,
        "Premium 50MB": 2,
        "Ultra 100MB": 2,
      },
      sectores: {
        Centro: 2,
        Norte: 2,
        Sur: 2,
        Este: 1,
        Oeste: 1,
      },
      ingresos_mensuales: {
        enero: 1250.0,
        febrero: 1380.0,
        marzo: 1420.0,
        abril: 1500.0,
        mayo: 1650.0,
        junio: 1720.0,
      },
      crecimiento_mensual: 8.5,
      tasa_retencion: 94.2,
      ultimo_cliente: "Carmen Delgado",
      fecha_ultimo_registro: "2024-06-13",
    }

    return NextResponse.json({
      success: true,
      data: estadisticas,
      message: "Estadísticas obtenidas exitosamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en API estadísticas:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al obtener estadísticas: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}
