import ClientPaymentController from "../controllers/ClientPaymentController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { verificarPermissao } from "../middlewares/permission";
import { wrapException } from "../utils/wrapException";
import { ACAO, PERM } from "../interfaces/Constants";
import express from "express";

const router = express.Router();

router
  .get("/clients/:id/payments", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.VER),
    wrapException(ClientPaymentController.list))
  .post("/clients/:id/payments", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.EDITAR),
    wrapException(ClientPaymentController.create))
  .delete("/clients/payments/:id", AuthMiddleware, verificarPermissao(PERM.CLIENT, ACAO.DELETAR),
    wrapException(ClientPaymentController.delete));

export default router;

