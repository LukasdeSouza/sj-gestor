import { CreateUserData } from "../interfaces/User";
import UserService from "../services/UserService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";
import { UserSchemas } from "../schemas/UserSchemas";
import { APIError } from "../utils/wrapException";

export default class UserController {
  static async listUsers(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await UserService.listUsers({ page, limit });

    sendResponse(res, 200, { data: result })
  }

  static async createUser(req: Request, res: Response): Promise<void> {

    const user: CreateUserData = { ...req.body };

    const result = await UserService.createUser(user);

    sendResponse(res, 200, { data: result })
  }

  static async alterUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const body = { ...(req.body || {}) } as any;

    // Permitir alterar name, email, groupId e planId (via admin)
    const parsed = UserSchemas.alter.safeParse(body);
    if (!parsed.success) {
      throw new APIError(parsed.error, 422);
    }

    const result = await UserService.alterUser(id, parsed.data as any);
    sendResponse(res, 200, { data: result });
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await UserService.deleteUser(id);

    sendResponse(res, 200, { data: result })
  }

  static async findUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const result = await UserService.findUser(id);

    sendResponse(res, 200, { data: result })
  }

  static async promoteToAdmin(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const result = await UserService.promoteToAdmin(id);

    sendResponse(res, 200, { data: result, message: "Usuário promovido a Admin com sucesso" })
  }
}
