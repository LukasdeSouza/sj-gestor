import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

function makeBrazilPhone(): string {
  // Gera DDD (2 dígitos), força o '9' e mais 8 dígitos => total 11
  const ddd = faker.string.numeric(2);
  const rest = faker.string.numeric(8);
  return `${ddd}9${rest}`;
}

export async function seedClients(prisma: PrismaClient, userId: string, count = 50) {
  // Busca dependências necessárias para preencher os campos obrigatórios
  const [products, templates, keys] = await Promise.all([
    prisma.product.findMany({ where: { user_id: userId }, select: { id: true } }),
    prisma.template.findMany({ where: { user_id: userId }, select: { id: true } }),
    prisma.pixKey.findMany({ where: { user_id: userId }, select: { id: true } }),
  ]);

  if (products.length === 0 || templates.length === 0 || keys.length === 0) {
    console.warn("[seedClients] Dependências não encontradas (products/templates/pixKeys). Pulei criação de clients.");
    return;
  }

  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const clientsData = Array.from({ length: count }).map(() => ({
    name: faker.person.fullName(),
    phone: makeBrazilPhone(),
    email: faker.internet.email().toLowerCase(),
    user_id: userId,
    due_at: faker.date.soon({ days: 60 }),
    additional_info: faker.lorem.sentence(),
    product_id: pick(products).id,
    template_id: pick(templates).id,
    key_id: pick(keys).id,
  }));

  for (const data of clientsData) {
    try {
      await prisma.client.create({ data });
    } catch {
      // ignora duplicadas ocasionais (email/phone únicos)
    }
  }
}
