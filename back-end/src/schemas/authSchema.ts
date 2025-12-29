import { z } from "zod";

export class AuthSchemas {
  static login = z.object({
    email: z.email("Email inválido").min(1).max(256),
    password: z.string().min(8).max(256),
  });

  static register = z.object({
    email: z.email("Email inválido").min(1).max(256),
    name: z.string().min(3).max(256),
    password: z.string().min(8).max(256),
  });
}