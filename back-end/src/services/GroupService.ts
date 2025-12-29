import GroupRepository from "../repositories/GroupRepository";
import { ListGroupParams } from "../interfaces/group";
import { ACAO, GROUP } from "../interfaces/Constants";
import { TokenDecoded } from "../interfaces/Auth";
import { jwtDecode } from "jwt-decode";
import { Request } from "express";

type Modifiers = Record<string, boolean> | false;

/**
 * Configuração local de grupos (in-memory)
 */
export const grupos: Record<string, any> = {
  [GROUP.CLIENT]: {
    nivel: 0,
    visivel: true,
    permissoes: {
      DASHBOARD: [{ nome: ACAO.VER }],
      CLIENT: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
      PRODUCT: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
      PIX_KEY: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
      TEMPLATE: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
    },
  },

  [GROUP.ADMIN]: {
    nivel: 1,
    visivel: true,
    permissoes: {
      DASHBOARD: [{ nome: ACAO.VER }],
      GROUP: [
        { nome: ACAO.VER },
      ],
      USER: [
        { nome: ACAO.VER, qualquer_dado: true },
        { nome: ACAO.CRIAR, qualquer_dado: true },
        { nome: ACAO.EDITAR, qualquer_dado: true },
        { nome: ACAO.DELETAR, qualquer_dado: true },
      ],
      CLIENT: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
      PRODUCT: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
      PIX_KEY: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
      TEMPLATE: [
        { nome: ACAO.VER },
        { nome: ACAO.CRIAR },
        { nome: ACAO.EDITAR },
        { nome: ACAO.DELETAR },
      ],
    },
  },
};

export default class GroupService {

  static async listGroup(
    params: ListGroupParams
  ) {
    // Construir os filtros
    const { pagina, limite, nome } = params as any;

    const where: Record<string, any> = {};
    if (nome) {
      where.nome = { contains: nome, mode: "insensitive" };
    }

    // Chamar o repositório com as opções de paginação
    return await (GroupRepository as any).listGroup(where, {
      page: pagina,
      limit: limite,
      customLabels: {
        totalDocs: "resultados",
        docs: "groups",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });
  }

  /**
   * Verifica se o usuário possui determinada permissão
   */
  static possuiPermissao(
    usuarioGrupos: string[],
    qualPermissao: string,
    qualAcao: string | false = false,
    modificadores: Modifiers = false
  ): boolean {
    if (process.env.DISABLE_PERMISSION === "true") return true;

    for (const grupoNome of usuarioGrupos) {
      const grupo = grupos[grupoNome];
      if (!grupo) continue;

      const permissoes = grupo.permissoes?.[qualPermissao];
      if (!Array.isArray(permissoes)) continue;

      for (const acaoDef of permissoes) {
        if (qualAcao !== false && acaoDef.nome !== qualAcao) continue;

        if (modificadores) {
          const ok = Object.entries(modificadores).every(([k, v]) => {
            if (!v) return true;
            return acaoDef[k] === true;
          });
          if (!ok) continue;
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Verifica permissão considerando recurso específico
   */
  static async possuiPermissaoRecurso(
    req: Request,
    nomeRecurso: string,
    usuarioRecurso: any,
    qualPermissao: string,
    qualAcao: string | false = false,
    idRecursoAlvo: string | any[] | null = null
  ): Promise<boolean | string> {
    let permissaoRecursoEspecifico: any;

    if (idRecursoAlvo) {
      type Entrada = string | { id: string };
      const entradas: Entrada[] = Array.isArray(idRecursoAlvo)
        ? idRecursoAlvo
        : [idRecursoAlvo];

      for (const entrada of entradas) {
        const id =
          typeof entrada === "string"
            ? entrada
            : (entrada as { id: string })?.id;

        const resultado = await GroupService.recursoEspecifico(
          req,
          nomeRecurso,
          id
        );

        if (resultado === false) {
          permissaoRecursoEspecifico = false;
          break;
        }

        permissaoRecursoEspecifico = resultado;
      }

      if (permissaoRecursoEspecifico === false) return false;
    }

    if (usuarioRecurso || permissaoRecursoEspecifico) {
      const permissaoUsuario =
        GroupService.possuiPermissaoQualquerUsuario(
          req,
          usuarioRecurso,
          qualPermissao,
          qualAcao
        );

      if (!permissaoUsuario) {
        return `Você não tem permissão para manipular um ${nomeRecurso} que não é seu`;
      }
    }

    return false;
  }

  /**
   * Verifica se o usuário pode acessar dados de qualquer usuário
   */
  static possuiPermissaoQualquerUsuario(
    req: Request,
    usuarioRecurso: any,
    qualPermissao: string,
    qualAcao: string | false = false
  ): boolean {
    const token = req.headers.authorization;
    if (!token) return false;

    const tokenDecoded = jwtDecode<TokenDecoded>(token);

    const mesmoUsuario =
      (usuarioRecurso?._id ?? usuarioRecurso)?.toString() ===
      tokenDecoded.id;

    const podeQualquerUsuario = GroupService.possuiPermissao(
      (tokenDecoded as any)?.group?.name
        ? [(tokenDecoded as any).group.name]
        : [GROUP.CLIENT],
      qualPermissao,
      qualAcao,
      { qualquer_dado: true }
    );

    return mesmoUsuario || podeQualquerUsuario;
  }

  /**
   * Regra de recurso específico (placeholder)
   */
  static async recursoEspecifico(
    req: Request,
    nomeRecurso: string,
    idRecurso: string | null = null
  ): Promise<boolean | string> {
    const token = req.headers.authorization;
    if (!token) return "Token de autenticação não fornecido";

    // Sem regra específica → não bloqueia
    return false;
  }
}
