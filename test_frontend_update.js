// Simular la actualización desde el frontend
const testUpdateData = {
  id: 1,
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
  telegram_chat_id: "123456789", // Este es el campo que queremos probar
  estado: "activo"
};

console.log('🧪 Simulando actualización desde el frontend...');
console.log('📋 Datos a enviar:', JSON.stringify(testUpdateData, null, 2));

// Simular la lógica del frontend
const simulateFrontendUpdate = async (data) => {
  const { id, ...updateData } = data;
  
  console.log('\n📤 Enviando datos a la API:');
  console.log('URL:', `/api/clientes/${id}`);
  console.log('Método:', 'PUT');
  console.log('Datos:', JSON.stringify(updateData, null, 2));
  
  // Verificar que telegram_chat_id esté incluido
  if (updateData.telegram_chat_id) {
    console.log('✅ telegram_chat_id incluido:', updateData.telegram_chat_id);
  } else {
    console.log('❌ telegram_chat_id NO incluido');
  }
  
  return {
    success: true,
    data: { ...data, fecha_actualizacion: new Date().toISOString() },
    message: "Cliente actualizado exitosamente"
  };
};

// Probar diferentes escenarios
const testScenarios = [
  {
    name: "Con telegram_chat_id",
    data: { ...testUpdateData, telegram_chat_id: "123456789" }
  },
  {
    name: "Sin telegram_chat_id",
    data: { ...testUpdateData, telegram_chat_id: "" }
  },
  {
    name: "Con telegram_chat_id null",
    data: { ...testUpdateData, telegram_chat_id: null }
  },
  {
    name: "Con telegram_chat_id largo",
    data: { ...testUpdateData, telegram_chat_id: "-1001234567890123456789" }
  }
];

console.log('\n🎯 Probando diferentes escenarios:');

testScenarios.forEach(async (scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}:`);
  const result = await simulateFrontendUpdate(scenario.data);
  console.log('Resultado:', result.message);
  console.log('telegram_chat_id en respuesta:', result.data.telegram_chat_id);
});

console.log('\n✅ Verificación completada');
console.log('\n📝 Resumen de lo que debe funcionar:');
console.log('  - El campo telegram_chat_id se envía en la actualización');
console.log('  - La API procesa correctamente el campo');
console.log('  - La base de datos se actualiza');
console.log('  - El frontend recarga los datos');
console.log('  - La tabla muestra el estado correcto (✓ Configurado / - No configurado)'); 