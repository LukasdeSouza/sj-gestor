import { CreateMessageTemplateData, MessageTemplate, MessageTemplatesResponse } from "../interfaces/MessageTemplate";
import { paginate, PaginationOptions } from "../utils/pagination";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class MessageTemplateRepository {
  static async listMessageTemplates(where: any, options: PaginationOptions): Promise<MessageTemplatesResponse> {

    return await paginate(prisma.template, where, options)
  }

  static async createMessageTemplates(validatedData: CreateMessageTemplateData): Promise<MessageTemplate> {

    const { user_id, ...rest } = validatedData;

    return await prisma.template.create({
      data: {
        ...rest,
        user: { connect: { id: user_id } }
      }
    })
  }

  static async alterMessageTemplates(id: string, validatedData: Partial<CreateMessageTemplateData>): Promise<MessageTemplate> {

    const { user_id, ...rest } = validatedData;

    return await prisma.template.update({
      where: { id },
      data: {
        ...rest,
        // Não necessita alterar de quem é esse valor rs
        // user: { connect: { id: user_id } }, 
      }
    })
  }

  static async deleteMessageTemplates(id: string): Promise<MessageTemplate> {

    return await prisma.template.delete({
      where: { id }
    })
  }

  static async findMessageTemplates(id: string): Promise<MessageTemplate | null> {

    return await prisma.template.findUnique({
      where: { id }
    })
  }
}

