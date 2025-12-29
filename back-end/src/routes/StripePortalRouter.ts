import { Router } from "express";
import StripePortalController from "../controllers/StripePortalController";
import { AuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/stripe/portal", AuthMiddleware, StripePortalController.createPortal);

export default router;

