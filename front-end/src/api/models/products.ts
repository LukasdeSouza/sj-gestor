import { PaginationInfo } from "@/types/api";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  value: number;
  late_fee_percent?: number | null;
  late_interest_percent?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsResponse extends PaginationInfo {
  products: Product[];
}