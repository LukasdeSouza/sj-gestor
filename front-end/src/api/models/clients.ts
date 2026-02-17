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

export interface Client extends CreateClientData {
  id: string;
  product?: Product;
  template?: MessageTemplate;
  key?: PixKey;
  last_reminder_due_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientsResponse extends PaginationInfo {
  clients: Client[];
}