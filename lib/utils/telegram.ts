// lib/utils/telegram.ts
import axios from 'axios';

export class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;

    if (!this.botToken) {
      throw new Error('Token de Telegram Bot no configurado');
    }
  }

  async enviarMensaje(chatId: string, mensaje: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📱 Enviando Telegram a ${chatId}: ${mensaje.substring(0, 50)}...`);
      
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'HTML' // Permite formato HTML básico
      });

      console.log(`✅ Telegram enviado exitosamente. Message ID: ${response.data.result.message_id}`);

      return {
        success: true,
        messageId: response.data.result.message_id.toString()
      };
    } catch (error: any) {
      console.error('❌ Error al enviar Telegram:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message || 'Error desconocido'
      };
    }
  }

  async enviarMensajeTemplate(chatId: string, template: string, variables: Record<string, string> = {}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let mensaje = template;
      
      // Reemplazar variables en el template
      Object.entries(variables).forEach(([key, value]) => {
        mensaje = mensaje.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return await this.enviarMensaje(chatId, mensaje);
    } catch (error: any) {
      console.error('Error al enviar template Telegram:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async verificarEstado(messageId: string, chatId: string): Promise<{ status: string; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/getUpdates`, {
        params: {
          chat_id: chatId,
          message_id: messageId
        }
      });

      // Telegram no tiene un endpoint directo para verificar estado de mensajes
      // Retornamos 'sent' si no hay error
      return {
        status: 'sent'
      };
    } catch (error: any) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  async obtenerInfoBot(): Promise<{ success: boolean; info?: any; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return {
        success: true,
        info: response.data.result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message
      };
    }
  }

  async verificarConfiguracion(): Promise<boolean> {
    try {
      const result = await this.obtenerInfoBot();
      return result.success;
    } catch {
      return false;
    }
  }

  // Método para formatear mensajes con HTML básico
  formatearMensaje(mensaje: string, variables: Record<string, string> = {}): string {
    let mensajeFormateado = mensaje;
    
    // Reemplazar variables
    Object.entries(variables).forEach(([key, value]) => {
      mensajeFormateado = mensajeFormateado.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Aplicar formato HTML básico
    mensajeFormateado = mensajeFormateado
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Negrita
      .replace(/\*(.*?)\*/g, '<i>$1</i>') // Cursiva
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Código

    return mensajeFormateado;
  }
}

// Función helper para validar chat_id de Telegram
export function validarChatId(chatId: string): boolean {
  // Los chat_id de Telegram son números enteros (pueden ser negativos para grupos)
  return /^-?\d+$/.test(chatId);
}

// Función helper para formatear chat_id
export function formatearChatId(chatId: string): string {
  // Remover espacios y caracteres no numéricos excepto el signo negativo
  return chatId.replace(/[^\d-]/g, '');
} 