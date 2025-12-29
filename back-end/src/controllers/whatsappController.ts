import whatsappService from "../services/whatsappService";
import { TokenDecoded } from "../interfaces/Auth";
import { sendError } from "../utils/messages";
import { Request, Response } from "express";
import { jwtDecode } from 'jwt-decode';
import { sessions } from "../utils/baileys";
import { eventsEmitter } from "../utils/events";

export default class whatsappController {
  static async startConnection(req: Request, res: Response) {
    try {
      const { phone_number } = req.body;

      const token = req.headers.authorization as string;
      if (!token) {
        return sendError(res, 403, "Token está faltando para autorização.");
      }
      const tokenDecoded = jwtDecode<TokenDecoded>(token);

      const result = await whatsappService.connectWhatsApp({
        userId: tokenDecoded.id,
        phone_number
      });

      return res.json({ data: result });

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async findConnection(req: Request, res: Response) {
    const token = req.headers.authorization as string;

    if (!token) {
      return sendError(res, 403, "Token está faltando para autorização.");
    }

    const tokenDecoded = jwtDecode<TokenDecoded>(token);

    const result = await whatsappService.findConnection(tokenDecoded.id)

    return res.json({ data: result });
  }

  static async whatsappEvents(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;

      const result = await whatsappService.findConnectWhatsApp(sessionId);

      // Se a sessão não for encontrada, encerra a requisição com erro 404.
      if (!result) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
      res.setHeader("Access-Control-Allow-Credentials", "true")
      res.flushHeaders();

      const listener = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      eventsEmitter.on(sessionId, listener);

      res.write(`data: ${JSON.stringify(result)}\n\n`);

      req.on("close", () => {
        eventsEmitter.removeListener(sessionId, listener);
        res.end();
      });

    } catch (error) {
      res.status(500).end();
    }
  }

  static async disconnect(req: Request, res: Response) {
    const sessionId = req.params.sessionId;

    const result = await whatsappService.disconnect(sessionId)

    return res.json({ data: result });
  }
}