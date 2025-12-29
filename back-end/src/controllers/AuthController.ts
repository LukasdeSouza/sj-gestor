import { AuthLogin, AuthRegister } from "../interfaces/Auth";
import { NextFunction, Request, Response } from "express";
import AuthService from "../services/AuthService";
import { sendResponse } from "../utils/messages";

export default class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const dataLogin: AuthLogin = req.body;

    const result = await AuthService.login(dataLogin);

    sendResponse(res, 200, { data: result })
  }

  static async register(req: Request, res: Response): Promise<void> {
    const dataRegister: AuthRegister = req.body;

    const result = await AuthService.register(dataRegister);

    sendResponse(res, 200, { data: result })
  }
}