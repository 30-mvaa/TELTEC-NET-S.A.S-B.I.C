import { query } from "../database/connection";

export interface ConfiguracionItem {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  fecha_actualizacion: string;
}

export class ConfiguracionModel {
  static async getAll(): Promise<ConfiguracionItem[]> {
    const result = await query("SELECT * FROM configuracion ORDER BY id ASC");
    return result.rows;
  }

  static async getByClave(clave: string): Promise<ConfiguracionItem | null> {
    const result = await query("SELECT * FROM configuracion WHERE clave = $1", [clave]);
    return result.rows[0] || null;
  }

  static async setConfig(clave: string, valor: string, descripcion?: string): Promise<ConfiguracionItem> {
    const result = await query(
      `INSERT INTO configuracion (clave, valor, descripcion, fecha_actualizacion)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, descripcion = EXCLUDED.descripcion, fecha_actualizacion = NOW()
       RETURNING *`,
      [clave, valor, descripcion || null]
    );
    return result.rows[0];
  }
} 