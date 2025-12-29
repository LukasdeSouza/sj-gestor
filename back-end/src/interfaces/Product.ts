import { PaginationInfo } from "./Pagination";

export interface ListProductParams {
  page: number;
  limit: number;
  user_id?: string;
  name?: string;
}

export interface CreateProductData {
  name: string;
  description?: string | null;
  value: number;
  user_id: string;
}

export interface Product extends CreateProductData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsResponse extends PaginationInfo {
  products: Product[];
}