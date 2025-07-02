import { NextResponse } from 'next/server';
import { NotificacionClienteController } from '@/lib/controllers/notiClienteController';

export async function GET() {
  try {
    const estadisticas = await NotificacionClienteController.getEstadisticas();
    return NextResponse.json(estadisticas);
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}