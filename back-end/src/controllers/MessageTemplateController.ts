import { CreateMessageTemplateData, ListMessageTemplateParams } from "../interfaces/MessageTemplate";
import MessageTemplateService from "../services/MessageTemplateService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";

export default class MessageTemplateController {
  static async listMessageTemplates(req: Request, res: Response): Promise<void> {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const name = (req.query.name as string) || undefined;

    const params: ListMessageTemplateParams = {
      page,
      limit,
      user_id: (req as any).decodedToken?.id as string,
      name,
    }

    const result = await MessageTemplateService.listMessageTemplates(params);

    sendResponse(res, 200, { data: result })
  }

  static async createMessageTemplates(req: Request, res: Response): Promise<void> {
    const userId = (req as any).decodedToken?.id as string;
    const messageTemplate: CreateMessageTemplateData = { ...req.body, user_id: userId };

    const result = await MessageTemplateService.createMessageTemplates(messageTemplate);

    sendResponse(res, 200, { data: result })
  }

  static async alterMessageTemplates(req: Request, res: Response): Promise<void> {

    const messageTemplate: Partial<CreateMessageTemplateData> = { ...req.body };
    const { id } = req.params;

    const result = await MessageTemplateService.alterMessageTemplates(id, messageTemplate);

    sendResponse(res, 200, { data: result })
  }

  static async deleteMessageTemplates(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await MessageTemplateService.deleteMessageTemplates(id);

    sendResponse(res, 200, { data: result })
  }

  static async findMessageTemplates(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await MessageTemplateService.findMessageTemplates(id);

    sendResponse(res, 200, { data: result })
  }
}
