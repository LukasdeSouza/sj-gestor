import { Payment, mpClient } from "../integrations/mercadopago/client";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";
import { SubscriptionStatus } from "@prisma/client";
import { Request, Response } from "express";
import crypto from "crypto";

function verifySignature(req: Request): boolean {
  const signature = req.header("x-signature");
  const requestId = req.header("x-request-id");
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";

  if (!signature || !requestId || !secret) return false;

  const dataId =
    req.body?.data?.id ||
    req.query?.["data.id"];

  if (!dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return signature === hmac;
}

export default class WebhookController {
  static async mercadopago(req: Request, res: Response) {
    try {

      console.log("VAMO TESTA SE CAI AQUI NO WEBHOOK", req.body)

      const isTestEvent =
        req.body?.live_mode === false &&
        !req.header("x-signature");

      if (
        process.env.MERCADO_PAGO_WEBHOOK_SECRET &&
        !isTestEvent &&
        !verifySignature(req)
      ) {
        return res.status(401).json({ error: true });
      }

      const type =
        req.body?.type ||
        (req.body?.action?.startsWith("payment") ? "payment" : undefined);
      const dataId = req.body?.data?.id;

      if (type !== "payment" || !dataId) {
        return res.sendStatus(200);
      }

      let payment;
      try {
        const paymentClient = new Payment(mpClient);
        payment = await paymentClient.get({ id: String(dataId) });
      } catch {
        console.warn("[MP] payment inexistente:", dataId);
        return res.sendStatus(200);
      }

      const body: any = (payment as any).response || (payment as any).body;

      if (body.status !== "approved") {
        return res.sendStatus(200);
      }

      if (!body.preference_id) {
        console.warn("[MP] payment sem preference_id");
        return res.sendStatus(200);
      }

      await SubscriptionRepository.activateByPreference(
        body.preference_id,
        {
          mpPaymentId: String(body.id),
          activatedAt: new Date(),
          status: SubscriptionStatus.ACTIVE,
        }
      );

      return res.sendStatus(200);
    } catch (err) {
      console.error("[MP Webhook] erro:", err);
      return res.sendStatus(200); // webhook nunca deve quebrar
    }
  }
}
