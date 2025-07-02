import { NextRequest, NextResponse } from 'next/server';
import { NotificacionClienteController } from '@/lib/controllers/notiClienteController';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Asegúrate de que `params.id` esté resuelto correctamente antes de acceder a él
    const id = parseInt(await params.id); // Usa await para obtener el valor de params.id
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    await NotificacionClienteController.updateEstado(id, 'enviado');
    
    return NextResponse.json({
      success: true,
      message: 'Estado actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    );
  }
}

