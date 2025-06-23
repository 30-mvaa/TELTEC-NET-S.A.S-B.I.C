import { PagoModel } from "@/lib/models/Pago";
import { GastoModel } from "@/lib/models/Gasto";

export async function getReportData() {
  try {
    // Obtener los datos necesarios para los reportes
    const pagos = await PagoModel.getEstadisticas();
    const gastos = await GastoModel.getEstadisticas();
    
    // Preparar los datos de los reportes
    const report = {
      ingresos: pagos.total_recaudado,
      gastos: gastos.total_gastado,
      utilidad: pagos.total_recaudado - gastos.total_gastado,
      crecimiento: 8.5,  // Porcentaje de crecimiento de ingresos, por ejemplo
    };

    return report;
  } catch (error) {
    throw new Error("Error al generar el reporte");
  }
}
