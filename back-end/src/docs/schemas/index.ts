export const schemas = {
  PlanId: {
    type: "string",
    enum: ["FREE", "PRO_100", "PRO_UNLIMITED"],
  },
  Plan: {
    type: "object",
    properties: {
      id: { $ref: "#/components/schemas/PlanId" },
      name: { type: "string" },
      price: { type: "number" },
      clientLimit: { type: ["integer", "null"] },
      description: { type: "string" },
    },
  },
  Client: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      phone: { type: "string" },
      due_date: { type: ["integer", "null"] },
    },
  },
  PixKeyType: {
    type: "string",
    enum: ["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"],
  },
  PixKey: {
    type: "object",
    properties: {
      id: { type: "string" },
      key_type: { $ref: "#/components/schemas/PixKeyType" },
      key_value: { type: "string" },
    },
  },
  Charge: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      product_id: { type: "string" },
      template_id: { type: "string" },
      key_id: { type: "string" },
    },
  },
  Product: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      value: { type: "number" },
    },
  },
  MessageTemplate: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      content: { type: "string" },
    },
  },
} as const;
