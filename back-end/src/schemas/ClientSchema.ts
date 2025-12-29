import { z } from "zod";

// Aceita Date ISO string ou Date para due_at
export const dateLike = z.union([
  z.string().datetime().transform((v) => new Date(v)),
  z.date(),
]);

export class ClientSchemas {
  static create = z
    .object({
      name: z.string().min(3).max(256),
      phone: z
        .string()
        .regex(/^\d{8,11}$/, "O telefone deve conter apenas números (8 a 11 dígitos)"),
      email: z.email("Email inválido").max(256).optional(),
      user_id: z.string(),
      due_at: dateLike.nullable().optional(),
      additional_info: z.string().max(256).optional(),
      product_id: z.uuid(),
      template_id: z.uuid(),
      key_id: z.uuid()
    })
    .superRefine((_data, _ctx) => { });

  static alter = z
    .object({
      name: z.string().min(3).max(256).optional(),
      phone: z
        .string()
        .regex(/^\d{8,11}$/, "O telefone deve conter apenas números (8 a 11 dígitos)")
        .optional(),
      email: z.email("Email inválido").max(256).optional(),
      user_id: z.string().min(1).optional(),
      due_at: dateLike.nullable().optional(),
      additional_info: z.string().max(256).optional(),
      product_id: z.uuid().optional(),
      template_id: z.uuid().optional(),
      key_id: z.uuid().optional(),
    })
    .superRefine((_data, _ctx) => { });
}
