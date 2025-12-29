import { CreatePixKeyData, ListPixKeyParams } from "../interfaces/PixKey";
import PixKeyService from "../services/PixKeyService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";

export default class PixKeyController {
  static async listPixKeys(req: Request, res: Response): Promise<void> {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const name = (req.query.name as string) || undefined;

    const params: ListPixKeyParams = {
      page,
      limit,
      user_id: (req as any).decodedToken?.id as string,
      name,
    }

    const result = await PixKeyService.listPixKeys(params);

    sendResponse(res, 200, { data: result })
  }

  static async createPixKey(req: Request, res: Response): Promise<void> {
    const userId = (req as any).decodedToken?.id as string;
    const pixKey: CreatePixKeyData = { ...req.body, user_id: userId };

    const result = await PixKeyService.createPixKey(pixKey);

    sendResponse(res, 200, { data: result })
  }

  static async alterPixKey(req: Request, res: Response): Promise<void> {

    const pixKey: Partial<CreatePixKeyData> = { ...req.body };
    const { id } = req.params;

    const result = await PixKeyService.alterPixKey(id, pixKey);

    sendResponse(res, 200, { data: result })
  }

  static async deletePixKey(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await PixKeyService.deletePixKey(id);

    sendResponse(res, 200, { data: result })
  }

  static async findPixKey(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await PixKeyService.findPixKey(id);

    sendResponse(res, 200, { data: result })
  }
}
