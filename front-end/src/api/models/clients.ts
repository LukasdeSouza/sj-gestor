import { MessageTemplate } from "./messageTemplate";
import { PaginationInfo } from "@/types/api";
import { Product } from "./products";
import { PixKey } from "./pixKeys";

export interface ListClientParams {
  page: number;
  limit: number;
  user_id?: string;
}

export interface CreateClientData {
  name: string;
  phone: string;
  email?: string | null;
  user_id: string;
  due_at?: Date | null;
  additional_info?: string | null;
  product_id: string;
  template_id: string;
  key_id: string;
  observacoes1: string | null;
  observacoes2: string | null;
}

interface BillingCycle {
  id: string;
  due_at: string | Date;
  status: string;
}

export interface Client extends CreateClientData {
  id: string;
  product?: Product;
  template?: MessageTemplate;
  key?: PixKey;
  last_reminder_due_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payments?: { paid_at: string | Date }[];
  billing_cycles?: BillingCycle[];
}

export interface ClientsResponse extends PaginationInfo {
  clients: Client[];
}

export const getLastPaymentAt = (client: Client): string | null => {
  const paid = client.payments?.[0]?.paid_at;
  return paid ? new Date(paid).toISOString() : null;
};

export const getCurrentDueAt = (client: Client): string | Date | null => {
  const cycle = client.billing_cycles?.[0];
  if (cycle && (cycle.status === 'running' || cycle.status === 'pending')) {
    return cycle.due_at;
  }
  return client.due_at;
};
