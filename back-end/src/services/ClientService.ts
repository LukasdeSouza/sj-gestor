import { Client, ClientsResponse, CreateClientData, ListClientParams } from "../interfaces/Client";
import ClientRepository from "../repositories/ClientRepository";
import { ClientSchemas } from "../schemas/ClientSchema";
import { APIError } from "../utils/wrapException";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";
import { findPlanById } from "../config/plans";

export default class ClientService {
  static async listClients(params: ListClientParams): Promise<ClientsResponse> {

    const { page, limit, user_id, name } = params;

    const where: Record<string, any> = {};

    if (user_id) where.user_id = user_id;

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }

    const clientData = await ClientRepository.listClients(where, {
      page: page,
      limit: limit,
      customLabels: {
        totalDocs: "resultados",
        docs: "clients",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });

    return clientData;
  }

  static async createClient(data: CreateClientData): Promise<Client> {

    const validatedData = ClientSchemas.create.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    // Enforce client limit by subscription plan
    const userId = validatedData.data.user_id;
    if (userId) {
      const sub = await SubscriptionRepository.getByUser(userId);
      const planId = (sub?.plan_id as any) || "FREE"; // Sem assinatura => FREE por padrão
      const plan = findPlanById(planId);
      const limit = plan?.clientLimit ?? null; // null = ilimitado
      if (limit !== null) {
        const current = await ClientRepository.countByUser(userId);
        if (current >= limit) {
          throw new APIError(`Limite de ${limit} clientes atingido para seu plano.`, 403);
        }
      }
    }

    const clientData = await ClientRepository.createClient(validatedData.data);

    return clientData;
  }

  static async alterClient(id: string, data: Partial<CreateClientData>): Promise<Client> {

    const validatedData = ClientSchemas.alter.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const clientBefore = await ClientRepository.findClient(id);
    const clientAfter = await ClientRepository.alterClient(id, validatedData.data);

    const dueBefore = clientBefore?.due_at?.getTime();
    const dueAfter = clientAfter?.due_at?.getTime();

    if (dueBefore !== dueAfter) {
      await ClientRepository.resetLastReminder(id);
    }

    return clientAfter;
  }

  static async deleteClient(id: string): Promise<Client> {

    const clientData = await ClientRepository.deleteClient(id);

    return clientData;
  }

  static async findClient(id: string): Promise<Client | null> {

    const clientData = await ClientRepository.findClient(id);

    if (!clientData) throw new APIError("Cliente não encontrado.", 404);

    return clientData;
  }
}
