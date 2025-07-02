import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/utils/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { to, body, templateSid, variables } = await request.json();

    if (!to || (!body && !templateSid)) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const whatsappService = new WhatsAppService();
    let result;

    if (templateSid) {
      result = await whatsappService.enviarMensajeTemplate(to, templateSid, variables);
    } else {
      result = await whatsappService.enviarMensaje(to, body);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Mensaje enviado correctamente'
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error al enviar WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}