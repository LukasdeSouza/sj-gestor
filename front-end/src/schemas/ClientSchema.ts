import { z } from "zod";

// Aceita Date ISO string ou Date para due_at
const dateLike = z.union([
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
      email: z.string().email("Email inválido").max(256).optional(),
      user_id: z.string(),
      due_at: dateLike,
      additional_info: z.string().max(256).optional(),
      product_id: z.string().uuid(),
      template_id: z.string().uuid(),
      key_id: z.string().uuid(),
      observacoes1: z.string().max(256).optional(),
      observacoes2: z.string().max(256).optional(),
    })
    .superRefine((_data, _ctx) => { });

  static alter = z
    .object({
      name: z.string().min(3).max(256).optional(),
      phone: z
        .string()
        .regex(/^\d{8,11}$/, "O telefone deve conter apenas números (8 a 11 dígitos)")
        .optional(),
      email: z.string().email("Email inválido").max(256).optional(),
      user_id: z.string().min(1).optional(),
      due_at: dateLike.optional(),
      additional_info: z.string().max(256).optional(),
      product_id: z.string().uuid().optional(),
      template_id: z.string().uuid().optional(),
      key_id: z.string().uuid().optional(),
      observacoes1: z.string().max(256).optional(),
      observacoes2: z.string().max(256).optional(),
    })
    .superRefine((_data, _ctx) => { });

  static alterPayment = z
    .object({
      paid_at: dateLike.nullable().optional(),
      amount: z
        .preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().nonnegative().optional()),
      note: z.string().max(552).optional(),
    })
}
