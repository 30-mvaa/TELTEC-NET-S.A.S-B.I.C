import { NotificacionCliente, EstadisticasNotificacion, Cliente, ClienteConPago } from '../models/notiCliente';
import { query } from '../database/connection';

export class NotificacionClienteController {
  // Obtener todas las notificaciones con información del cliente
  static async getAll(): Promise<NotificacionCliente[]> {
    try {
      const queryText = `
        SELECT 
          n.id,
          n.cliente_id,
          n.tipo,
          n.mensaje,
          n.estado,
          n.canal,
          n.fecha_creacion,
          c.nombres || ' ' || c.apellidos as cliente_nombre,
          c.telefono as cliente_telefono,
          c.email as cliente_email,
          c.telegram_chat_id as cliente_telegram_chat_id
        FROM notificaciones n
        LEFT JOIN clientes c ON n.cliente_id = c.id
        ORDER BY n.fecha_creacion DESC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw new Error('Error al obtener notificaciones');
    }
  }

  // Obtener todos los clientes con información de pagos
  static async getClientesConEstadoPago(): Promise<ClienteConPago[]> {
    try {
      const queryText = `
        SELECT 
          c.*,
          CURRENT_DATE - c.fecha_registro::date as dias_desde_registro,  -- Usar la diferencia de fechas sin EXTRACT
          MAX(p.fecha_pago) as ultimo_pago,
          COALESCE(CURRENT_DATE - MAX(p.fecha_pago)::date, CURRENT_DATE - c.fecha_registro::date) as dias_sin_pago,
          CASE 
            WHEN (CURRENT_DATE - c.fecha_registro::date) >= 30 
            AND (MAX(p.fecha_pago) IS NULL OR CURRENT_DATE - MAX(p.fecha_pago)::date >= 30)
            THEN true
            ELSE false
          END as debe_pagar,
          CASE 
            WHEN MAX(p.fecha_pago) IS NOT NULL AND CURRENT_DATE - MAX(p.fecha_pago)::date <= 25 THEN 'al_dia'
            WHEN MAX(p.fecha_pago) IS NOT NULL AND CURRENT_DATE - MAX(p.fecha_pago)::date BETWEEN 26 AND 29 THEN 'proximo_vencimiento'
            WHEN (MAX(p.fecha_pago) IS NULL AND CURRENT_DATE - c.fecha_registro::date BETWEEN 26 AND 29) THEN 'proximo_vencimiento'
            WHEN CURRENT_DATE - COALESCE(MAX(p.fecha_pago), c.fecha_registro)::date BETWEEN 30 AND 34 THEN 'vencido'
            WHEN CURRENT_DATE - COALESCE(MAX(p.fecha_pago), c.fecha_registro)::date >= 35 THEN 'corte_pendiente'
            ELSE 'al_dia'
          END as estado_pago
        FROM clientes c
        LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
        WHERE c.estado = 'activo'
        GROUP BY c.id
        ORDER BY dias_sin_pago DESC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener clientes con estado de pago:', error);
      throw new Error('Error al obtener clientes con estado de pago');
    }
  }

  // Crear nueva notificación
  static async create(data: Partial<NotificacionCliente>): Promise<NotificacionCliente> {
    try {
      const queryText = `
        INSERT INTO notificaciones (
          cliente_id, tipo, mensaje, canal, estado, fecha_creacion, 
          fecha_programada, intentos
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        data.cliente_id,
        data.tipo,
        data.mensaje,
        data.canal || 'telegram',
        'pendiente',
        new Date().toISOString(),
        data.fecha_programada || null,
        0
      ];

      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw new Error('Error al crear notificación');
    }
  }

  // Actualizar estado de notificación
  static async updateEstado(id: number, estado: NotificacionCliente['estado'], errorMensaje?: string): Promise<void> {
    try {
      const queryText = `
        UPDATE notificaciones 
        SET estado = $1, fecha_envio = $2, error_mensaje = $3, intentos = intentos + 1
        WHERE id = $4
      `;
      
      const values = [
        estado,
        estado === 'enviado' ? new Date().toISOString() : null,
        errorMensaje || null,
        id
      ];

      await query(queryText, values);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw new Error('Error al actualizar estado');
    }
  }

  // Obtener notificaciones pendientes
  static async getPendientes(): Promise<NotificacionCliente[]> {
    try {
      const queryText = `
        SELECT 
          n.*,
          CONCAT(c.nombres, ' ', c.apellidos) as cliente_nombre,
          c.telefono as cliente_telefono,
          c.email as cliente_email,
          c.telegram_chat_id as cliente_telegram_chat_id
        FROM notificaciones n
        LEFT JOIN clientes c ON n.cliente_id = c.id
        WHERE n.estado = 'pendiente' 
        AND (n.fecha_programada IS NULL OR n.fecha_programada <= NOW())
        AND n.intentos < 3
        ORDER BY n.fecha_creacion ASC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener pendientes:', error);
      throw new Error('Error al obtener pendientes');
    }
  }

