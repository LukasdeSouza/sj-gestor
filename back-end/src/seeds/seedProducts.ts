import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedProducts(prisma: PrismaClient, userId: string, count = 40) {
  const productsData = Array.from({ length: count }).map(() => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    value: Number(faker.commerce.price({ min: 10, max: 1000, dec: 2 })),
    user_id: userId,
  }));

  for (const data of productsData) {
    try {
      await prisma.product.create({ data });
    } catch {
      // ignora erros pontuais
    }
  }
}
