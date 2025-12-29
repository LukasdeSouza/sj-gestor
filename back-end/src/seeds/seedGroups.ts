import { PrismaClient } from "@prisma/client";

// Idempotente: garante somente CLIENT e ADMIN no modelo Group
export async function seedGroups(prisma: PrismaClient) {
  const groups = [
    { name: "CLIENT", level: 0, hidden: false },
    { name: "ADMIN", level: 10, hidden: false },
  ];

  for (const g of groups) {
    await prisma.group.upsert({
      where: { name: g.name },
      update: { level: g.level, hidden: g.hidden },
      create: { name: g.name, level: g.level, hidden: g.hidden },
    });
  }
}
