import { z } from "zod";

export class UserSchemas {
  static create = z.object({
    email: z.email("Email inválido").min(1).max(256),
    password: z.string().min(8).max(256),
    groupId: z.uuid().optional(),
    name: z.string().min(3).max(256),
  });

  static planIdEnum = z.enum(["FREE", "PRO_100", "PRO_UNLIMITED"]);

  static alter = z.object({
    name: z.string().min(3).max(256).optional(),
    email: z.email("Email inválido").max(256).optional(),
    groupId: z.uuid().optional(),
    planId: UserSchemas.planIdEnum.optional(),
  });
}
