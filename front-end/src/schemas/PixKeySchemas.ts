import { z } from "zod";

export class PixKeySchemas {
  static create = z.object({
    key_type: z.string().max(256),
    key_value: z.string().max(256),
    label: z.string().max(256).optional(),
    user_id: z.string().min(1),
  });

  static alter = z.object({
    key_type: z.string().max(256),
    key_value: z.string().max(256),
    label: z.string().max(256).optional(),
    user_id: z.string().min(1),
  });
}