export const webhookRoutes = {
  "/mercadopago": {
    post: {
      summary: "Webhook de pagamento do Mercado Pago (server-to-server)",
      tags: ["Webhooks"],
      security: [],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                type: { type: "string", example: "payment" },
                action: { type: "string", example: "payment.updated" },
                live_mode: { type: "boolean" },
                data: { type: "object", properties: { id: { type: "string", description: "payment_id" } } },
                user_id: { type: "integer" },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Aceito (idempotente)" } },
    },
    get: {
      summary: "Ping/validação de webhook do Mercado Pago (sandbox)",
      tags: ["Webhooks"],
      security: [],
      parameters: [
        { in: "query", name: "type", schema: { type: "string", example: "payment" } },
        { in: "query", name: "data.id", schema: { type: "string", example: "1234567890" } },
      ],
      responses: { 200: { description: "OK" } },
    },
  },
} as const;
