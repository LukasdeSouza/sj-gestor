import { Request, Response } from "express";
import ClientPaymentService from "../services/ClientPaymentService";
import { sendResponse } from "../utils/messages";

export default class ClientPaymentController {
  static async list(req: Request, res: Response) {
    const { id } = req.params; // client id
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ClientPaymentService.list(id, page, limit);
    sendResponse(res, 200, { data: result });
  }

  static async create(req: Request, res: Response) {
    const { id } = req.params; // client id
    const payload = { ...req.body, client_id: id };
    const result = await ClientPaymentService.create(payload);
    sendResponse(res, 201, { data: result });
  }

  static async delete(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await ClientPaymentService.delete(id);

    sendResponse(res, 200, { data: result })
  }
}

