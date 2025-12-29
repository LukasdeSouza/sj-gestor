export const ACAO = {
  VER: "VER",
  CRIAR: "CRIAR",
  EDITAR: "EDITAR",
  DELETAR: "DELETAR",
} as const;

export type AcaoTipo = keyof typeof ACAO;

export const PERM = {
  // AgendaPix
  USER: "USER",
  DASHBOARD: "DASHBOARD",
  GROUP: "GROUP",
  CLIENT: "CLIENT",
  PRODUCT: "PRODUCT",
  PIX_KEY: "PIX_KEY",
  TEMPLATE: "TEMPLATE",
} as const;

export type PermTipo = keyof typeof PERM;

export const GROUP = {
  // AgendaPix
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
} as const;

export type GroupTipo = keyof typeof GROUP;