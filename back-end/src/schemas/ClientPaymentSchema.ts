import { z } from "zod";
import { dateLike } from "./ClientSchema";
import { Prisma } from "@prisma/client";

export class ClientPaymentSchemas {
  static create = z.object({
    client_id: z.uuid(),
    paid_at: dateLike,
    amount: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) =>
        v !== undefined ? new Prisma.Decimal(v) : v
      ),
    note: z.string().max(552).optional(),
  });
}

