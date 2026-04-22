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
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").max(256),
    confirmPassword: z.string().min(8, "A confirmação de senha deve ter no mínimo 8 caracteres").max(256),
    acceptedTerms: z.boolean().refine(v => v === true, {
      message: "Você deve aceitar os termos de uso e política de privacidade."
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

}