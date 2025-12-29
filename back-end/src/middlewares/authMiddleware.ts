import { Request, Response, NextFunction } from "express";
import messages from "../utils/messages";
import jwt from "jsonwebtoken";

// Interface para o token decodificado
interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

// Extensão da interface Request do Express
declare global {
  namespace Express {
    interface Request {
      decodedToken?: DecodedToken;
    }
  }
}

export const AuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verifica se o token foi enviado no cabeçalho
    let token = req.headers.authorization;
    if (!token) {
      res.status(498).json({
        data: [],
        error: true,
        code: 498,
        message: messages.httpCodes[498],
        errors: [messages.auth.invalidToken]
      });
      return;
    }

    // Extrai o token do cabeçalho (removendo o "Bearer ")
    [, token] = token.split(" ");

    // Verifica o token usando o segredo JWT
    if (process.env.JWT_SECRET) {
      req.decodedToken = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    }

    // Chama o próximo middleware
    next();
  } catch (err) {
    // Trata erros de validação do token
    res.status(498).json({
      data: [],
      error: true,
      code: 498,
      message: messages.httpCodes[498],
      errors: [messages.auth.invalidToken]
    });
  }
};