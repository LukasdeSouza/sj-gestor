import { Router } from "express";
import SubscriptionController from "../controllers/SubscriptionController";
import { AuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/subscription/me", AuthMiddleware, SubscriptionController.me);

export default router;

