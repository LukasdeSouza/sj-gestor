export const authRoutes = {
  "/auth/login": {
    post: {
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/AuthLogin" } },
        },
      },
      responses: {
        200: {
          description: "Login success",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  user: { $ref: "#/components/schemas/UserView" },
                },
              },
            },
          },
        },
        422: { description: "Validation error" },
        401: { description: "Invalid credentials" },
      },
    },
  },
  "/register": {
    post: {
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegister" } } },
      },
      responses: { 201: { description: "User registered" }, 422: { description: "Validation error" } },
    },
  },
} as const;

