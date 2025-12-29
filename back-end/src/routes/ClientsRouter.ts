import ClientController from "../controllers/ClientController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { verificarPermissao } from "../middlewares/permission";
import { wrapException } from "../utils/wrapException";
import { ACAO, PERM } from "../interfaces/Constants";
import express from "express";

const router = express.Router();

router
  .get("/clients", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.VER),
    wrapException(ClientController.listClients))
  .post("/clients", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.CRIAR),
    wrapException(ClientController.createClient))
  .patch("/clients/:id", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.EDITAR),
    wrapException(ClientController.alterClient))
  .delete("/clients/:id", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.DELETAR),
    wrapException(ClientController.deleteClient))
  .get("/clients/:id", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.VER),
    wrapException(ClientController.findClient));

export default router;
