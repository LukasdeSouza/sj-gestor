import { PaginationInfo } from "@/types/api";

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