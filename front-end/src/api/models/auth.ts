export interface AuthUser {
  id: string;
  email: string;
  name: string;
  group?: { id: string; name: string };
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
};