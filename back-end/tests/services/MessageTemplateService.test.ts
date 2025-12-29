import MessageTemplateService from "../../src/services/MessageTemplateService";
import MessageTemplateRepository from "../../src/repositories/MessageTemplateRepository";
import { randomUUID } from "crypto";

jest.mock("../../src/repositories/MessageTemplateRepository");

describe("MessageTemplateService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("listMessageTemplates aplica paginação e busca por nome/conteúdo", async () => {
    (MessageTemplateRepository.listMessageTemplates as any).mockResolvedValue({ resultados: [], pagina: 1, totalPaginas: 1, limite: 10, total: 0 });
    const result = await MessageTemplateService.listMessageTemplates({ page: 1, limit: 10, user_id: randomUUID(), name: "cob" });
    expect(MessageTemplateRepository.listMessageTemplates).toHaveBeenCalled();
    expect(result.pagina).toBe(1);
  });

  it("createMessageTemplates valida e cria", async () => {
    (MessageTemplateRepository.createMessageTemplates as any).mockResolvedValue({ id: "t1" });
    const payload = { name: "Aviso", content: "texto...", user_id: randomUUID() };
    const result = await MessageTemplateService.createMessageTemplates(payload as any);
    expect(result.id).toBe("t1");
  });

  it("alterMessageTemplates valida e atualiza", async () => {
    (MessageTemplateRepository.alterMessageTemplates as any).mockResolvedValue({ id: "t2", name: "Novo" });
    const result = await MessageTemplateService.alterMessageTemplates("t2", {
      name: "Novo",
      content: "texto...",
      user_id: randomUUID(),
    } as any);
    expect(result.name).toBe("Novo");
  });

  it("deleteMessageTemplates remove", async () => {
    (MessageTemplateRepository.deleteMessageTemplates as any).mockResolvedValue({ id: "t3" });
    const result = await MessageTemplateService.deleteMessageTemplates("t3");
    expect(result).toMatchObject({ id: "t3" });
  });

  it("findMessageTemplates retorna ou 404", async () => {
    (MessageTemplateRepository.findMessageTemplates as any).mockResolvedValueOnce({ id: "t4" });
    const ok = await MessageTemplateService.findMessageTemplates("t4");
    expect(ok?.id).toBe("t4");

    (MessageTemplateRepository.findMessageTemplates as any).mockResolvedValueOnce(null);
    await expect(MessageTemplateService.findMessageTemplates("t404")).rejects.toThrow();
  });
});
