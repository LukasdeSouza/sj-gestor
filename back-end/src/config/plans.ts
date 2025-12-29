export type PlanId = "FREE" | "PRO_100" | "PRO_UNLIMITED";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // em BRL
  clientLimit: number | null; // null = ilimitado
  description: string;
}

export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Gratuito",
    price: 0,
    clientLimit: 5,
    description: "Até 5 clientes, ideal para começar.",
  },
  {
    id: "PRO_100",
    name: "Pro (até 100 clientes)",
    price: 50,
    clientLimit: 100,
    description: "Plano para pequenas operações.",
  },
  {
    id: "PRO_UNLIMITED",
    name: "Ilimitado",
    price: 75,
    clientLimit: null,
    description: "Sem limite de clientes.",
  },
];

export function findPlanById(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
