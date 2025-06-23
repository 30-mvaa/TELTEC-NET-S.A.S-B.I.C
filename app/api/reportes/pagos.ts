// pages/api/reportes/pagos.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PagoController } from 'lib/controllers/PagoController'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await PagoController.getReportePorMetodo()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: "Error obteniendo las ventas por plan." })
  }
}
