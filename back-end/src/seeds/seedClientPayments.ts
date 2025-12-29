import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function seedClientPayments(
  prisma: PrismaClient,
  userId: string,
  { maxPerClient = 3 }: { maxPerClient?: number } = {}
) {
  const clients = await prisma.client.findMany({
    where: { user_id: userId },
    select: { id: true, due_at: true },
  });

  for (const c of clients) {
    const qty = faker.number.int({ min: 0, max: maxPerClient });
    for (let i = 0; i < qty; i++) {
      // pagos recentemente no passado
      const daysAgo = faker.number.int({ min: 2, max: 120 });
      const paid_at = faker.date.recent({ days: daysAgo });
      const amount = Number(faker.commerce.price({ min: 20, max: 2000, dec: 2 }));

      try {
        await prisma.clientPayment.create({
          data: {
            client_id: c.id,
            paid_at: paid_at,
            amount,
            note: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) || undefined,
          },
        });
      } catch {
        // ignora eventuais falhas isoladas de seed
      }
    }
  }
}