  // Crear notificaciones automáticas para clientes próximos a vencer (5 días antes)
  static async crearNotificacionesPagosProximos(): Promise<number> {
    try {
      const queryText = `
        INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
        SELECT 
          c.id,
          'pago_proximo',
          CONCAT('🔔 Estimado/a ', c.nombres, ' ', c.apellidos, 
                 ', le recordamos que se aproxima la fecha de pago de su servicio de internet. ',
                 'Por favor acérquese a cancelar. Precio: $', c.precio_plan, 
                 '. ¡Gracias por su preferencia! - TelTec'),
          'telegram',
          'pendiente',
          NOW()
        FROM (
          SELECT 
            c.*,
            COALESCE(CURRENT_DATE - MAX(p.fecha_pago)::date, CURRENT_DATE - c.fecha_registro::date) as dias_sin_pago
          FROM clientes c
          LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
          WHERE c.estado = 'activo'
          GROUP BY c.id
        ) c
        WHERE c.dias_sin_pago BETWEEN 25 AND 29
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.cliente_id = c.id 
          AND n.tipo = 'pago_proximo' 
          AND DATE(n.fecha_creacion) = CURRENT_DATE
        )
      `;
      
      const result = await query(queryText);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error al crear notificaciones de pagos próximos:', error);
      throw new Error('Error al crear notificaciones de pagos próximos');
    }
  }

  // Crear notificaciones para clientes con pagos vencidos (después de 30 días)
  static async crearNotificacionesPagosVencidos(): Promise<number> {
    try {
      const queryText = `
        INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
        SELECT 
          c.id,
          'pago_vencido',
          CONCAT('⚠️ Estimado/a ', c.nombres, ' ', c.apellidos, 
                 ', su pago está vencido. Su servicio de internet será posteriormente cortado. ',
                 'Acérquese a cancelar el servicio para restablecer la conexión. ',
                 'Monto: $', c.precio_plan, ' - TelTec'),
          'telegram',
          'pendiente',
          NOW()
        FROM (
          SELECT 
            c.*,
            COALESCE(CURRENT_DATE - MAX(p.fecha_pago)::date, CURRENT_DATE - c.fecha_registro::date) as dias_sin_pago
          FROM clientes c
          LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
          WHERE c.estado = 'activo'
          GROUP BY c.id
        ) c
        WHERE c.dias_sin_pago >= 30
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.cliente_id = c.id 
          AND n.tipo = 'pago_vencido' 
          AND DATE(n.fecha_creacion) = CURRENT_DATE
        )
      `;
      
      const result = await query(queryText);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error al crear notificaciones de pagos vencidos:', error);
      throw new Error('Error al crear notificaciones de pagos vencidos');
    }
  }

  // Crear notificaciones de corte de servicio (después de 35 días)
  static async crearNotificacionesCorteServicio(): Promise<number> {
    try {
      const queryText = `
        INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
        SELECT 
          c.id,
          'corte_servicio',
          CONCAT('🚨 AVISO IMPORTANTE - ', c.nombres, ' ', c.apellidos, 
                 ': Su servicio de internet será suspendido por falta de pago. ',
                 'Comuníquese inmediatamente con nosotros para evitar la suspensión. ',
                 'TelTec - Teléfono: 0999999999'),
          'telegram',
          'pendiente',
          NOW()
        FROM (
          SELECT 
            c.*,
            COALESCE(CURRENT_DATE - MAX(p.fecha_pago)::date, CURRENT_DATE - c.fecha_registro::date) as dias_sin_pago
          FROM clientes c
          LEFT JOIN pagos p ON c.id = p.cliente_id AND p.estado = 'completado'
          WHERE c.estado = 'activo'
          GROUP BY c.id
        ) c
        WHERE c.dias_sin_pago >= 35
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.cliente_id = c.id 
          AND n.tipo = 'corte_servicio' 
          AND DATE(n.fecha_creacion) = CURRENT_DATE
        )
      `;
      
      const result = await query(queryText);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error al crear notificaciones de corte de servicio:', error);
      throw new Error('Error al crear notificaciones de corte de servicio');
    }
  }

  // Procesar todas las notificaciones automáticas
  static async procesarNotificacionesAutomaticas(): Promise<{
    pagos_proximos: number;
    pagos_vencidos: number;
    cortes_servicio: number;
  }> {
    try {
      const pagos_proximos = await this.crearNotificacionesPagosProximos();
      const pagos_vencidos = await this.crearNotificacionesPagosVencidos();
      const cortes_servicio = await this.crearNotificacionesCorteServicio();

      return {
        pagos_proximos,
        pagos_vencidos,
        cortes_servicio
      };
    } catch (error) {
      console.error('Error al procesar notificaciones automáticas:', error);
      throw new Error('Error al procesar notificaciones automáticas');
    }
  }

  // Obtener estadísticas
  static async getEstadisticas(): Promise<EstadisticasNotificacion> {
    try {
      const queryText = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviadas,
          COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as fallidas,
          COUNT(CASE WHEN canal = 'telegram' THEN 1 END) as telegram,
          COUNT(CASE WHEN canal = 'email' THEN 1 END) as email,
          COUNT(CASE WHEN canal = 'sms' THEN 1 END) as sms
        FROM notificaciones
        WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'
      `;
      
      const result = await query(queryText);
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al obtener estadísticas');
    }
  }

  // Enviar notificación a todos los clientes
  static async enviarNotificacionMasiva(tipo: NotificacionCliente['tipo'], mensaje: string): Promise<number> {
    try {
      const queryText = `
        INSERT INTO notificaciones (cliente_id, tipo, mensaje, canal, estado, fecha_creacion)
        SELECT 
          c.id,
          $1,
          $2,
          'telegram',
          'pendiente',
          NOW()
        FROM clientes c
        WHERE c.estado = 'activo'
        AND c.telefono IS NOT NULL
        AND c.telefono != ''
      `;
      
      const result = await query(queryText, [tipo, mensaje]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error al crear notificación masiva:', error);
      throw new Error('Error al crear notificación masiva');
    }
  }
}
