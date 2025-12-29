import { AuthRegister, ViewUser } from "../interfaces/Auth";
import prisma from "../lib/prisma";

export default class AuthRepository {
  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        group: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true
      },
    });
  }

  static async register(data: AuthRegister): Promise<ViewUser> {
    // Ignora qualquer groupId enviado e força grupo CLIENT como padrão
    const { ...userData } = data as any;

    let clientGroup = await prisma.group.findUnique({ where: { name: "CLIENT" } });
    if (!clientGroup) {
      clientGroup = await prisma.group.create({ data: { name: "CLIENT", level: 0, hidden: false } });
    }

    return await prisma.user.create({
      data: {
        ...userData,
        group: { connect: { id: clientGroup.id } },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        group: { select: { id: true, name: true } },
      },
    });
  }
}
