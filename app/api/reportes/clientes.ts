// pages/api/reportes/clientes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { ClienteController } from 'lib/controllers/ClienteController'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await ClienteController.getAllClientes()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: "Error obteniendo los clientes." })
  }
}
