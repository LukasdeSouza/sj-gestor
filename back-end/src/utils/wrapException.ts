import { Prisma } from "@prisma/client";
import { sendError } from "./messages";
import { ZodError } from "zod";

// Definição do erro personalizado da API
export class APIError extends Error {
  code: number;
  errors?: any[];

  constructor(message: string | ZodError | any[], code: number = 400, errors?: any[]) {
    if (message instanceof ZodError) {
      // Tratamento específico para ZodError
      const formatted = message.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      super("Erro de validação");
      errors = formatted;
    } else if (Array.isArray(message)) {
      // Caso já venha como lista de erros
      super("Erro de validação");
      errors = message;
    } else {
      // Erros comuns
      super(message);
    }

    this.code = code;
    this.errors = errors;

    // Corrige o protótipo
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Função para envolver a execução de funções assíncronas com tratamento de exceções
export const wrapException = (fn: Function) => {
  return async (req: any, res: any, next: Function): Promise<any> => {
    let tempoInicio: number | undefined;
    if (process.env.DEBUGLOG === "true") {
      tempoInicio = performance.now();
    }

    try {
      return await fn(req, res, next);
    } catch (err: any) {
      if (err instanceof APIError) {
        // Erro retornado da API personalizada
        return sendError(res, err.code, err.errors || err.message);
      } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
          case "P2000": // Violation of a numeric value out of range
            return sendError(res, 400, ["Valor numérico fora do intervalo permitido."]);
          case "P2001": // Record not found
            return sendError(res, 404, ["Registro não encontrado."]);
          case "P2002": // Unique constraint violation
            return sendError(res, 409, ["Violação de chave única."]);
          case "P2003": // Foreign key constraint violation
            return sendError(res, 400, ["Violação de chave estrangeira."]);
          case "P2025": // Record not found when trying to delete or update
            return sendError(res, 404, ["Registro não encontrado para exclusão ou atualização."]);
          default:
            return sendError(res, 500, [`Erro do Prisma: ${err.message}`]);
        }
      }

      // Outros erros do Prisma
      if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        return sendError(res, 500, ["Erro desconhecido no Prisma."]);
      }

      if (err instanceof Prisma.PrismaClientInitializationError) {
        return sendError(res, 500, ["Falha na inicialização do Prisma."]);
      }

      if (err instanceof Prisma.PrismaClientRustPanicError) {
        return sendError(res, 500, ["Ocorreu um erro crítico no Prisma."]);
      }

      // Erro desconhecido
      console.error("Erro não tratado:", err);
      return sendError(res, 500, [err.message || "Erro interno do servidor."]);
    } finally {
      if (process.env.DEBUGLOG === "true" && tempoInicio) {
        const millis = parseInt((performance.now() - tempoInicio).toString());
        console.log(`${millis} ms`);
      }
    }
  };
};