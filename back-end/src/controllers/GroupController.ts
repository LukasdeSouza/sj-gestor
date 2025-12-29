import GrupoService from "../services/GroupService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";

export default class GroupController {
  static async listGroups(req: Request, res: Response): Promise<void> {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const nome = (req.query.nome as string) || (req.query.name as string) || undefined;

    const result = await GrupoService.listGroup({ pagina: page, limite: limit, nome });

    sendResponse(res, 200, { data: result });
  }
}
