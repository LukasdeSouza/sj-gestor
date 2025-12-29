export const checkoutRoutes = {
  "/plans": {
    get: {
      summary: "Lista os planos disponíveis",
      tags: ["Checkout"],
      security: [],
      responses: { 200: { description: "OK" } },
    },
  },
  "/preferences": {
    post: {
      summary: "Cria uma preferência de pagamento (Mercado Pago)",
      tags: ["Checkout"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["planId"],
              properties: { planId: { $ref: "#/components/schemas/PlanId" } },
            },
          },
        },
      },
      responses: { 200: { description: "Preferência criada" }, 401: { description: "Não autenticado" }, 500: { description: "Erro ao criar preferência" } },
    },
  },
  "/finalize": {
    get: {
      summary: "Finaliza assinatura após retorno do checkout",
      tags: ["Checkout"],
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: "query", name: "payment_id", schema: { type: "string" } },
        { in: "query", name: "collection_id", schema: { type: "string" } },
      ],
      responses: { 200: { description: "Status do pagamento/assinatura" }, 401: { description: "Não autenticado" }, 400: { description: "Requisição inválida" }, 500: { description: "Erro ao validar pagamento" } },
    },
  },
} as const;
