import { paginate, PaginationOptions } from "../utils/pagination";
import { CreateUserData, User, UsersResponse } from "../interfaces/User";
import prisma from "../lib/prisma";

export default class UserRepository {
  static async listUsers(where: any, options: PaginationOptions): Promise<UsersResponse> {
    return await paginate(prisma.user, where, options, {
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,

        group: true,

        subscription: { select: { status: true, plan_id: true } },
      },
    });
  }

  static async createUser(validatedData: CreateUserData): Promise<User> {
    const { groupId, ...rest } = validatedData;

    return await prisma.user.create({
      data: {
        ...rest,
        ...(groupId ? { group: { connect: { id: groupId } } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async findUser(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        group: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
        subscription: { select: { status: true, plan_id: true, activatedAt: true, mp_payment_id: true } },
      }
    });
  }

  static async deleteUser(id: string): Promise<User | null> {

    return await prisma.user.delete({ where: { id } })
  }

  static async updateUser(id: string, data: Partial<CreateUserData>): Promise<User | null> {
    const { groupId, ...rest } = data || {} as any;

    return await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(groupId ? { group: { connect: { id: groupId } } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        group: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
        subscription: { select: { status: true, plan_id: true } },
      }
    });
  }

  static async getGroupByName(name: string): Promise<any | null> {
    return await prisma.group.findFirst({
      where: { name },
    });
  }

  static async getAllGroups(): Promise<any[]> {
    return await prisma.group.findMany();
  }

  static async createGroup(name: string): Promise<any> {
    return await prisma.group.create({
      data: { name },
    });
  }
}
