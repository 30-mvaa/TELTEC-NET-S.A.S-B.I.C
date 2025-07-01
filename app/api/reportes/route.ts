// app/api/reportes/route.ts
import { PagoModel } from '@/lib/models/pagoreporte';
import { GastoModel } from '@/lib/models/gastoreporte';
import { ClienteModel } from '@/lib/models/Cliente';
import { query } from '@/lib/database/connection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url       = req.nextUrl;
    const monthParam= url.searchParams.get('month');
    const yearParam = url.searchParams.get('year');
    const reportType= url.searchParams.get('type') || 'general';

    // Parsear o tomar valores por defecto
    const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
    const year  = yearParam  ? parseInt(yearParam, 10)  : new Date().getFullYear();

    // Validaciones básicas
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Mes inválido' }, { status: 400 });
    }
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
    }

    // 1. Consultar fechas de registro de pagos y gastos en ese mes/año
    const pagoFechas = await query(
      `
      SELECT
        MIN(fecha_creacion)::date AS primer,
        MAX(fecha_creacion)::date AS ultimo
      FROM pagos
      WHERE DATE_PART('month', fecha_creacion) = $1
        AND DATE_PART('year',  fecha_creacion) = $2
      `,
      [month, year]
    );
    const gastoFechas = await query(
      `
      SELECT
        MIN(fecha_creacion)::date AS primer,
        MAX(fecha_creacion)::date AS ultimo
      FROM gastos
      WHERE DATE_PART('month', fecha_creacion) = $1
        AND DATE_PART('year',  fecha_creacion) = $2
      `,
      [month, year]
    );

    const fechasRegistro = {
      pagos:  pagoFechas.rows[0],
      gastos: gastoFechas.rows[0],
    };

    // Si no hay **ningún** pago y **ningún** gasto, no hay datos
    const noHayPagos  = fechasRegistro.pagos.primer  === null;
    const noHayGastos = fechasRegistro.gastos.primer === null;
    if (noHayPagos && noHayGastos) {
      return NextResponse.json(
        { message: 'No hay datos disponibles para este período' },
        { status: 200 }
      );
    }

    // 2. Generar reporte según el tipo solicitado
    let reportData: any;
    switch (reportType) {
      case 'clientes':
        reportData = await generateClientesReport(month, year);
        break;
      case 'pagos':
        reportData = await generatePagosReport(month, year);
        break;
      case 'gastos':
        reportData = await generateGastosReport(month, year);
        break;
      case 'general':
      default:
        reportData = await generateGeneralReport(month, year);
        break;
    }

    // 3. Devolver datos + fechas de registro
    return NextResponse.json({
      ...reportData,
      fechasRegistro,
    });
  } catch (err) {
    console.error('Error en API reportes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { month, year, reportType } = await req.json();
    if (!month || !year) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 });
    }
    // Reusar la lógica de GET
    const url = new URL(req.url);
    url.searchParams.set('month', month.toString());
    url.searchParams.set('year',  year.toString());
    url.searchParams.set('type',  reportType || 'general');
    return GET(new NextRequest(url.toString(), { method: 'GET' }));
  } catch (err) {
    console.error('Error en POST reportes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ——— Generadores de reporte ———

async function generateGeneralReport(month: number, year: number) {
  const pagos   = await PagoModel.getEstadisticas({ month: month.toString(), year: year.toString() });
  const gastos  = await GastoModel.getEstadisticas({ month: month.toString(), year: year.toString() });
  const clientes= await ClienteModel.getEstadisticas({ month: month.toString(), year: year.toString() });

  // Crecimiento mes a mes
  let crecimiento = 0;
  try {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const prevPagos = await PagoModel.getEstadisticas({
      month: prevMonth.toString(),
      year: prevYear.toString(),
    });
    if (prevPagos.total_recaudado > 0) {
      crecimiento = ((pagos.total_recaudado - prevPagos.total_recaudado) / prevPagos.total_recaudado) * 100;
    }
  } catch {
    /* ignorar */
  }

  return {
    reporteFinanciero: {
      ingresos: pagos.total_recaudado,
      gastos:   gastos.total_gastado,
      utilidad: pagos.total_recaudado - gastos.total_gastado,
      crecimiento,
    },
    reporteClientes: {
      total:   clientes.total,
      activos: clientes.activos,
      nuevos:  clientes.nuevos_mes,
      bajas:   clientes.inactivos,
    },
    period: { month, year, type: 'general' },
  };
}

async function generateClientesReport(month: number, year: number) {
  const c = await ClienteModel.getEstadisticas({ month: month.toString(), year: year.toString() });
  return {
    reporteFinanciero: { ingresos: 0, gastos: 0, utilidad: 0, crecimiento: 0 },
    reporteClientes: {
      total:   c.total,
      activos: c.activos,
      nuevos:  c.nuevos_mes,
      bajas:   c.inactivos,
    },
    period: { month, year, type: 'clientes' },
  };
}

async function generatePagosReport(month: number, year: number) {
  const p = await PagoModel.getEstadisticas({ month: month.toString(), year: year.toString() });
  return {
    reporteFinanciero: {
      ingresos: p.total_recaudado,
      gastos:   0,
      utilidad: p.total_recaudado,
      crecimiento: 0,
    },
    reporteClientes: { total: 0, activos: 0, nuevos: 0, bajas: 0 },
    period: { month, year, type: 'pagos' },
  };
}

async function generateGastosReport(month: number, year: number) {
  const g = await GastoModel.getEstadisticas({ month: month.toString(), year: year.toString() });
  return {
    reporteFinanciero: {
      ingresos: 0,
      gastos:   g.total_gastado,
      utilidad: -g.total_gastado,
      crecimiento: 0,
    },
    reporteClientes: { total: 0, activos: 0, nuevos: 0, bajas: 0 },
    period: { month, year, type: 'gastos' },
  };
}
