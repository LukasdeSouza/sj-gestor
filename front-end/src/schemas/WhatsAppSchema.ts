import { z } from "zod";

export class WhatsAppSchema {
  static create = z.object({
    phone_number: z.string().min(8).max(12),
  });
}