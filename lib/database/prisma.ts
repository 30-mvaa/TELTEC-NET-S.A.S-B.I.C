// lib/database/prisma.ts
import { PrismaClient } from "@prisma/client";

// Crea una instancia de PrismaClient
const prisma = new PrismaClient();

// Exporta la instancia de prisma para ser utilizada en otros módulos
export default prisma;
