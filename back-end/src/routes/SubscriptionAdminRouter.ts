import SubscriptionAdminController from "../controllers/SubscriptionAdminController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { verificarPermissao } from "../middlewares/permission";
import { wrapException } from "../utils/wrapException";
import { PERM, ACAO } from "../interfaces/Constants";
import express from "express";

const router = express.Router();

// ADMIN: obter assinatura do usuário
router.get(
  "/admin/users/:userId/subscription",
  AuthMiddleware,
  verificarPermissao(PERM.USER, ACAO.VER, { qualquer_dado: true }),
  wrapException(SubscriptionAdminController.get)
);

// ADMIN: ativar/reativar assinatura informando data de pagamento e opcional paymentId
router.post(
  "/admin/users/:userId/subscription/activate",
  AuthMiddleware,
  verificarPermissao(PERM.USER, ACAO.EDITAR, { qualquer_dado: true }),
  wrapException(SubscriptionAdminController.activate)
);

export default router;

