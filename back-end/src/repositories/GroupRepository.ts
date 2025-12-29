import { PrismaClient } from "@prisma/client";
import { paginate } from "../utils/pagination";

const prisma = new PrismaClient();

export default class GroupRepository {
  static async listGroup(where: any, options: any) {
    return await paginate((prisma as any).group, where, options);
  }

  static async findUGroupsByIds(ids: string[]) {
    return await (prisma as any).group.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, level: true },
    }) as any[];
  }

  static async findByName(name: string) {
    return await (prisma as any).group.findUnique({ where: { name }, select: { id: true, name: true } });
  }
}