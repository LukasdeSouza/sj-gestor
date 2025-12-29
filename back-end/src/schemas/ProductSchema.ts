import { z } from "zod";

export class ProductSchemas {
  static create = z.object({
    name: z.string().min(3).max(256),
    value: z.number("O valor deve ser um número.",)
      .min(0.01, "O valor deve ser maior que zero.")
      .max(9999999.99, "O valor é muito alto."),
    description: z.string().max(552).optional(),
    user_id: z.string().uuid(),
  });

  static alter = z.object({
    name: z.string().min(3).max(256),
    value: z.number("O valor deve ser um número.",)
      .min(0.01, "O valor deve ser maior que zero.")
      .max(9999999.99, "O valor é muito alto."),
    description: z.string().max(552).optional(),
    user_id: z.string().uuid(),
  });
}