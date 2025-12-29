export interface AuthLogin {
  email: string;
  password: string;
}

export interface TokenDecoded {
  id: string;
  name: string;
  email: string;
  group?: { id: string; name: string };
  iat: number;
  exp: number;
}

export interface ViewAuthLogin {
  email: string;
  id: string;
  role: string;
  token: string;
  group?: { id: string; name: string };
}

export interface AuthRegister {
  email: string;
  password: string;
  name: string;
}

export interface ViewUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}