export const clientsRoutes = {
  "/clients": {
    get: {
      summary: "Lista clientes com paginação e busca",
      tags: ["Clients"],
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: "query", name: "page", schema: { type: "integer", default: 1, minimum: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
        { in: "query", name: "name", schema: { type: "string" }, description: "Filtro por nome (contains, case-insensitive)" },
      ],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" } },
    },
    post: {
      summary: "Cria um cliente",
      tags: ["Clients"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "phone"],
              properties: {
                name: { type: "string" },
                phone: { type: "string", description: "Telefone no formato brasileiro" },
                due_date: { type: ["integer", "null"] },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Criado" }, 401: { description: "Não autenticado" } },
    },
  },
  "/clients/{id}": {
    get: {
      summary: "Busca um cliente por ID",
      tags: ["Clients"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "OK" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    patch: {
      summary: "Altera um cliente",
      tags: ["Clients"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { name: { type: "string" }, phone: { type: "string" }, due_date: { type: ["integer", "null"] } },
            },
          },
        },
      },
      responses: { 200: { description: "Alterado" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
    delete: {
      summary: "Remove um cliente",
      tags: ["Clients"],
      security: [{ BearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Removido" }, 401: { description: "Não autenticado" }, 404: { description: "Não encontrado" } },
    },
  },
} as const;
