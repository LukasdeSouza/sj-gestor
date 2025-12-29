import { Request, Response, NextFunction } from "express";

const logRoutes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    // Acessando o IP de maneira segura
    let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || null;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${timestamp} ${ip} ${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`);
    }
    next();
  } catch (e) {
    console.log("Erro ao fazer o log", e);
  }
};

export default logRoutes;