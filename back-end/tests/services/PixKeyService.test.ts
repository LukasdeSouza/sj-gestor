import PixKeyService from "../../src/services/PixKeyService";
import PixKeyRepository from "../../src/repositories/PixKeyRepository";
import { randomUUID } from "crypto";

jest.mock("../../src/repositories/PixKeyRepository");

describe("PixKeyService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("listPixKeys aplica paginação e busca em key_value/label/key_type", async () => {
    (PixKeyRepository.listPixKeys as any).mockResolvedValue({ resultados: [], pagina: 1, totalPaginas: 1, limite: 10, total: 0 });
    const result = await PixKeyService.listPixKeys({ page: 1, limit: 10, user_id: randomUUID(), name: "pix" });
    expect(PixKeyRepository.listPixKeys).toHaveBeenCalled();
    expect(result.pagina).toBe(1);
  });

  it("createPixKey valida e cria", async () => {
    (PixKeyRepository.createPixKey as any).mockResolvedValue({ id: "k1" });
    const payload = { key_type: "EMAIL", key_value: "t@t.com", label: "Principal", user_id: randomUUID() };
    const result = await PixKeyService.createPixKey(payload as any);
    expect(result.id).toBe("k1");
  });

  it("alterPixKey valida e atualiza", async () => {
    (PixKeyRepository.alterPixKey as any).mockResolvedValue({ id: "k2", label: "Sec" });
    const result = await PixKeyService.alterPixKey("k2", {
      key_type: "EMAIL",
      key_value: "sec@t.com",
      user_id: randomUUID(),
      label: "Sec",
    } as any);
    expect(result.label).toBe("Sec");
  });

  it("deletePixKey remove", async () => {
    (PixKeyRepository.deletePixKey as any).mockResolvedValue({ id: "k3" });
    const result = await PixKeyService.deletePixKey("k3");
    expect(result).toMatchObject({ id: "k3" });
  });

  it("findPixKey retorna ou 404", async () => {
    (PixKeyRepository.findPixKey as any).mockResolvedValueOnce({ id: "k4" });
    const ok = await PixKeyService.findPixKey("k4");
    expect(ok?.id).toBe("k4");

    (PixKeyRepository.findPixKey as any).mockResolvedValueOnce(null);
    await expect(PixKeyService.findPixKey("k404")).rejects.toThrow();
  });
});
