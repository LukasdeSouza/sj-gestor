import { CreatePixKeyData, PixKey, PixKeysResponse } from "../interfaces/PixKey";
import { paginate, PaginationOptions } from "../utils/pagination";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class PixKeyRepository {
  static async listPixKeys(where: any, options: PaginationOptions): Promise<PixKeysResponse> {

    return await paginate(prisma.pixKey, where, options)
  }

  static async createPixKey(validatedData: CreatePixKeyData): Promise<PixKey> {

    const { user_id, ...rest } = validatedData;

    return await prisma.pixKey.create({
      data: {
        ...rest,
        user: { connect: { id: user_id } }
      }
    })
  }

  static async alterPixKey(id: string, validatedData: Partial<CreatePixKeyData>): Promise<PixKey> {

    const { user_id, ...rest } = validatedData;

    return await prisma.pixKey.update({
      where: { id },
      data: {
        ...rest,
        // Não necessita alterar de quem é esse valor rs
        // user: { connect: { id: user_id } }, 
      }
    })
  }

  static async deletePixKey(id: string): Promise<PixKey> {

    return await prisma.pixKey.delete({
      where: { id }
    })
  }

  static async findPixKey(id: string): Promise<PixKey | null> {

    return await prisma.pixKey.findUnique({
      where: { id }
    })
  }
}
