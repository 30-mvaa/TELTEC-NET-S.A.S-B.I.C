import twilio from 'twilio';

export class WhatsAppService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      throw new Error('Credenciales de Twilio no configuradas');
    }

    this.client = twilio(accountSid, authToken);
  }

  async enviarMensaje(to: string, mensaje: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Formatear número de teléfono
      const toNumber = this.formatearNumero(to);
      
      console.log(`📱 Enviando WhatsApp a ${toNumber}: ${mensaje.substring(0, 50)}...`);
      
      const message = await this.client.messages.create({
        body: mensaje,
        from: this.fromNumber,
        to: toNumber
      });

      console.log(`✅ WhatsApp enviado exitosamente. SID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid
      };
    } catch (error: any) {
      console.error('❌ Error al enviar WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async enviarMensajeTemplate(to: string, templateSid: string, variables: Record<string, string> = {}): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const toNumber = this.formatearNumero(to);
      
      const message = await this.client.messages.create({
        contentSid: templateSid,
        contentVariables: JSON.stringify(variables),
        from: this.fromNumber,
        to: toNumber
      });

      return {
        success: true,
        messageId: message.sid
      };
    } catch (error: any) {
      console.error('Error al enviar template WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async verificarEstado(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: message.status
      };
    } catch (error: any) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  private formatearNumero(numero: string): string {
    // Remover espacios y caracteres especiales
    let numeroLimpio = numero.replace(/\D/g, '');
    
    // Si no tiene código de país, agregar +593 (Ecuador)
    if (!numeroLimpio.startsWith('593') && numeroLimpio.length === 10) {
      numeroLimpio = '593' + numeroLimpio.substring(1);
    }
    
    // Asegurar que tenga el prefijo whatsapp:
    return `whatsapp:+${numeroLimpio}`;
  }

  async obtenerTemplates(): Promise<any[]> {
    try {
      const templates = await this.client.content.v1.contents.list({
        limit: 50
      });
      return templates;
    } catch (error) {
      console.error('Error al obtener templates:', error);
      return [];
    }
  }

  // Verificar configuración de Twilio
  static async verificarConfiguracion(): Promise<boolean> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !phoneNumber) {
        console.error('❌ Faltan credenciales de Twilio en .env');
        return false;
      }

      const client = twilio(accountSid, authToken);
      await client.api.accounts(accountSid).fetch();
      
      console.log('✅ Configuración de Twilio verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de Twilio:', error);
      return false;
    }
  }
}

// Utilidades adicionales para formateo
export function formatearTelefono(numero: string): string {
  let numeroLimpio = numero.replace(/\D/g, '');
  
  if (!numeroLimpio.startsWith('593') && numeroLimpio.length === 10) {
    numeroLimpio = '593' + numeroLimpio.substring(1);
  }
  
  return numeroLimpio;
}

export function reemplazarVariables(mensaje: string, variables: Record<string, string>): string {
  let mensajeFinal = mensaje;
  
  Object.entries(variables).forEach(([clave, valor]) => {
    const regex = new RegExp(`{{${clave}}}`, 'g');
    mensajeFinal = mensajeFinal.replace(regex, valor);
  });
  
  return mensajeFinal;
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}