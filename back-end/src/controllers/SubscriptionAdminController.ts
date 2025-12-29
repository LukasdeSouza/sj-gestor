import { Request, Response } from "express";
import { sendResponse } from "../utils/messages";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";

export default class SubscriptionAdminController {
  static async activate(req: Request, res: Response) {
    const { userId } = req.params as { userId: string };
    const { activatedAt, paymentId } = (req.body || {}) as { activatedAt?: string; paymentId?: string };
    const sub = await SubscriptionRepository.adminActivate(userId, {
      activatedAt: activatedAt ? new Date(activatedAt) : new Date(),
      paymentId: paymentId || null,
    });
    sendResponse(res, 200, { data: sub });
  }

  static async get(req: Request, res: Response) {
    const { userId } = req.params as { userId: string };
    const sub = await SubscriptionRepository.getByUser(userId);
    sendResponse(res, 200, { data: sub });
  }
}

