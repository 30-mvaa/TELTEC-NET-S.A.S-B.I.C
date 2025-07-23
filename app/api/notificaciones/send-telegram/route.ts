import { NextRequest, NextResponse } from 'next/server';
import { TelegramService } from '@/lib/utils/telegram';

export async function POST(request: NextRequest) {
  try {
    const { to, body, template, variables } = await request.json();

    if (!to || (!body && !template)) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const telegramService = new TelegramService();
    let result;

    if (template) {
      result = await telegramService.enviarMensajeTemplate(to, template, variables);
    } else {
      result = await telegramService.enviarMensaje(to, body);
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
    console.error('Error al enviar Telegram:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 