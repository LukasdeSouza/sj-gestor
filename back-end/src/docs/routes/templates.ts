export const templatesRoutes = {
  "/message_templates": {
    get: {
      summary: "Lista templates de mensagem com paginação e busca",
      tags: ["Message Templates"],
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: "query", name: "page", schema: { type: "integer", default: 1, minimum: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
        { in: "query", name: "name", schema: { type: "string" } },
      ],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" } },
    },
    post: {
      summary: "Cria um template de mensagem",
      tags: ["Message Templates"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "content"],
              properties: { name: { type: "string" }, content: { type: "string" } },
            },
          },
        },
      },
      responses: { 200: { description: "Criado" }, 401: { description: "Não autenticado" } },
    },
  },
  "/message_templates/{id}": {
    get: {
      summary: "Busca um template por ID",
      tags: ["Message Templates"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    patch: {
      summary: "Altera um template de mensagem",
      tags: ["Message Templates"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", properties: { name: { type: "string" }, content: { type: "string" } } },
          },
        },
      },
      responses: { 200: { description: "Alterado" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    delete: {
      summary: "Remove um template de mensagem",
      tags: ["Message Templates"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Removido" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
  },
} as const;

