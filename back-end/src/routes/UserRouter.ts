import { AuthMiddleware } from "../middlewares/authMiddleware";
import { verificarPermissao } from "../middlewares/permission";
import UserController from "../controllers/UserController";
import { wrapException } from "../utils/wrapException";
import { PERM, ACAO } from "../interfaces/Constants";
import express from "express";

const router = express.Router();

router
  .get("/users", AuthMiddleware, wrapException(UserController.listUsers))
  .post("/users", AuthMiddleware, verificarPermissao(PERM.USER, ACAO.EDITAR, { qualquer_dado: true }),
    wrapException(UserController.createUser))
  .patch("/users/:id", AuthMiddleware, verificarPermissao(PERM.USER, ACAO.EDITAR, { qualquer_dado: true }),
    wrapException(UserController.alterUser))
  .delete("/users/:id", AuthMiddleware, verificarPermissao(PERM.USER, ACAO.DELETAR, { qualquer_dado: true }),
    wrapException(UserController.deleteUser))
  .post("/users/:id/promote-admin", AuthMiddleware,
    wrapException(UserController.promoteToAdmin))
  .get("/users/:id", AuthMiddleware, wrapException(UserController.findUser));

export default router;
