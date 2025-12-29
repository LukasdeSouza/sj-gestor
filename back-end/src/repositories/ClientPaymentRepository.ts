import { ClientPayment, CreateClientPaymentData, ClientPaymentsResponse } from "../interfaces/ClientPayment";
import { paginate, PaginationOptions } from "../utils/pagination";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class ClientPaymentRepository {
  static async listByClient(client_id: string, options: PaginationOptions): Promise<ClientPaymentsResponse> {
    return await paginate(prisma.clientPayment, { client_id }, options, {
      orderBy: { paid_at: "desc" },
    });
  }

  static async createPayment(data: CreateClientPaymentData): Promise<ClientPayment> {
    const { client_id, ...rest } = data;

    return await prisma.clientPayment.create({
      data: {
        ...rest,
        client: { connect: { id: client_id } }
      },
    }) as unknown as ClientPayment;
  }

  static async delete(id: string): Promise<ClientPayment> {

    return await prisma.clientPayment.delete({ where: { id } })
  }
}

