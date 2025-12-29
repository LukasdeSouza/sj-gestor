import DashboardService from "../services/DashboardService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";

export default class DashboardController {
  static async summary(req: Request, res: Response) {
    const user_id = req.query.user_id as string;
    const data = await DashboardService.summary(user_id);
    sendResponse(res, 200, { data });
  }

  static async distribution(req: Request, res: Response) {
    const user_id = req.query.user_id as string;
    const data = await DashboardService.billingFrequencyDistribution(user_id);
    sendResponse(res, 200, { data });
  }

  static async topProducts(req: Request, res: Response) {
    const user_id = req.query.user_id as string;
    const take = parseInt((req.query.limit as string) ?? '5');
    const data = await DashboardService.topProducts(user_id, take);
    sendResponse(res, 200, { data });
  }
}
