import { CreateMessageTemplateData, MessageTemplate, MessageTemplatesResponse, ListMessageTemplateParams } from "../interfaces/MessageTemplate";
import MessageTemplateRepository from "../repositories/MessageTemplateRepository";
import { MessageTemplateSchemas } from "../schemas/MessageTemplateSchema";
import { APIError } from "../utils/wrapException";

export default class MessageTemplateService {
  static async listMessageTemplates(params: ListMessageTemplateParams): Promise<MessageTemplatesResponse> {

    const { page, limit, user_id, name } = params;

    const where: Record<string, any> = {};

    if (user_id) where.user_id = user_id;
    if (name) {
      where.OR = [
        { name: { contains: name, mode: 'insensitive' } },
        { content: { contains: name, mode: 'insensitive' } },
      ];
    }

    return await MessageTemplateRepository.listMessageTemplates(where, {
      page: page,
      limit: limit,
      customLabels: {
        totalDocs: "resultados",
        docs: "templates",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });
  }

  static async createMessageTemplates(data: CreateMessageTemplateData): Promise<MessageTemplate> {

    const validatedData = MessageTemplateSchemas.create.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const messageTemplateData = await MessageTemplateRepository.createMessageTemplates(validatedData.data);

    return messageTemplateData;
  }

  static async alterMessageTemplates(id: string, data: Partial<CreateMessageTemplateData>): Promise<MessageTemplate> {

    const validatedData = MessageTemplateSchemas.alter.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const messageTemplateData = await MessageTemplateRepository.alterMessageTemplates(id, validatedData.data);

    return messageTemplateData;
  }

  static async deleteMessageTemplates(id: string): Promise<MessageTemplate> {

    const messageTemplateData = await MessageTemplateRepository.deleteMessageTemplates(id);

    return messageTemplateData;
  }

  static async findMessageTemplates(id: string): Promise<MessageTemplate | null> {

    const messageTemplateData = await MessageTemplateRepository.findMessageTemplates(id);

    if (!messageTemplateData) throw new APIError("Template não encontrada.", 404);

    return messageTemplateData;
  }
}
