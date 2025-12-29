import { ClientPayment, ClientPaymentsResponse, CreateClientPaymentData } from "../interfaces/ClientPayment";
import ClientPaymentRepository from "../repositories/ClientPaymentRepository";
import { ClientPaymentSchemas } from "../schemas/ClientPaymentSchema";
import { APIError } from "../utils/wrapException";

export default class ClientPaymentService {
  static async list(client_id: string, page: number, limit: number): Promise<ClientPaymentsResponse> {
    const response = await ClientPaymentRepository.listByClient(client_id, {
      page,
      limit,
      customLabels: {
        totalDocs: "resultados",
        docs: "payments",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });
    return response;
  }

  static async create(data: CreateClientPaymentData): Promise<ClientPayment> {

    const validatedData = ClientPaymentSchemas.create.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const clientPaymentData = await ClientPaymentRepository.createPayment(validatedData.data);

    return clientPaymentData;
  }

  static async delete(id: string): Promise<ClientPayment> {

    const clientData = await ClientPaymentRepository.delete(id);

    return clientData;
  }
}

