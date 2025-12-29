import { PaginationInfo } from "@/types/api";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsResponse extends PaginationInfo {
  products: Product[];
}