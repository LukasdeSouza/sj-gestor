import { CreateUserData, ListUserParams, User, UsersResponse } from "../interfaces/User";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";
import UserRepository from "../repositories/UserRepository";
import { UserSchemas } from "../schemas/UserSchemas";
import { APIError } from "../utils/wrapException";

export default class UserService {
  static async listUsers(params: ListUserParams): Promise<UsersResponse> {
    const { page, limit } = params;

    const userData = await UserRepository.listUsers({}, {
      page: page,
      limit: limit,
      customLabels: {
        totalDocs: "resultados",
        docs: "users",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });

    return userData;
  }

  static async createUser(data: CreateUserData): Promise<User> {

    const validatedData = UserSchemas.create.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const productData = await UserRepository.createUser(validatedData.data);

    return productData;
  }

  static async findUser(id: string): Promise<User | null> {
    const userData = await UserRepository.findUser(id);

    if (!userData) throw new APIError("Usuário não encontrado.", 404);

    return userData;
  }

  static async deleteUser(id: string): Promise<User | null> {

    const userData = await UserRepository.deleteUser(id);

    return userData;
  }

  static async alterUser(id: string, data: Partial<CreateUserData> & { planId?: string }): Promise<User | null> {
    // Validação
    const parsed = UserSchemas.alter.safeParse(data);
    if (!parsed.success) {
      throw new APIError(parsed.error, 422);
    }

    const { groupId, planId, ...rest } = parsed.data;
    const user = await UserRepository.updateUser(id, { ...rest, groupId });

    // Se foi solicitado trocar de plano, ajustar assinatura
    if (planId) {
      const mapped = planId as any; // "FREE" | "PRO_100" | "PRO_UNLIMITED"
      await SubscriptionRepository.setPlanForUser(id, mapped);
    }

    return user;
  }

  static async promoteToAdmin(userId: string): Promise<User | null> {
    // Get ADMIN group (try multiple variations)
    let adminGroup = await UserRepository.getGroupByName("ADMIN");
    if (!adminGroup) {
      adminGroup = await UserRepository.getGroupByName("Admin");
    }
    if (!adminGroup) {
      adminGroup = await UserRepository.getGroupByName("ADMINISTRADOR");
    }
    if (!adminGroup) {
      // Create ADMIN group if it doesn't exist
      adminGroup = await UserRepository.createGroup("ADMIN");
    }

    // Update user group to ADMIN
    const user = await UserRepository.updateUser(userId, { groupId: adminGroup.id });

    return user;
  }
}
