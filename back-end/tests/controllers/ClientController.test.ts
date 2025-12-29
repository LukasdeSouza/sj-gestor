import request from "supertest";
import app from "../../src/app";
import jwt from "jsonwebtoken";
import ClientService from "../../src/services/ClientService";

jest.mock("../../src/services/ClientService");

describe("ClientController", () => {
  let bearer: string;

  beforeAll(() => {
    const secret = process.env.JWT_SECRET || "test-secret";
    // Gera um token válido para passar pelo AuthMiddleware
    const token = jwt.sign({ id: "test-user", name: "Tester", email: "t@t.com" }, secret, { expiresIn: "1h" });
    bearer = `Bearer ${token}`;
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /clients retorna lista paginada", async () => {
    (ClientService.listClients as any).mockResolvedValue({
      resultados: [{ id: "1", name: "Alice", phone: "6999" }],
      pagina: 1,
      totalPaginas: 1,
      limite: 10,
      total: 1,
    });

    const res = await request(app)
      .get("/clients?page=1&limit=10&name=Al")
      .set("Authorization", bearer);
    expect(res.status).toBe(200);
    expect(res.body.data.resultados.length).toBe(1);
  });

  it("POST /clients cria um cliente", async () => {
    (ClientService.createClient as any).mockResolvedValue({ id: "1", name: "Bob", phone: "6999" });
    const res = await request(app)
      .post("/clients")
      .set("Authorization", bearer)
      .send({ name: "Bob", phone: "69999999999" });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("1");
  });

  it("GET /clients/:id retorna um cliente", async () => {
    (ClientService.findClient as any).mockResolvedValue({ id: "123", name: "Carol", phone: "69998887777" });

    const res = await request(app)
      .get("/clients/123")
      .set("Authorization", bearer);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "123", name: "Carol" });
    expect(ClientService.findClient).toHaveBeenCalledWith("123");
  });

  it("PATCH /clients/:id altera um cliente", async () => {
    (ClientService.alterClient as any).mockResolvedValue({ id: "42", name: "Dave", phone: "69997776666" });

    const res = await request(app)
      .patch("/clients/42")
      .set("Authorization", bearer)
      .send({ name: "Dave" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "42", name: "Dave" });
    expect(ClientService.alterClient).toHaveBeenCalledWith("42", { name: "Dave" });
  });

  it("DELETE /clients/:id remove um cliente", async () => {
    (ClientService.deleteClient as any).mockResolvedValue({ id: "55" });

    const res = await request(app)
      .delete("/clients/55")
      .set("Authorization", bearer);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "55" });
    expect(ClientService.deleteClient).toHaveBeenCalledWith("55");
  });
});
