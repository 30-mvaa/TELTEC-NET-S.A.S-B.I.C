try {
  const { Pool } = require('pg');
  console.log('✅ pg instalado correctamente');
  
  const pool = new Pool({
    user: 'teltec_user',
    host: 'localhost',
    database: 'teltec_db',
    password: '12345678',
    port: 5432,
  });
  
  console.log('✅ Pool creado exitosamente');
  console.log('🎉 Listo para usar PostgreSQL');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
