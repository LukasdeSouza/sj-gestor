// importando o prisma client
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

// iniciando o prisma client
const prisma = new PrismaClient();

export { prisma };