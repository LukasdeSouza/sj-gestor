export const chargesRoutes = {
  "/charges": {
    get: {
      summary: "Lista cobranças com paginação e busca",
      tags: ["Charges"],
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: "query", name: "page", schema: { type: "integer", default: 1, minimum: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
        { in: "query", name: "name", schema: { type: "string" }, description: "Filtro por nome (contains, case-insensitive)" },
      ],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" } },
    },
    post: {
      summary: "Cria uma cobrança",
      tags: ["Charges"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "product_id", "template_id", "key_id"],
              properties: {
                name: { type: "string" },
                product_id: { type: "string" },
                template_id: { type: "string" },
                key_id: { type: "string" },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Criado" }, 401: { description: "Não autenticado" } },
    },
  },
  "/charges/{id}": {
    get: {
      summary: "Busca uma cobrança por ID",
      tags: ["Charges"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    patch: {
      summary: "Altera uma cobrança",
      tags: ["Charges"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { name: { type: "string" }, product_id: { type: "string" }, template_id: { type: "string" }, key_id: { type: "string" } },
            },
          },
        },
      },
      responses: { 200: { description: "Alterado" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    delete: {
      summary: "Remove uma cobrança",
      tags: ["Charges"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Removido" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
  },
} as const;
