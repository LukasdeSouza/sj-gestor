import GroupController from "../controllers/GroupController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { verificarPermissao } from "../middlewares/permission";
import { wrapException } from "../utils/wrapException";
import { PERM, ACAO } from "../interfaces/Constants";
import express from "express";

const router = express.Router();

router.get(
  "/groups",
  AuthMiddleware,
  verificarPermissao(PERM.GROUP, ACAO.VER),
  wrapException(GroupController.listGroups)
);

export default router;

