import { z } from "zod";

export class MessageTemplateSchemas {
  static create = z.object({
    name: z.string().max(256),
    content: z.string().max(1256),
    user_id: z.string().min(1),
  });

  static alter = z.object({
    name: z.string().max(256),
    content: z.string().max(1256),
    user_id: z.string().min(1),
  });
}