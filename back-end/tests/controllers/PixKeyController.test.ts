import request from "supertest";
import app from "../../src/app";
import PixKeyService from "../../src/services/PixKeyService";
import jwt from "jsonwebtoken";

jest.mock("../../src/services/PixKeyService");

describe("PixKeyController", () => {
  let bearer: string;

  beforeAll(() => {
    const secret = process.env.JWT_SECRET || "test-secret";
    const token = jwt.sign({ id: "u1", name: "Tester", email: "t@t.com" }, secret, { expiresIn: "1h" });
    bearer = `Bearer ${token}`;
  });

  beforeEach(() => jest.clearAllMocks());

  it("GET /pix_keys retorna lista paginada com busca", async () => {
    (PixKeyService.listPixKeys as any).mockResolvedValue({
      resultados: [{ id: "k1", key_value: "chave@pix.com" }],
      pagina: 1,
      totalPaginas: 1,
      limite: 10,
      total: 1,
    });

    const res = await request(app)
      .get("/pix_keys?page=1&limit=10&name=chave")
      .set("Authorization", bearer);

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toHaveLength(1);
  });

  it("POST /pix_keys cria uma chave", async () => {
    (PixKeyService.createPixKey as any).mockResolvedValue({ id: "k2", key_value: "teste@pix.com" });

    const payload = {
      key_type: "EMAIL",
      key_value: "teste@pix.com",
      label: "Principal",
      user_id: "11111111-1111-1111-1111-111111111111",
    };

    const res = await request(app)
      .post("/pix_keys")
      .set("Authorization", bearer)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("k2");
  });

  it("GET /pix_keys/:id retorna uma chave", async () => {
    (PixKeyService.findPixKey as any).mockResolvedValue({ id: "k3", key_value: "outra@pix.com" });

    const res = await request(app)
      .get("/pix_keys/k3")
      .set("Authorization", bearer);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("k3");
  });

  it("PATCH /pix_keys/:id altera uma chave", async () => {
    (PixKeyService.alterPixKey as any).mockResolvedValue({ id: "k4", label: "Secundária" });

    const res = await request(app)
      .patch("/pix_keys/k4")
      .set("Authorization", bearer)
      .send({ label: "Secundária" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "k4", label: "Secundária" });
  });

  it("DELETE /pix_keys/:id remove uma chave", async () => {
    (PixKeyService.deletePixKey as any).mockResolvedValue({ id: "k5" });

    const res = await request(app)
      .delete("/pix_keys/k5")
      .set("Authorization", bearer);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("k5");
  });
});

