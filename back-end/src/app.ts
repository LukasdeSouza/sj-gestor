// import setupSwagger from "./docs/config/index";
import express, { Express } from "express";
import routes from "./routes/index";
import cors from "cors";
import bodyParser from "body-parser";

const app: Express = express();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Swagger UI (OpenAPI)
// setupSwagger(app);

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
app.use((err: any, req:any, res:any, next: any) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handler para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Export para Vercel (serverless)
export default app;

const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  const PORT = process.env.PORT || 3020;
  app.listen(PORT, () => {
    console.log(
      `API PARA GESTÃO DE COBRANÇAS SJ-GESTOR :${PORT}`
    );
  });
}
