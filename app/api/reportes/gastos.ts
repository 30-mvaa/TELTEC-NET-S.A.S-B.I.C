// pages/api/reportes/gastos.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { GastoController } from 'lib/controllers/GastoController'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await GastoController.getAllGastos()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: "Error obteniendo los gastos." })
  }
}
