// lib/utils.ts ❌ ya no debe importar nodemailer

import bcrypt from "bcryptjs"
import { clsx } from "clsx"

export function cn(...inputs: any[]) {
  return clsx(...inputs)
}


export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

// ✅ Este archivo ahora solo tiene funciones compatibles con cliente/servidor
