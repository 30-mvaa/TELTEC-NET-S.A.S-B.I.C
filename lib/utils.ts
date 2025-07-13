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

/**
 * Valida una cédula ecuatoriana
 * @param cedula - Número de cédula a validar
 * @returns true si la cédula es válida, false en caso contrario
 */
export function validarCedulaEcuatoriana(cedula: string): boolean {
  // Verificar que tenga exactamente 10 dígitos
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Verificar que no sea una secuencia de números iguales
  if (/^(\d)\1{9}$/.test(cedula)) {
    return false;
  }

  // Verificar que el tercer dígito sea válido (0-6)
  const tercerDigito = parseInt(cedula.charAt(2));
  if (tercerDigito > 6) {
    return false;
  }

  // Algoritmo de validación
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    const producto = parseInt(cedula.charAt(i)) * coeficientes[i];
    suma += producto > 9 ? producto - 9 : producto;
  }

  const decenaSuperior = Math.ceil(suma / 10) * 10;
  const digitoVerificador = decenaSuperior - suma;

  // Si el dígito verificador es 10, se convierte en 0
  const digitoEsperado = digitoVerificador === 10 ? 0 : digitoVerificador;
  const digitoReal = parseInt(cedula.charAt(9));

  return digitoEsperado === digitoReal;
}

/**
 * Formatea una cédula ecuatoriana con guiones (ej: 123456789-0)
 * @param cedula - Número de cédula sin formato
 * @returns Cédula formateada
 */
export function formatearCedula(cedula: string): string {
  if (cedula.length === 10) {
    return `${cedula.slice(0, 9)}-${cedula.slice(9)}`;
  }
  return cedula;
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param fechaNacimiento - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns Edad en años
 */
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  
  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

/**
 * Valida que una persona sea mayor de edad (18 años o más)
 * @param fechaNacimiento - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns true si es mayor de edad, false en caso contrario
 */
export function validarMayorEdad(fechaNacimiento: string): boolean {
  return calcularEdad(fechaNacimiento) >= 18;
}

/**
 * Obtiene la fecha mínima permitida (18 años atrás desde hoy)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function obtenerFechaMinima(): string {
  const hoy = new Date();
  const fechaMinima = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  return fechaMinima.toISOString().split('T')[0];
}

/**
 * Obtiene la fecha máxima permitida (100 años atrás desde hoy)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function obtenerFechaMaxima(): string {
  const hoy = new Date();
  const fechaMaxima = new Date(hoy.getFullYear() - 100, hoy.getMonth(), hoy.getDate());
  return fechaMaxima.toISOString().split('T')[0];
}

/**
 * Formatea una fecha para mostrar en formato legible
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns Fecha formateada (ej: "15 de Enero de 1990")
 */
export function formatearFecha(fecha: string): string {
  const opciones: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

