import { z } from "zod";

export class UserSchemas {
  static create = z.object({
    email: z.string().email("Email inválido").min(1).max(256),
    password: z.string().min(8).max(256),
    groupId: z.string().uuid().optional(),
    name: z.string().min(3).max(256),
  });

  static planIdEnum = z.enum(["FREE", "PRO_100", "PRO_UNLIMITED"]);

  static alter = z.object({
    name: z.string().min(3).max(256).optional(),
    email: z.string().email("Email inválido").max(256).optional(),
    groupId: z.string().uuid().optional(),
    planId: UserSchemas.planIdEnum.optional(),
  });
}