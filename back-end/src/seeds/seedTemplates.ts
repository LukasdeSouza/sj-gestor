import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedTemplates(prisma: PrismaClient, userId: string, count = 20) {
  const templatesData = Array.from({ length: count }).map(() => ({
    name: `Cobranca ${faker.commerce.productName()}`,
    content: `Olá {nome}, segue cobrança do produto {produto} no valor de {valor} com vencimento em {vencimento}.`,
    user_id: userId,
  }));

  for (const data of templatesData) {
    try {
      await prisma.template.create({ data });
    } catch {
      // ignora duplicatas/erros pontuais
    }
  }
}

