import { Router } from "express";
import WebhookController from "../controllers/WebhookController";

const router = Router();

// Mercado Pago Webhook (aceita POST e GET para pings/sandbox)
router.post("/mercadopago", WebhookController.mercadopago);
router.get("/mercadopago", WebhookController.mercadopago);

export default router;
