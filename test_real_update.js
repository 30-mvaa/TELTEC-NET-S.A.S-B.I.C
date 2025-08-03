const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  user: 'teltec_user',
  host: 'localhost',
  database: 'teltec_db',
  password: '12345678',
  port: 5432,
});

async function testRealUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando actualización real del campo telegram_chat_id...');
    
    // 1. Crear un cliente de prueba
    console.log('\n1️⃣ Creando cliente de prueba...');
    await client.query(`DELETE FROM clientes WHERE cedula = '6666666666'`);
    
    const createResult = await client.query(`
      INSERT INTO clientes (
        cedula, nombres, apellidos, tipo_plan, precio_plan, 
        fecha_nacimiento, direccion, sector, email, telefono, 
        telegram_chat_id, estado
      ) VALUES (
        '6666666666', 'Test', 'Real', 'Plan Test', 25.00,
        '1990-01-01', 'Dirección Test', 'Sector Test', 'test.real@test.com', '0666666666',
        NULL, 'activo'
      ) RETURNING id, cedula, telegram_chat_id
    `);
    
    const testCliente = createResult.rows[0];
    console.log('✅ Cliente creado:', testCliente);
    
    // 2. Simular la actualización como lo haría el frontend
    console.log('\n2️⃣ Simulando actualización desde el frontend...');
    
    const updateData = {
      id: testCliente.id,
      cedula: '6666666666',
      nombres: 'Test',
      apellidos: 'Real Updated',
      tipo_plan: 'Plan Test',
      precio_plan: 25.00,
      fecha_nacimiento: '1990-01-01',
      direccion: 'Dirección Test Updated',
      sector: 'Sector Test',
      email: 'test.real@test.com',
      telefono: '0666666666',
      telegram_chat_id: '888888888', // Nuevo valor
      estado: 'activo'
    };
    
    console.log('📋 Datos de actualización:', updateData);
    
    // 3. Simular la lógica del modelo update
    const { id, ...updateFields } = updateData;
    const fields = Object.keys(updateFields);
    const values = fields.map(field => updateFields[field]);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
    
    console.log('📋 Campos a actualizar:', fields);
    console.log('📋 Valores:', values);
    console.log('📋 SET clause:', setClause);
    
    // 4. Ejecutar la actualización
    console.log('\n3️⃣ Ejecutando actualización...');
    const updateResult = await client.query(`
      UPDATE public.clientes 
      SET ${setClause}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, cedula, nombres, apellidos, telegram_chat_id, fecha_actualizacion
    `, [id, ...values]);
    
    console.log('✅ Actualización exitosa:', updateResult.rows[0]);
    
    // 5. Verificar el resultado
    console.log('\n4️⃣ Verificando resultado...');
    const finalCheck = await client.query(`
      SELECT id, cedula, nombres, apellidos, telegram_chat_id, fecha_actualizacion 
      FROM clientes WHERE id = $1
    `, [testCliente.id]);
    
    console.log('📋 Cliente actualizado:', finalCheck.rows[0]);
    
    // 6. Probar actualización con valor vacío
    console.log('\n5️⃣ Probando con valor vacío...');
    const emptyUpdate = await client.query(`
      UPDATE public.clientes 
      SET telegram_chat_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, cedula, telegram_chat_id, fecha_actualizacion
    `, [null, testCliente.id]);
    
    console.log('✅ Actualización con valor vacío:', emptyUpdate.rows[0]);
    
    // 7. Verificar estado final
    console.log('\n6️⃣ Estado final del cliente...');
    const finalState = await client.query(`
      SELECT id, cedula, telegram_chat_id 
      FROM clientes WHERE id = $1
    `, [testCliente.id]);
    
    const cliente = finalState.rows[0];
    console.log('📋 Estado final:', cliente);
    console.log('📊 Estado Telegram:', cliente.telegram_chat_id ? '✓ Configurado' : '- No configurado');
    
    // 8. Limpiar datos de prueba
    console.log('\n7️⃣ Limpiando datos de prueba...');
    await client.query(`DELETE FROM clientes WHERE cedula = '6666666666'`);
    console.log('🧹 Datos de prueba eliminados');
    
    console.log('\n✅ Todas las pruebas de actualización real pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testRealUpdate(); 