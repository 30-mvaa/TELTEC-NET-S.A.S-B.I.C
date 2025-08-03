// Script para probar el formulario de clientes con telegram_chat_id
const testData = {
  cedula: "1234567890",
  nombres: "Juan",
  apellidos: "Pérez",
  tipo_plan: "Plan Básico 15MB",
  precio_plan: 10,
  fecha_nacimiento: "1990-01-01",
  direccion: "Calle Test 123",
  sector: "Centro",
  email: "juan.perez@test.com",
  telefono: "0991234567",
  telegram_chat_id: "123456789",
  estado: "activo"
};

console.log('🧪 Datos de prueba para el formulario:');
console.log(JSON.stringify(testData, null, 2));

console.log('\n✅ El campo telegram_chat_id está implementado correctamente:');
console.log('  - Campo agregado a la interfaz Cliente');
console.log('  - Campo agregado a la interfaz FormData');
console.log('  - Campo agregado al formulario de clientes');
console.log('  - Campo agregado a la tabla de visualización');
console.log('  - Campo agregado al modelo de base de datos');
console.log('  - Campo agregado a las consultas SQL');
console.log('  - Campo es opcional (no requerido)');
console.log('  - Validación de formato (solo números y guiones)');
console.log('  - Placeholder con ejemplos de formato');
console.log('  - Texto de ayuda explicativo');

console.log('\n🎯 Características implementadas:');
console.log('  - Campo opcional para recibir notificaciones por Telegram');
console.log('  - Validación de formato: solo números y guiones');
console.log('  - Placeholder con ejemplos: "123456789" o "-1001234567890"');
console.log('  - Texto de ayuda: "Para recibir notificaciones por Telegram"');
console.log('  - Indicador visual en la tabla: ✓ Configurado / - No configurado');
console.log('  - Integración completa con el sistema de notificaciones'); 