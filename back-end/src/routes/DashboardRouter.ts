import { Router } from "express";
import DashboardController from "../controllers/DashboardController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { verificarPermissao } from "../middlewares/permission";
import { wrapException } from "../utils/wrapException";
import { ACAO, PERM } from "../interfaces/Constants";

const router = Router();

router.get("/dashboard/summary", AuthMiddleware, verificarPermissao(PERM.DASHBOARD, ACAO.VER),
  wrapException(DashboardController.summary));
router.get("/dashboard/distribution", AuthMiddleware, verificarPermissao(PERM.DASHBOARD, ACAO.VER),
  wrapException(DashboardController.distribution));
router.get("/dashboard/top-products", AuthMiddleware, verificarPermissao(PERM.DASHBOARD, ACAO.VER),
  wrapException(DashboardController.topProducts));

export default router;
