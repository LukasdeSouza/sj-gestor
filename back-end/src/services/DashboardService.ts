import { startOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import DashboardRepository from "../repositories/DashboardRepository";

const today = startOfDay(new Date());

export default class DashboardService {
  static async summary(user_id: string) {
    const { clients, products, pixKeys, templates } = await DashboardRepository.countTotals(user_id);

    const start = new Date(today);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const clientsDueToday = await DashboardRepository.clientsDueToday(user_id, start, end);
    const dueTodayEligible = clientsDueToday.length;

    const { autoBillingOn, recurringEnabled } = await DashboardRepository.countsFlags(user_id);

    const whatsapp = await DashboardRepository.whatsappStatus(user_id);

    return {
      totals: {
        clients,
        products,
        pixKeys,
        templates
      },
      dueTodayEligible,
      autoBillingOn,
      recurringEnabled,
      whatsapp: whatsapp ?? { is_connected: false, last_connected_at: null },
    };
  }

  static async billingFrequencyDistribution(_user_id: string) {
    return { MONTHLY: 0, BIMONTHLY: 0, QUARTERLY: 0, SEMIANNUAL: 0 };
  }

  static async topProducts(user_id: string, limit = 5) {
    const grouped = await DashboardRepository.topProducts(user_id, limit);

    const ids = grouped.map((g: any) => g.product_id);
    const products = await DashboardRepository.findProductsByIds(ids);
    const map = new Map(products.map((p) => [p.id, p.name] as const));

    return grouped.map((g: any) => ({ product_id: g.product_id, name: map.get(g.product_id) ?? "-", count: g._count.id }));
  }

}
