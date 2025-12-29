import { Request, Response, NextFunction } from "express";
import GroupService from "../services/GroupService";
import { TokenDecoded } from "../interfaces/Auth";
import { GROUP } from "../interfaces/Constants";
import { sendError } from "../utils/messages";
import { jwtDecode } from "jwt-decode";

export const verificarPermissao = (
  perm: string,
  acao: string | false = false,
  modificadores: Record<string, boolean> | false = false
) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      sendError(res, 403, "Token está faltando para autorização.");
      return;
    }

    const token = authorization.includes(" ") ? authorization.split(" ")[1] : authorization;
    const tokenDecoded = jwtDecode<TokenDecoded>(token);
    const groupName = (tokenDecoded as any)?.group?.name;
    const usuarioGrupos: string[] = groupName ? [groupName] : [GROUP.CLIENT];

    const ok = await GroupService.possuiPermissao(usuarioGrupos, perm, acao, modificadores);
    if (ok) {
      next();
      return;
    }

    sendError(res, 403, "Você não possui a permissão necessária.");
  } catch (err) {
    sendError(res, 500, "Erro ao verificar permissões.");
  }
};

export const checarPermissao = async (
  req: Request,
  perm: string,
  acao: string | false = false,
  modificadores: Record<string, boolean> | false = false
): Promise<boolean> => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return false;
  }

  const token = authorization.includes(" ") ? authorization.split(" ")[1] : authorization;
  const tokenDecoded = jwtDecode<TokenDecoded>(token);
  const groupName = (tokenDecoded as any)?.group?.name;
  const usuarioGrupos: string[] = groupName ? [groupName] : [GROUP.CLIENT];

  return GroupService.possuiPermissao(usuarioGrupos, perm, acao, modificadores);
};

export const verificarPermissaoOuProprioUsuario = (
  perm: string,
  acao: string | false = false,
  modificadores: Record<string, boolean> | false = false
) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      sendError(res, 403, "Token está faltando para autorização.");
      return;
    }

    const token = authorization.includes(" ") ? authorization.split(" ")[1] : authorization;
    const tokenDecoded = jwtDecode<TokenDecoded>(token);

    const idParam = (req.params as any)?.id;
    if (idParam && (tokenDecoded as any)?.id === idParam) {
      next();
      return;
    }

    const groupName = (tokenDecoded as any)?.group?.name;
    const usuarioGrupos: string[] = groupName ? [groupName] : [GROUP.CLIENT];

    const ok = await GroupService.possuiPermissao(usuarioGrupos, perm, acao, modificadores);
    if (ok) {
      next();
      return;
    }

    sendError(res, 403, "Você não possui a permissão necessária.");
  } catch (err) {
    sendError(res, 500, "Erro ao verificar permissões.");
  }
};

