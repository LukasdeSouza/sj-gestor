import ClientService from "../../src/services/ClientService";
import ClientRepository from "../../src/repositories/ClientRepository";

jest.mock("../../src/repositories/ClientRepository", () => ({
  __esModule: true,
  default: {
    listClients: jest.fn(),
    createClient: jest.fn(),
    alterClient: jest.fn(),
    deleteClient: jest.fn(),
    findClient: jest.fn(),
  },
}));

describe("ClientService", () => {
  it("lista clientes com filtro name", async () => {
    (ClientRepository.listClients as any).mockResolvedValue({
      resultados: [{ id: "1", name: "Alice", phone: "6999" }],
      pagina: 1,
      totalPaginas: 1,
      limite: 10,
      total: 1,
    });

    const res = await ClientService.listClients({ page: 1, limit: 10, user_id: "u1", name: "Al" } as any);
    expect(res.pagina).toBe(1);
    expect(ClientRepository.listClients).toHaveBeenCalled();
  });

  it("cria cliente com dados válidos", async () => {
    (ClientRepository.createClient as any).mockResolvedValue({ id: "1", name: "Bob", phone: "6999" });
    const res = await ClientService.createClient({ name: "Bob", phone: "69999999999", user_id: "u1", auto_billing: false } as any);
    expect(res.id).toBe("1");
  });

  it("altera cliente com dados válidos", async () => {
    (ClientRepository.alterClient as any).mockResolvedValue({ id: "1", name: "Bob 2", phone: "6999" });
    const res = await ClientService.alterClient("1", { name: "Bob 2" } as any);
    expect(res.name).toBe("Bob 2");
  });

  it("deleta cliente retorna objeto", async () => {
    (ClientRepository.deleteClient as any).mockResolvedValue({ id: "1" });
    const res = await ClientService.deleteClient("1");
    expect(res.id).toBe("1");
  });

  it("findClient lança 404 quando não existe", async () => {
    (ClientRepository.findClient as any).mockResolvedValue(null);
    await expect(ClientService.findClient("x")).rejects.toBeTruthy();
  });
});
