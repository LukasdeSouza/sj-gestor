import app from "./src/app"; 
import "dotenv/config";

// Definir a porta
const port: number = Number(process.env.PORT) || 3020;

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});