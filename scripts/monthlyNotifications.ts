// scripts/monthlyNotifications.ts
import cron from "node-cron"
import { PrismaClient } from "@prisma/client"   // o tu ORM favorito
import dayjs from "dayjs"

const db = new PrismaClient()

// Ejecuta todos los días a las 03:00 AM
cron.schedule("0 3 * * *", async () => {
  console.log("[Cron] Iniciando generación de notificaciones")

  const clientes = await db.cliente.findMany({
    select: { id: true, telefono: true, fecha_registro: true }
  })

  const hoy = dayjs()

  for (const c of clientes) {
    const reg = dayjs(c.fecha_registro)
    // Calcula vencimiento de este mes
    let venc = reg
      .date(reg.date())
      .month(hoy.month())
      .year(hoy.year())
    if (hoy.isAfter(venc)) venc = venc.add(1, "month")

    const diasPara = venc.diff(hoy, "day")
    // 5 días antes → recordatorio de pago próximo
    if (diasPara === 5) {
      await db.notificacion.create({
        data: {
          cliente_id: c.id,
          tipo: "pago_proximo",
          mensaje: `Recordatorio: su pago vence el ${venc.format("DD/MM/YYYY")}.`,
          canal: "whatsapp",
          estado: "pendiente",
        },
      })
    }
    // 5 días después → aviso de corte de servicio
    if (hoy.isAfter(venc.add(5, "day"))) {
      await db.notificacion.create({
        data: {
          cliente_id: c.id,
          tipo: "corte_servicio",
          mensaje: `AVISO: Su servicio será suspendido. Pago vencido el ${venc.format("DD/MM/YYYY")}.`,
          canal: "whatsapp",
          estado: "pendiente",
        },
      })
    }
  }

  console.log("[Cron] Tarea completada")
})
