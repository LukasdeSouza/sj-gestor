import { Request, Response } from "express";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";

export default class SubscriptionController {
  static async me(req: Request, res: Response) {
    const userId = (req as any).decodedToken?.id as string | undefined;
    if (!userId) return res.status(401).json({ error: true, message: "Não autenticado" });

    const sub = await SubscriptionRepository.getByUser(userId);
    // Retorna um objeto simplificado para o front
    return res.json({
      error: false,
      data: sub ? { status: sub.status, plan_id: sub.plan_id } : { status: "NONE", plan_id: null },
    });
  }
}

