import { NextResponse } from 'next/server';
import { NotificacionClienteController } from '@/lib/controllers/notiClienteController';

export async function GET() {
  try {
    const clientes = await NotificacionClienteController.getClientesConEstadoPago();
    return NextResponse.json(clientes);
  } catch (error: any) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}