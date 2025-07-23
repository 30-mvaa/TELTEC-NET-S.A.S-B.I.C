// lib/models/notiCliente.ts

// Interfaz para Notificación Cliente
export interface NotificacionCliente {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_telegram_chat_id?: string;
  tipo: "pago_proximo" | "pago_vencido" | "corte_servicio" | "promocion" | "mantenimiento"; // Se agrega 'tipo'
  mensaje: string;
  estado: "pendiente" | "enviado" | "fallido";
  canal: "telegram" | "email" | "sms";
  fecha_envio?: string;
  fecha_programada?: string;
  fecha_creacion: string;
}

// Interfaz para estadísticas de notificaciones
export interface EstadisticasNotificacion {
  total: number;
  enviados: number;
  pendientes: number;
  fallidos: number;
  estad: string; // Cambié 'any' por un tipo adecuado
}

// Interfaz para Cliente
export interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  estado: "activo" | "inactivo"; // Estado del cliente
}

// Interfaz para ClienteConPago
export interface ClienteConPago {
  id: number;
  cliente_id: number;
  nombre: string;
  telefono: string;
  email: string;
  plan: string;
  estado_pago: "al_dia" | "proximo_vencimiento" | "vencido" | "corte_pendiente"; // Estado de pago del cliente
}
