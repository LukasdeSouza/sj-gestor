import setupSwagger from "./docs/config/index";
import express, { Express } from "express";
import routes from "./routes/index";
import cors from "cors";

const app: Express = express();

// Middleware de segurança e CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

// Middleware condicional para Stripe webhook (raw body)
app.use((req: any, res, next) => {
  if (typeof req.originalUrl === "string" && req.originalUrl.includes("/stripe/webhook")) {
    let data = Buffer.alloc(0);
    req.on("data", (chunk: Buffer) => {
      data = Buffer.concat([data, chunk]);
    });
    req.on("end", () => {
      req.rawBody = data;
      next();
    });
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Health check endpoint para Vercel
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Swagger UI (OpenAPI)
setupSwagger(app);

// Rotas da API
routes(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: true, 
    message: "Rota não encontrada",
    path: req.path 
  });
});

// Error handler global
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Erro não tratado:", err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

export default app;
