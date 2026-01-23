import { applyZodInitialConfig } from "@/utils/zod";
import { z } from "zod";

applyZodInitialConfig();

export class AuthSchemas {
  static login = z.object({
    email: z.string().min(1).max(256).email("Email inválido"),
    password: z.string().min(8).max(256),
  });

  static signup = z.object({
    email: z.string().email("Email inválido").min(1).max(256),
    name: z.string().min(3).max(256),
    password: z.string().min(8).max(256),
  });

}