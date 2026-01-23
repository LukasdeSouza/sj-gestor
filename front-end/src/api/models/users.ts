export interface User {
  id: string;
  name: string;
  email: string;
  group?: { id: string; name: string };
  subscription?: { plan_id: "FREE" | "PRO_100" | "PRO_UNLIMITED" | null; status: string; activatedAt?: string | null; mp_payment_id?: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  groupId?: string;
}

export interface UsersResponse {
  users: User[];
  resultados: number;
  limite: number;
  pagina: number;
  totalPaginas: number;
}
