import { NextRequest, NextResponse } from 'next/server';
import { NotificacionClienteController } from '@/lib/controllers/notiClienteController';

export async function GET() {
  try {
    const notificaciones = await NotificacionClienteController.getAll();
    return NextResponse.json(notificaciones);
  } catch (error: any) {
    console.error('Error en GET /api/notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validaciones básicas
    if (!data.cliente_id || !data.tipo || !data.mensaje) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const notificacion = await NotificacionClienteController.create(data);
    return NextResponse.json(notificacion, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    );
  }
}