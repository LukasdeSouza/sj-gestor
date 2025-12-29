import { CreatePixKeyData, ListPixKeyParams, PixKey, PixKeysResponse } from "../interfaces/PixKey";
import PixKeyRepository from "../repositories/PixKeyRepository";
import { PixKeySchemas } from "../schemas/PixkeySchema";
import { APIError } from "../utils/wrapException";

export default class PixKeyService {
  static async listPixKeys(params: ListPixKeyParams): Promise<PixKeysResponse> {

    const { page, limit, user_id, name } = params;

    const where: Record<string, any> = {};

    if (user_id) where.user_id = user_id;
    if (name) {
      where.OR = [
        { key_value: { contains: name, mode: 'insensitive' } },
        { label: { contains: name, mode: 'insensitive' } },
        { key_type: { contains: name, mode: 'insensitive' } },
      ];
    }

    return await PixKeyRepository.listPixKeys(where, {
      page: page,
      limit: limit,
      customLabels: {
        totalDocs: "resultados",
        docs: "keys",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });

  }

  static async createPixKey(data: CreatePixKeyData): Promise<PixKey> {

    const validatedData = PixKeySchemas.create.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const pixKeyData = await PixKeyRepository.createPixKey(validatedData.data);

    return pixKeyData;
  }

  static async alterPixKey(id: string, data: Partial<CreatePixKeyData>): Promise<PixKey> {

    const validatedData = PixKeySchemas.alter.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const pixKeyData = await PixKeyRepository.alterPixKey(id, validatedData.data);

    return pixKeyData;
  }

  static async deletePixKey(id: string): Promise<PixKey> {

    const pixKeyData = await PixKeyRepository.deletePixKey(id);

    return pixKeyData;
  }

  static async findPixKey(id: string): Promise<PixKey | null> {

    const pixKeyData = await PixKeyRepository.findPixKey(id);

    if (!pixKeyData) throw new APIError("Cliente não encontrado.", 404);

    return pixKeyData;
  }
}
