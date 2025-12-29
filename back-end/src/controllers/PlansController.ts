import { Request, Response } from "express";
import { PLANS } from "../config/plans";

export default class PlansController {
  static async list(req: Request, res: Response) {
    return res.json({ error: false, data: PLANS });
  }
}

