import { SubscriptionRepository } from "../repositories/SubscriptionRepository";
import UserRepository from "../repositories/UserRepository";
import { findPlanById, PlanId } from "../config/plans";
import { SubscriptionStatus } from "@prisma/client";
import stripe from "../integrations/stripe/client";
import { Request, Response } from "express";

export default class CheckoutController {
  static async createPreference(req: Request, res: Response) {
    const { planId } = req.body as { planId: PlanId };
    const plan = findPlanById(planId);
    if (!plan) return res.status(400).json({ error: true, message: "Plano inválido" });

    const rawBaseUrl = (process.env.APP_URL as string) || (req.headers.origin as string) || (req.headers.referer as string) || "http://localhost:8080";

    const userId = (req as any).decodedToken?.id as string | undefined;

    try {
      // Plano gratuito: ativa sem checkout (não requer Stripe configurado)
      if (plan.price === 0) {
        if (!userId) {
          return res.status(401).json({ error: true, message: "Não autenticado" });
        }
        await SubscriptionRepository.upsertByUser(userId, {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          activatedAt: new Date(),
        });
        return res.json({ error: false, data: { url: null, sessionId: null, plan } });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: true, message: "Stripe não configurado" });
      }

      // Para planos pagos, usamos assinatura mensal por preços do Stripe, se configurados.
      const priceMap: Record<PlanId, string | undefined> = {
        FREE: undefined,
        PRO_100: process.env.STRIPE_PRICE_PRO_100,
        PRO_UNLIMITED: process.env.STRIPE_PRICE_PRO_UNLIMITED,
      };
      const mappedPrice = priceMap[plan.id];

      // Garante um customer no Stripe para este usuário (necessário para o Customer Portal)
      let stripeCustomerId: string | undefined;
      try {
        if (userId) {
          const existing = await SubscriptionRepository.getByUser(userId);
          if (existing?.stripe_customer_id) {
            stripeCustomerId = existing.stripe_customer_id;
          } else {
            const user = await UserRepository.findUser(userId);
            const created = await stripe.customers.create({
              email: user?.email || undefined,
              name: user?.name || undefined,
            });
            stripeCustomerId = created.id;
          }
        }
      } catch {}

      let session;
      if (mappedPrice) {
        // Assinatura recorrente
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [ { price: mappedPrice, quantity: 1 } ],
          success_url: `${rawBaseUrl}/#/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${rawBaseUrl}/#/assinatura/erro`,
          metadata: { planId: plan.id, userId: userId || "" },
          customer: stripeCustomerId,
        });
      } else {
        // Cobrança única (fallback se não houver price_id configurado)
        session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          currency: "brl",
          line_items: [
            {
              price_data: {
                currency: "brl",
                product_data: { name: `Assinatura ${plan.name}` },
                unit_amount: Math.round(Number(plan.price) * 100),
              },
              quantity: 1,
            },
          ],
          success_url: `${rawBaseUrl}/#/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${rawBaseUrl}/#/assinatura/erro`,
          metadata: { planId: plan.id, userId: userId || "" },
          customer: stripeCustomerId,
          payment_intent_data: { setup_future_usage: 'off_session' },
        });
      }

      const sessionId = session.id;
      const url = session.url;

      if (userId) {
        const subId = (session as any).subscription as string | undefined;
        await SubscriptionRepository.upsertByUser(userId, {
          planId: plan.id,
          status: SubscriptionStatus.PENDING,
          mpPreferenceId: subId || sessionId,
        } as any);
        // Persistir stripe ids quando possível
        try { await SubscriptionRepository.updateStripeRefsByUser(userId, { stripe_subscription_id: subId || null, stripe_customer_id: stripeCustomerId || (typeof (session as any).customer === 'string' ? (session as any).customer : null) }); } catch {}
      }

      return res.json({ error: false, data: { sessionId, url, plan } });
    } catch (err: any) {
      const causeMsg = err?.message || JSON.stringify(err || {});
      console.log("ERR ", err)
      console.error("Erro Stripe session:", causeMsg);
      return res.status(500).json({ error: true, message: `Falha ao criar sessão de pagamento` });
    }
  }

  static async finalize(req: Request, res: Response) {
    try {
      const userId = (req as any).decodedToken?.id as string | undefined;
      if (!userId) return res.status(401).json({ error: true, message: "Não autenticado" });

      const sessionId = String((req.body?.session_id || req.query?.session_id) ?? "");
      if (!sessionId) return res.status(400).json({ error: true, message: "session_id ausente" });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const planId = (session.metadata?.planId as PlanId | undefined) || undefined;
      const metaUserId = session.metadata?.userId as string | undefined;
      if (!planId) return res.status(400).json({ error: true, message: "Sessão sem plano" });
      if (metaUserId && metaUserId !== userId) return res.status(403).json({ error: true, message: "Sessão não pertence ao usuário" });

      if (session.mode === 'subscription') {
        const subId = session.subscription as string | undefined;
        if (subId) {
          await SubscriptionRepository.upsertByUser(userId, {
            planId: planId as any,
            status: SubscriptionStatus.ACTIVE,
            mpPreferenceId: subId,
            activatedAt: new Date(),
          });
          try { await SubscriptionRepository.updateStripeRefsByUser(userId, { stripe_subscription_id: subId, stripe_customer_id: (typeof session.customer === 'string' ? session.customer : null) }); } catch {}
          return res.json({ error: false, data: { status: 'ACTIVE', planId } });
        }
      } else {
        const paymentStatus = session.payment_status;
        if (paymentStatus === "paid") {
          await SubscriptionRepository.upsertByUser(userId, {
            planId: planId as any,
            status: SubscriptionStatus.ACTIVE,
            mpPaymentId: String(session.payment_intent || ""),
            activatedAt: new Date(),
          });
          try { await SubscriptionRepository.updateStripeRefsByUser(userId, { stripe_payment_intent_id: String(session.payment_intent || ""), stripe_customer_id: (typeof session.customer === 'string' ? session.customer : null) }); } catch {}
          return res.json({ error: false, data: { status: 'ACTIVE', planId } });
        }
        return res.json({ error: false, data: { status: paymentStatus, planId } });
      }

      return res.json({ error: false, data: { status: 'PENDING', planId } });
    } catch (err: any) {
      console.error("[CheckoutFinalize] erro:", err?.message || err);
      return res.status(500).json({ error: true, message: "Falha ao validar pagamento" });
    }
  }
}
