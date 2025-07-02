import { NextRequest, NextResponse } from 'next/server';
import { NotificacionClienteController } from '@/lib/controllers/notiClienteController';
import { WhatsAppService } from '@/lib/utils/whatsapp';

export async function POST() {
  try {
    console.log('🚀 Iniciando procesamiento de notificaciones...');

    // Crear notificaciones automáticas
    const notificacionesCreadas = await NotificacionClienteController.procesarNotificacionesAutomaticas();
    
    console.log('📊 Notificaciones automáticas creadas:', notificacionesCreadas);

    // Obtener notificaciones pendientes
    const pendientes = await NotificacionClienteController.getPendientes();
    
    console.log(`📋 Notificaciones pendientes a procesar: ${pendientes.length}`);

    const whatsappService = new WhatsAppService();
    
    let procesadas = 0;
    let errores = 0;

    for (const notif of pendientes) {
      try {
        let resultado;

        switch (notif.canal) {
          case 'whatsapp':
            resultado = await whatsappService.enviarMensaje(
              notif.cliente_telefono || '', 
              notif.mensaje
            );
            break;
          
          default:
            throw new Error(`Canal no soportado: ${notif.canal}`);
        }

        if (resultado.success) {
          await NotificacionClienteController.updateEstado(notif.id, 'enviado');
          procesadas++;
          console.log(`✅ Notificación ${notif.id} enviada a ${notif.cliente_nombre}`);
        } else {
          await NotificacionClienteController.updateEstado(notif.id, 'fallido', resultado.error);
          errores++;
          console.log(`❌ Error en notificación ${notif.id}: ${resultado.error}`);
        }

        // Pausa entre envíos para evitar límites de rate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`Error procesando notificación ${notif.id}:`, error);
        await NotificacionClienteController.updateEstado(notif.id, 'fallido', error.message);
        errores++;
      }
    }

    const resultado = {
      success: true,
      procesadas,
      errores,
      total: pendientes.length,
      notificaciones_creadas: notificacionesCreadas,
      message: `Procesadas ${procesadas} notificaciones, ${errores} errores`
    };

    console.log('🎉 Procesamiento completado:', resultado);

    return NextResponse.json(resultado);

  } catch (error: any) {
    console.error('Error al procesar notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al procesar notificaciones' },
      { status: 500 }
    );
  }
}