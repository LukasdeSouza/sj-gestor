export const pixKeysRoutes = {
  "/pix_keys": {
    get: {
      summary: "Lista chaves PIX com paginação e busca",
      tags: ["Pix Keys"],
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: "query", name: "page", schema: { type: "integer", default: 1, minimum: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
        { in: "query", name: "name", schema: { type: "string" }, description: "Filtro por nome (quando aplicável)" },
      ],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" } },
    },
    post: {
      summary: "Cria uma chave PIX",
      tags: ["Pix Keys"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["key_type", "key_value"],
              properties: {
                key_type: { type: "string", enum: ["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"] },
                key_value: { type: "string" },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Criado" }, 401: { description: "Não autenticado" } },
    },
  },
  "/pix_keys/{id}": {
    get: {
      summary: "Busca uma chave PIX por ID",
      tags: ["Pix Keys"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    patch: {
      summary: "Altera uma chave PIX",
      tags: ["Pix Keys"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { key_type: { type: "string", enum: ["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"] }, key_value: { type: "string" } },
            },
          },
        },
      },
      responses: { 200: { description: "Alterado" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    delete: {
      summary: "Remove uma chave PIX",
      tags: ["Pix Keys"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Removido" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
  },
} as const;
