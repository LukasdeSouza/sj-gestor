import { Client, ClientsResponse, CreateClientData } from "../interfaces/Client";
import { paginate, PaginationOptions } from "../utils/pagination";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class ClientRepository {
  static async listClients(where: any, options: PaginationOptions): Promise<ClientsResponse> {

    return await paginate(prisma.client, where, options)
  }

  static async countByUser(userId: string): Promise<number> {
    return prisma.client.count({ where: { user_id: userId } });
  }

  static async createClient(validatedData: CreateClientData): Promise<Client> {

    const { user_id, product_id, template_id, key_id, due_at, ...rest } = validatedData;

    return await prisma.client.create({
      data: {
        ...rest,
        ...(due_at ? { due_at: new Date(due_at as any) } : {}),
        user: { connect: { id: user_id } },
        product: { connect: { id: product_id } },
        template: { connect: { id: template_id } },
        key: { connect: { id: key_id } },
      },
      include: {}
    })
  }

  static async alterClient(id: string, validatedData: Partial<CreateClientData>): Promise<Client> {

    const { user_id, product_id, template_id, key_id, due_at, ...rest } = validatedData;

    return await prisma.client.update({
      where: { id },
      data: {
        ...rest,
        ...(due_at !== undefined ? { due_at: due_at ? new Date(due_at as any) : null } : {}),
        product: { connect: { id: product_id } },
        template: { connect: { id: template_id } },
        key: { connect: { id: key_id } },
      },
      include: {}
    })
  }

  static async deleteClient(id: string): Promise<Client> {

    return await prisma.client.delete({ where: { id } })
  }

  static async findClient(id: string): Promise<Client | null> {

    return await prisma.client.findUnique({
      where: { id },
      include: {
        key: true,
        template: true,
        product: true
      }
    })
  }

  static async setLastReminderDueAt(id: string, date: Date | null): Promise<void> {
    await prisma.client.update({ where: { id }, data: { last_reminder_due_at: date } });
  }

  static async resetLastReminder(id: string) {
    return prisma.client.update({
      where: { id },
      data: { last_reminder_due_at: null },
    });
  }
}
