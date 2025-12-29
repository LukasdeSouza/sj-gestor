import AuthService from "../../src/services/AuthService";
import AuthRepository from "../../src/repositories/AuthRepository";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

jest.mock("../../src/repositories/AuthRepository", () => ({
  __esModule: true,
  default: {
    findUserByEmail: jest.fn(),
    register: jest.fn(),
  },
}));

describe("AuthService.login", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = "secret";
    process.env.JWT_EXPIREIN = "1h";
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("falha com email inválido", async () => {
    await expect(AuthService.login({ email: "x", password: "123" } as any)).rejects.toBeTruthy();
  });

  it("falha quando usuário não existe", async () => {
    (AuthRepository.findUserByEmail as any).mockResolvedValue(null);
    await expect(AuthService.login({ email: "a@b.com", password: "123" } as any)).rejects.toBeTruthy();
  });

  it("retorna token quando credenciais corretas", async () => {
    const user = { id: "u1", name: "Alice", email: "a@b.com", password: bcrypt.hashSync("123") };
    (AuthRepository.findUserByEmail as any).mockResolvedValue(user);
    const out = await AuthService.login({ email: "a@b.com", password: "123" } as any);
    expect(out.token).toBeTruthy();
    expect(out.user.id).toBe("u1");
  });
});

describe("AuthService.register", () => {
  it("valida dados e chama repository", async () => {
    (AuthRepository.register as any).mockResolvedValue({ id: "u1" });
    const out = await AuthService.register({ email: "user@mail.com", name: "User Test", password: "12345678" } as any);
    expect(AuthRepository.register).toHaveBeenCalled();
    expect(out.id).toBe("u1");
  });
});
