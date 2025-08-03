const { Pool } = require('pg');

// Configuración de conexión
const pool = new Pool({
  user: 'teltec_user',
  host: 'localhost',
  database: 'teltec_db',
  password: '12345678',
  port: 5432,
});

async function testEditTelegramField() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando edición del campo telegram_chat_id...');
    
    // 1. Crear un cliente de prueba
    console.log('\n1️⃣ Creando cliente de prueba...');
    const createResult = await client.query(`
      INSERT INTO clientes (
        cedula, nombres, apellidos, tipo_plan, precio_plan, 
        fecha_nacimiento, direccion, sector, email, telefono, 
        telegram_chat_id, estado
      ) VALUES (
        '8888888888', 'Test', 'Edit', 'Plan Test', 25.00,
        '1990-01-01', 'Dirección Test', 'Sector Test', 'test.edit@test.com', '0888888888',
        '111111111', 'activo'
      ) RETURNING id, cedula, telegram_chat_id
    `);
    
    const testCliente = createResult.rows[0];
    console.log('✅ Cliente creado:', testCliente);
    
    // 2. Verificar el valor inicial
    console.log('\n2️⃣ Verificando valor inicial...');
    const initialCheck = await client.query(`
      SELECT id, cedula, telegram_chat_id FROM clientes WHERE id = $1
    `, [testCliente.id]);
    
    console.log('📋 Valor inicial:', initialCheck.rows[0]);
    
    // 3. Actualizar el telegram_chat_id
    console.log('\n3️⃣ Actualizando telegram_chat_id...');
    const updateResult = await client.query(`
      UPDATE clientes 
      SET telegram_chat_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, cedula, telegram_chat_id, fecha_actualizacion
    `, ['999999999', testCliente.id]);
    
    console.log('✅ Actualización exitosa:', updateResult.rows[0]);
    
    // 4. Verificar el valor actualizado
    console.log('\n4️⃣ Verificando valor actualizado...');
    const finalCheck = await client.query(`
      SELECT id, cedula, telegram_chat_id, fecha_actualizacion 
      FROM clientes WHERE id = $1
    `, [testCliente.id]);
    
    console.log('📋 Valor final:', finalCheck.rows[0]);
    
    // 5. Probar con valor vacío
    console.log('\n5️⃣ Probando con valor vacío...');
    const emptyUpdate = await client.query(`
      UPDATE clientes 
      SET telegram_chat_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, cedula, telegram_chat_id, fecha_actualizacion
    `, [null, testCliente.id]);
    
    console.log('✅ Actualización con valor vacío:', emptyUpdate.rows[0]);
    
    // 6. Probar con valor muy largo
    console.log('\n6️⃣ Probando con valor largo...');
    const longUpdate = await client.query(`
      UPDATE clientes 
      SET telegram_chat_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, cedula, telegram_chat_id, fecha_actualizacion
    `, ['-1001234567890123456789', testCliente.id]);
    
    console.log('✅ Actualización con valor largo:', longUpdate.rows[0]);
    
    // 7. Limpiar datos de prueba
    console.log('\n7️⃣ Limpiando datos de prueba...');
    await client.query(`DELETE FROM clientes WHERE cedula = '8888888888'`);
    console.log('🧹 Datos de prueba eliminados');
    
    console.log('\n✅ Todas las pruebas de edición pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testEditTelegramField(); 