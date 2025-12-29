import { MessageTemplate } from "./MessageTemplate";
import { PaginationInfo } from "./Pagination";
import { Product } from "./Product";
import { PixKey } from "./PixKey";

export interface ListClientParams {
  page: number;
  limit: number;
  user_id?: string;
  name?: string;
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
}

export interface Client extends CreateClientData {
  id: string;
  product?: Product;
  template?: MessageTemplate;
  key?: PixKey;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientsResponse extends PaginationInfo {
  clients: Client[];
}
