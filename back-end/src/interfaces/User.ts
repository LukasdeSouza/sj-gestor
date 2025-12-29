import { PaginationInfo } from "./Pagination";

export interface ListUserParams {
  page: number;
  limit: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  groupId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersResponse extends PaginationInfo {
  users: User[];
}
