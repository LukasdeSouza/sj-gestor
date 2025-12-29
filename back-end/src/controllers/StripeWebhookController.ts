import { Request, Response } from "express";
import stripeClient from "../integrations/stripe/client";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";
import { SubscriptionStatus } from "@prisma/client";

export default class StripeWebhookController {
  static async handle(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;

    if (!webhookSecret) return res.status(500).send("Webhook secret ausente");

    let event: any;
    try {
      // req.body deve ser o raw body (ver app config se necessário)
      event = stripeClient.webhooks.constructEvent((req as any).rawBody || req.body, sig!, webhookSecret);
    } catch (err: any) {
      console.error("Stripe webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const sessionId = session.id as string;
      const planId = session.metadata?.planId as any;
      const userId = session.metadata?.userId as string | undefined;

      if (userId && session.payment_status === "paid") {
        await SubscriptionRepository.upsertByUser(userId, {
          planId,
          status: SubscriptionStatus.ACTIVE,
          mpPreferenceId: sessionId,
          mpPaymentId: String(session.payment_intent || ""),
          activatedAt: new Date(),
        });
        // Persistir refs específicas do Stripe para acessar o portal depois
        try {
          await SubscriptionRepository.updateStripeRefsByUser(userId, {
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : (session.customer && session.customer.id ? session.customer.id : null),
          });
        } catch {}
      }
    }

    // Atualizações/cancelamentos de assinatura (recorrência)
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any; // Stripe.Subscription
      const subId: string = sub.id;
      const status: string = sub.status; // trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired, paused

      // Mapeia para nosso enum existente
      let mapped: SubscriptionStatus = SubscriptionStatus.PENDING;
      if (status === "active" || status === "trialing") mapped = SubscriptionStatus.ACTIVE;
      if (status === "past_due" || status === "unpaid" || status === "canceled" || status === "paused") mapped = SubscriptionStatus.PENDING;

      await SubscriptionRepository.setStatusByReference(subId, mapped);
    }

    // Fatura falhou pagamento (para quem preferir controlar por invoices)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as any;
      const subId: string | undefined = invoice.subscription as string | undefined;
      if (subId) {
        await SubscriptionRepository.setStatusByReference(subId, SubscriptionStatus.PENDING);
      }
    }

    return res.json({ received: true });
  }
}
