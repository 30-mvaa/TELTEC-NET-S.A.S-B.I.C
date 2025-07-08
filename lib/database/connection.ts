



import { Pool } from "pg"

// Configuración específica para teltec_db
const pool = new Pool({
  
  connectionString: process.env.DATABASE_URL,user: 'teltec_user',
  host: 'localhost',
  database: 'teltec_db',
  password: '12345678',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})


export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const start = Date.now()
    const result = await client.query(text, params)
    const duration = Date.now() - start

    console.log("✅ Query ejecutada exitosamente:", {
      query: text.substring(0, 100) + "...",
      duration: `${duration}ms`,
      rows: result.rowCount,
    })

    return result
  } catch (error) {
    console.error("❌ Error en query PostgreSQL:", {
      error: (error as Error).message,
      query: text.substring(0, 100) + "...",
      params: params,
    })
    throw error
  } finally {
    client.release()
  }
}

// Función para probar la conexión específica
export async function testTeltecConnection() {
  try {
    const result = await query(`
      SELECT 
        current_user as usuario,
        current_database() as base_datos,
        version() as version_postgres,
        NOW() as fecha_conexion
    `)

    console.log("🎉 Conexión exitosa a teltec_db:", result.rows[0])

    // Verificar acceso a tabla clientes
    const clientesTest = await query("SELECT COUNT(*) as total FROM public.clientes")
    console.log(`📊 Total de clientes en la base de datos: ${clientesTest.rows[0].total}`)

    return true
  } catch (error) {
    console.error("💥 Error conectando a teltec_db:", (error as Error).message)
    return false
  }
}

export default pool