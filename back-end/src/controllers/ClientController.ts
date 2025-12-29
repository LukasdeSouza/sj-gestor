import { CreateClientData, ListClientParams } from "../interfaces/Client";
import ClientService from "../services/ClientService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";

export default class ClientController {
  static async listClients(req: Request, res: Response): Promise<void> {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const params: ListClientParams = {
      page,
      limit,
      user_id: (req as any).decodedToken?.id as string,
      name: req.query.name as string
    }

    const result = await ClientService.listClients(params);

    sendResponse(res, 200, { data: result })
  }

  static async createClient(req: Request, res: Response): Promise<void> {
    const userId = (req as any).decodedToken?.id as string;
    const client: CreateClientData = { ...req.body, user_id: userId };

    const result = await ClientService.createClient(client);

    sendResponse(res, 200, { data: result })
  }

  static async alterClient(req: Request, res: Response): Promise<void> {

    const client: Partial<CreateClientData> = { ...req.body };
    const { id } = req.params;
    
    const result = await ClientService.alterClient(id, client);

    sendResponse(res, 200, { data: result })
  }

  static async deleteClient(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await ClientService.deleteClient(id);

    sendResponse(res, 200, { data: result })
  }

  static async findClient(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await ClientService.findClient(id);

    sendResponse(res, 200, { data: result })
  }
}
