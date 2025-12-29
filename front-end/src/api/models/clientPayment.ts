import { PaginationInfo } from "@/types/api";

export interface CreateClientPaymentData {
  client_id: string;
  paid_at: Date;
  amount?: number | null;
  note?: string | null;
}

export interface ClientPayment extends CreateClientPaymentData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPaymentsResponse extends PaginationInfo {
  payments: ClientPayment[];
}

