import 'dotenv/config'
import cron from "node-cron"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function generarCuotas() {
  console.log("[Cron] Generando cuotas mensuales...")
  await pool.query("SELECT generar_cuotas_mensuales()")
  console.log("[Cron] Cuotas mensuales generadas.")
}

// Ejecutar el día 1 de cada mes a las 03:00 AM
cron.schedule("0 3 1 * *", async () => {
  await generarCuotas()
})

// Si quieres ejecutarlo manualmente también:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  generarCuotas().then(() => process.exit(0))
} 