import setupSwagger from "./docs/config/index";
import express, { Express } from "express";
import routes from "./routes/index";
import cors from "cors";

const app: Express = express();

// Conectar ao banco de dados
// db.conectarBanco();

// Middleware e rotas
app.use(cors());
// Stripe webhook precisa de raw body para validação da assinatura.
// Usamos um middleware condicional para /stripe/webhook.
app.use((req: any, res, next) => {
  // Suporta prefixos (ex.: /api/stripe/webhook) em produção
  if (typeof req.originalUrl === "string" && req.originalUrl.endsWith("/stripe/webhook")) {
    let data = Buffer.alloc(0);
    req.on("data", (chunk: Buffer) => {
      data = Buffer.concat([data, chunk]);
    });
    req.on("end", () => {
      req.rawBody = data;
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: false }));

// Swagger UI (OpenAPI)
setupSwagger(app);

routes(app);

export default app;
