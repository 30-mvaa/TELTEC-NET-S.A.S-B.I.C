import { NextResponse } from 'next/server';
import { PagoModel } from '@/lib/models/Pago';
import { GastoModel } from 'lib/models/Gasto';
import { ClienteModel } from 'lib/models/Cliente';

// Endpoints para reportes
export async function GET() {
  try {
    // Obtener las estadísticas de pagos, gastos y clientes
    const pagos = await PagoModel.getEstadisticas();
    const gastos = await GastoModel.getEstadisticas();
    const clienteEstadisticas = await ClienteModel.getEstadisticas(); // Estadísticas de clientes
    
    const responseData = {
      reporteFinanciero: {
        ingresos: pagos.total_recaudado,
        gastos: gastos.total_gastado,
        utilidad: pagos.total_recaudado - gastos.total_gastado,
        crecimiento: (pagos.total_recaudado / pagos.total_recaudado) * 100, // Ajusta según tu cálculo
      },
      reporteClientes: {
        total: clienteEstadisticas.total, // Total de clientes
        activos: clienteEstadisticas.activos, // Clientes activos
        nuevos: clienteEstadisticas.nuevos_mes, // Nuevos clientes este mes
        bajas: clienteEstadisticas.inactivos, // Bajas (inactivos)
      },
     
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
