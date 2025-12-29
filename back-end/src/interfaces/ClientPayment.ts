import { Decimal } from "@prisma/client/runtime/library";
import { PaginationInfo } from "./Pagination";

export interface CreateClientPaymentData {
  client_id: string;
  paid_at: Date;
  amount?: Decimal | null;
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

