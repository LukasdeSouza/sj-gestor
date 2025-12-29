export type ApiError<T = unknown> = {
  path?: keyof T; // Opcionalmente, pode ser uma chave do tipo T
  message: string;
} | string;

export interface ApiResponse<T, isArray extends boolean = false> {
  code: number;
  error: boolean;
  errors: ApiError[] | [];
  message: string;
  data: isArray extends true ? T[] | [] : T;
}

export interface FetchApiProps<T> {
  route: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  data?: T | null;
  token?: string;
  nextOptions?: NextFetchRequestConfig;
}


export interface PaginationInfo {
  limite: number;
  pagina: number;
  totalPaginas: number;
  resultados: number;
}