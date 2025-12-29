// import mongoose from "mongoose";
import { ZodIssueCode, z } from "zod";
//import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

export const myZ = {
  // toMongooseId: () => z.string()
  //     .refine((id) => mongoose.Types.ObjectId.isValid(id), "Id em formato inválido")
  //     .transform((id) => new mongoose.Types.ObjectId(id)),

  strToInt: () =>
    z
      .string()
      .regex(/^-?[0-9]+$/, "Número inteiro inválido")
      .transform((str) => parseInt(str, 10)),

  // Input de data que precisa de hora
  toDateTime: () =>
    z
      .string()
      .regex(/^\d{4}\-\d{2}\-\d{2}T(\d{2}\:\d{2})$/, "Data inválida")
      .transform((str) => new Date(str).toISOString()),

  toUTCDateTime: () =>
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/, "Data inválida.")
      .transform((str) => new Date(str).toISOString()),

  // Input de data que precisa de hora e é de filtro
  toDateTimeFilter: () =>
    z.preprocess(
      (str) => (str ? str : undefined),
      z
        .string()
        .regex(/^\d{4}\-\d{2}\-\d{2}T(\d{2}\:\d{2})$/, "Data inválida")
        .transform((str) => (str ? new Date(str).toISOString() : undefined))
        .optional(),
    ),

  // Input de data que não precisa de hora
  toUTCDate: () => z.string().regex(/\d{4}\-\d{2}\-\d{2}/, "Data inválida"),

  // Input de data que não precisa de hora e é de filtro
  toUTCDateFilter: () =>
    z.preprocess(
      (str) => (str ? str : undefined),
      z
        .string()
        .regex(/\d{4}\-\d{2}\-\d{2}/, "Data inválida")
        .optional(),
    ),

  strToBoolean: () =>
    z
      .string()
      .refine((str) => str === "true" || str === "false", "Valor booleano inválido")
      .transform((str) => str === "true"),

  parseBoolean: (value: string) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },

  // CPF: () => z.string()
  //     .refine((cpf) => isCPF(cpf), "CPF inválido"),

  // CNPJ: () => z.string()
  //     .refine((cnpj) => isCNPJ(cnpj), "CNPJ inválido"),

  // CNH: () => z.string()
  //     .refine((cnh) => isCNH(cnh), "CNH inválida"),

  CEP: () => z.string().regex(/^\d{8}$/, "CEP inválido"),
};

// export const commonZodSchemas = {
//   getPorId: () =>
//     z.object({
//       id: myZ.toMongooseId(),
//     }),
// };

export const getPorIdSchema = (schema: any) => z.object({
  data: schema,
  error: z.boolean(),
  message: z.string()
})

function traduzirNomeTipo(tipo: string) {
  switch (tipo) {
    case "string":
      return "texto";
    case "nan":
      return "número inválido";
    case "number":
      return "número";
    case "integer":
      return "inteiro";
    case "float":
      return "número com casas decimais";
    case "boolean":
      return "verdadeiro ou falso";
    case "date":
      return "data";
    case "bigint":
      return "número grande";
    case "symbol":
      return "símbolo";
    case "function":
      return "função";
    case "undefined":
      return "nada";
    case "null":
      return "nulo";
    case "array":
      return "array";
    case "object":
      return "objeto";
    case "unknown":
      return "desconhecido";
    case "promise":
      return "promessa";
    case "void":
      return "vazio";
    case "never":
      return "nunca";
    case "map":
      return "mapa";
    case "set":
      return "conjunto";
    default:
      return tipo;
  }
}

/**
 *
 * @param {ZodIssueOptionalMessage} issue
 */
export const traduzirMensagemZod = (issue: z.IssueData) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return "Este campo é obrigatório";
      }
      return `Tipo inválido, deveria ser ${traduzirNomeTipo(issue.expected)} mas recebeu ${traduzirNomeTipo(issue.received)}`;
    case ZodIssueCode.invalid_literal:
      return `Literal inválido, deveria ser ${issue.expected}`;
    case ZodIssueCode.custom:
      return `Erro Desconhecido: ${JSON.stringify(issue.params)}`;
    case ZodIssueCode.invalid_union:
      return `Não é nenhuma das ${issue.unionErrors.length} possibilidades de forma válida`;
    case ZodIssueCode.invalid_union_discriminator:
      return `Deveria ser um desses: ${issue.options?.join(", ")}`;
    case ZodIssueCode.invalid_enum_value:
      return `Deve ser um desses: ${issue.options?.join(", ")}`;
    case ZodIssueCode.unrecognized_keys:
      return `Não esperava estas chaves: ${issue.keys?.join(", ")}`;
    case ZodIssueCode.invalid_arguments:
      return `Argumentos inválidos: ${issue.argumentsError.message}`;
    case ZodIssueCode.invalid_return_type:
      return `Tipo de retorno inválido ${issue.returnTypeError.message}`;
    case ZodIssueCode.invalid_date:
      return "Formato de data inválido.";
    case ZodIssueCode.invalid_string:
      return `Formato de texto inválido, ${issue.validation}`;
    case ZodIssueCode.too_small:
      if (issue.type === "number" || issue.type === "bigint") return `Deve ser no mínimo ${issue.minimum}`;
      else if (issue.type === "string")
        if (issue.minimum === 1) {
          return `Campo obrigatório`;
        } else {
          return `Deve ter no mínimo ${issue.minimum} caracteres`;
        }
      else if (issue.type === "date") return `Deve ser após ${new Date(Number(issue.minimum)).toLocaleDateString()}`;
      else return `Deve ter no mínimo ${issue.minimum} elementos`;
    case ZodIssueCode.too_big:
      if (issue.type === "number" || issue.type === "bigint") return `Deve ser no máximo ${issue.maximum}`;
      else if (issue.type === "string") return `Deve ter no máximo ${issue.maximum} caracteres`;
      else if (issue.type === "date")
        return `Deve ser antes de ${new Date(Number(issue.maximum)).toLocaleDateString()}`;
      else return `Deve ter no máximo ${issue.maximum} elementos`;
    case ZodIssueCode.invalid_intersection_types:
      return "Tipos de interseção inválidos";
    case ZodIssueCode.not_multiple_of:
      return `O valor não é múltiplo de ${issue.multipleOf}`;
    case ZodIssueCode.not_finite:
      return "O valor não é finito";
    default:
      return issue ?? `Erro Desconhecido: ${JSON.stringify(issue)}`;
  }
};

// https://zod.dev/ERROR_HANDLING
export const applyZodInitialConfig = () => {
  //extendZodWithOpenApi(z);

  z.setErrorMap((issue) => {
    return {
      message: traduzirMensagemZod(issue),
    };
  });
};