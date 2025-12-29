import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

function randomPixKeyType(): string {
  const types = ["EVP", "EMAIL", "PHONE", "CPF"] as const;
  return faker.helpers.arrayElement(types);
}

function generatePixKeyValue(type: string): string {
  switch (type) {
    case "EVP":
      return faker.string.uuid();
    case "EMAIL":
      return faker.internet.email().toLowerCase();
    case "PHONE":
    case "CPF":
      return faker.string.numeric(11);
    default:
      return faker.string.uuid();
  }
}

export async function seedPixKeys(prisma: PrismaClient, userId: string, count = 12) {
  const keysData = Array.from({ length: count }).map(() => {
    const key_type = randomPixKeyType();
    const key_value = generatePixKeyValue(key_type);
    return {
      key_type,
      key_value,
      label: faker.commerce.productName(),
      user_id: userId,
    };
  });

  for (const data of keysData) {
    try {
      await prisma.pixKey.create({ data });
    } catch {
      // ignora colisões de unique ou similares
    }
  }
}

