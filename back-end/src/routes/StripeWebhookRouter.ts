import express from "express";
import StripeWebhookController from "../controllers/StripeWebhookController";

const router = express.Router();

// Stripe exige raw body para verificação; app deve preservar req.rawBody
router.post("/stripe/webhook", StripeWebhookController.handle);

export default router;

