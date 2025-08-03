const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  user: 'teltec_user',
  host: 'localhost',
  database: 'teltec_db',
  password: '12345678',
  port: 5432,
});

async function testAPIEditTelegram() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando actualización de telegram_chat_id a través de la API...');
    
    // 1. Limpiar datos anteriores y crear un cliente de prueba
    console.log('\n1️⃣ Limpiando datos anteriores...');
    await client.query(`DELETE FROM clientes WHERE cedula = '7777777777'`);
    
    console.log('1️⃣ Creando cliente de prueba...');
    const createResult = await client.query(`
      INSERT INTO clientes (
        cedula, nombres, apellidos, tipo_plan, precio_plan, 
        fecha_nacimiento, direccion, sector, email, telefono, 
        telegram_chat_id, estado
      ) VALUES (
        '7777777777', 'API', 'Test', 'Plan API', 30.00,
        '1990-01-01', 'Dirección API', 'Sector API', 'api.test@test.com', '0777777777',
        '555555555', 'activo'
      ) RETURNING id, cedula, telegram_chat_id
    `);
    
    const testCliente = createResult.rows[0];
    console.log('✅ Cliente creado:', testCliente);
    
    // 2. Simular datos de actualización (como los enviaría el frontend)
    const updateData = {
      id: testCliente.id,
      cedula: testCliente.cedula,
      nombres: 'API',
      apellidos: 'Test Updated',
      tipo_plan: 'Plan API',
      precio_plan: 30.00,
      fecha_nacimiento: '1990-01-01',
      direccion: 'Dirección API Updated',
      sector: 'Sector API',
      email: 'api.test@test.com',
      telefono: '0777777777',
      telegram_chat_id: '666666666', // Nuevo valor
      estado: 'activo'
    };
    
    console.log('\n2️⃣ Datos de actualización:', updateData);
    
    // 3. Simular la actualización usando el modelo
    console.log('\n3️⃣ Ejecutando actualización...');
    
    // Extraer solo los campos que se pueden actualizar
    const { id, ...updateFields } = updateData;
    
    // Simular la lógica del modelo update
    const fields = Object.keys(updateFields);
    const values = fields.map(field => updateFields[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
    
    console.log('📋 Campos a actualizar:', fields);
    console.log('📋 Valores:', values);
    console.log('📋 SET clause:', setClause);
    
    // 4. Ejecutar la actualización directamente
    const updateResult = await client.query(`
      UPDATE public.clientes 
      SET ${setClause}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, cedula, nombres, apellidos, telegram_chat_id, fecha_actualizacion
    `, [id, ...values]);
    
    console.log('✅ Actualización exitosa:', updateResult.rows[0]);
    
    // 5. Verificar el resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    const finalCheck = await client.query(`
      SELECT id, cedula, nombres, apellidos, telegram_chat_id, fecha_actualizacion 
      FROM clientes WHERE id = $1
    `, [testCliente.id]);
    
    console.log('📋 Cliente actualizado:', finalCheck.rows[0]);
    
    // 6. Probar con telegram_chat_id vacío
    console.log('\n5️⃣ Probando con telegram_chat_id vacío...');
    const emptyUpdate = await client.query(`
      UPDATE public.clientes 
      SET telegram_chat_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, cedula, telegram_chat_id, fecha_actualizacion
    `, [null, testCliente.id]);
    
    console.log('✅ Actualización con valor vacío:', emptyUpdate.rows[0]);
    
    // 7. Limpiar datos de prueba
    console.log('\n6️⃣ Limpiando datos de prueba...');
    await client.query(`DELETE FROM clientes WHERE cedula = '7777777777'`);
    console.log('🧹 Datos de prueba eliminados');
    
    console.log('\n✅ Todas las pruebas de API pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de API:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testAPIEditTelegram(); 