import request from "supertest";
import app from "../../src/app";
import MessageTemplateService from "../../src/services/MessageTemplateService";
import jwt from "jsonwebtoken";

jest.mock("../../src/services/MessageTemplateService");

describe("MessageTemplateController", () => {
  let bearer: string;

  beforeAll(() => {
    const secret = process.env.JWT_SECRET || "test-secret";
    const token = jwt.sign({ id: "u1", name: "Tester", email: "t@t.com" }, secret, { expiresIn: "1h" });
    bearer = `Bearer ${token}`;
  });

  beforeEach(() => jest.clearAllMocks());

  it("GET /message_templates retorna lista paginada", async () => {
    (MessageTemplateService.listMessageTemplates as any).mockResolvedValue({
      resultados: [{ id: "t1", name: "Cobranca" }],
      pagina: 1,
      totalPaginas: 1,
      limite: 10,
      total: 1,
    });

    const res = await request(app)
      .get("/message_templates?page=1&limit=10&name=cob")
      .set("Authorization", bearer);

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toHaveLength(1);
  });

  it("POST /message_templates cria um template", async () => {
    (MessageTemplateService.createMessageTemplates as any).mockResolvedValue({ id: "t2", name: "Aviso", content: "..." });

    const res = await request(app)
      .post("/message_templates")
      .set("Authorization", bearer)
      .send({ name: "Aviso", content: "...", user_id: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("t2");
  });

  it("GET /message_templates/:id retorna um template", async () => {
    (MessageTemplateService.findMessageTemplates as any).mockResolvedValue({ id: "t3", name: "Cobranca" });
    const res = await request(app)
      .get("/message_templates/t3")
      .set("Authorization", bearer);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("t3");
  });

  it("PATCH /message_templates/:id altera um template", async () => {
    (MessageTemplateService.alterMessageTemplates as any).mockResolvedValue({ id: "t4", name: "Atualizado" });
    const res = await request(app)
      .patch("/message_templates/t4")
      .set("Authorization", bearer)
      .send({ name: "Atualizado" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "t4", name: "Atualizado" });
  });

  it("DELETE /message_templates/:id remove um template", async () => {
    (MessageTemplateService.deleteMessageTemplates as any).mockResolvedValue({ id: "t5" });
    const res = await request(app)
      .delete("/message_templates/t5")
      .set("Authorization", bearer);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("t5");
  });
});

