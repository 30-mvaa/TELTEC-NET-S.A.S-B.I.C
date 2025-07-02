import { NextRequest, NextResponse } from 'next/server';
import { NotificacionClienteController } from '@/lib/controllers/notiClienteController';

export async function POST(request: NextRequest) {
  try {
    const { tipo, mensaje } = await request.json();

    if (!tipo || !mensaje) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const notificacionesCreadas = await NotificacionClienteController.enviarNotificacionMasiva(tipo, mensaje);
    
    return NextResponse.json({
      success: true,
      notificaciones_creadas: notificacionesCreadas,
      message: `Se crearon ${notificacionesCreadas} notificaciones para envío masivo`
    });
  } catch (error: any) {
    console.error('Error al crear notificación masiva:', error);
    return NextResponse.json(
      { error: 'Error al crear notificación masiva' },
      { status: 500 }
    );
  }
}