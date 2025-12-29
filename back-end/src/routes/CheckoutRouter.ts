import { Router } from "express";
import CheckoutController from "../controllers/CheckoutController";
import { AuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Preferências (alias em /preferences e /checkout/preferences)
router.post("/preferences", AuthMiddleware, CheckoutController.createPreference);
router.post("/checkout/preferences", AuthMiddleware, CheckoutController.createPreference);

// Finalização (alias em /finalize e /checkout/finalize)
router.get("/finalize", AuthMiddleware, CheckoutController.finalize);
router.post("/finalize", AuthMiddleware, CheckoutController.finalize);
router.get("/checkout/finalize", AuthMiddleware, CheckoutController.finalize);
router.post("/checkout/finalize", AuthMiddleware, CheckoutController.finalize);

export default router;
