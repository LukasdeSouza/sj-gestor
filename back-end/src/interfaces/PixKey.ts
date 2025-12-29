import { PaginationInfo } from "./Pagination";

export interface ListPixKeyParams {
  page: number;
  limit: number;
  user_id?: string;
  name?: string;
}

export interface CreatePixKeyData {
  key_type: string;
  key_value: string;
  label?: string | null;
  user_id: string;
}

export interface PixKey extends CreatePixKeyData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PixKeysResponse extends PaginationInfo {
  keys: PixKey[];
}
