
import swaggerUi from "swagger-ui-express";
import { Application } from "express";
import { schemas } from "../schemas";
import { clientsRoutes, chargesRoutes, pixKeysRoutes, checkoutRoutes, webhookRoutes } from "../routes";
import { productsRoutes } from "../routes/products";
import { templatesRoutes } from "../routes/templates";
import { authRoutes } from "../routes/auth";

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "AgendaPix API",
    version: "1.0.0",
    description: "Documentação da API do AgendaPix.",
  },
  servers: [{ url: process.env.APP_API_URL || "/", description: "Current server" }],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas,
  },
  security: [{ BearerAuth: [] }],
  paths: {
    ...authRoutes,
    ...clientsRoutes,
    ...chargesRoutes,
    ...pixKeysRoutes,
    ...productsRoutes,
    ...templatesRoutes,
    ...checkoutRoutes,
    ...webhookRoutes,
  },
} as const;

export function setupSwagger(app: Application) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec as any, { explorer: true }));
  app.get("/docs.json", (_req, res) => res.json(openapiSpec));
}

export default setupSwagger;
