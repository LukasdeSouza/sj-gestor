import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class DashboardRepository {
  // Contagens principais do dashboard por usuário
  static async countTotals(user_id: string) {
    const [clients, products, pixKeys, templates] = await Promise.all([
      prisma.client.count({ where: { user_id } }),
      prisma.product.count({ where: { user_id } }),
      prisma.pixKey.count({ where: { user_id } }),
      prisma.template.count({ where: { user_id } }),
    ]);

    return { clients, products, pixKeys, templates };
  }

  static async monthChargesTotals(user_id: string, start: Date, end: Date) {
    return { totalCharges: 0, totalValue: 0 };
  }

  // Clientes com vencimento hoje (due_at na data atual)
  static async clientsDueToday(user_id: string, dayStart: Date, dayEnd: Date) {
    return prisma.client.findMany({
      where: {
        user_id,
        due_at: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        id: true,
        due_at: true,
      },
    });
  }

  // Contagens de flags (removidas: auto_billing/recurring)
  static async countsFlags(_user_id: string) {
    return { autoBillingOn: 0, recurringEnabled: 0 };
  }

  // Status do WhatsApp
  static async whatsappStatus(user_id: string) {
    return prisma.whatsAppConnection.findUnique({
      where: { user_id },
      select: { is_connected: true, last_connected_at: true },
    });
  }

  // Distribuição por frequência (descontinuado)
  static async groupByFrequency(_user_id: string) {
    return [] as any[];
  }

  // Top produtos por quantidade de cobranças
  static async topProducts(user_id: string, limit = 5) {
    return [] as any[];
  }

  static async findProductsByIds(ids: string[]) {
    return [] as any[];
  }
}
