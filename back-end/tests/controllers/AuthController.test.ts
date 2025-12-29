import request from "supertest";
import app from "../../src/app";
import AuthService from "../../src/services/AuthService";

jest.mock("../../src/services/AuthService");

describe("AuthController", () => {
  it("POST /auth/login retorna 200 e token", async () => {
    (AuthService.login as any).mockResolvedValue({ token: "jwt", user: { id: "u1" } });
    const res = await request(app).post("/auth/login").send({ email: "a@b.com", password: "123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe("jwt");
  });

  it("POST /register retorna 200 ao registrar", async () => {
    (AuthService.register as any).mockResolvedValue({ id: "u1" });
    const res = await request(app).post("/register").send({ email: "a@b.com", password: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("u1");
  });
});

