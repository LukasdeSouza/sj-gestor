import app from "./src/app"; 
import "dotenv/config";

// Definir a porta
const port: number = Number(process.env.PORT) || 3020;

// Inicialização do servidor
const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

export default app;