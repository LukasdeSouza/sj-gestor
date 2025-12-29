import { Request, Response } from "express";
import stripe from "../integrations/stripe/client";
import { SubscriptionRepository } from "../repositories/SubscriptionRepository";
import UserRepository from "../repositories/UserRepository";

export default class StripePortalController {
  static async createPortal(req: Request, res: Response) {
    try {
      const userId = (req as any).decodedToken?.id as string | undefined;
      if (!userId) return res.status(401).json({ error: true, message: "Não autenticado" });
      if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: true, message: "Stripe não configurado" });

      const sub = await SubscriptionRepository.getByUser(userId);
      if (!sub) {
        return res.status(400).json({ error: true, message: "Nenhuma assinatura encontrada" });
      }

      // Em algumas execuções, mp_preference_id armazenou o ID da sessão de checkout (cs_*)
      // Em outras, pode armazenar o ID da assinatura (sub_*). mp_payment_id pode conter o payment_intent (pi_*).
      const ref = sub.stripe_subscription_id || sub.stripe_customer_id || sub.mp_preference_id || sub.mp_payment_id || undefined;
      let customerId = sub.stripe_customer_id || "";

      if (!ref) {
        return res.status(400).json({ error: true, message: "Referência de assinatura ausente" });
      }

      try {
        if (ref.startsWith("sub_")) {
          const subscription = await stripe.subscriptions.retrieve(ref);
          customerId = (subscription.customer as string) || "";
        } else if (ref.startsWith("cs_")) {
          // Recupera a sessão e tenta extrair a assinatura ou o cliente
          const session = await stripe.checkout.sessions.retrieve(ref);
          const subId = (session.subscription as string) || "";
          if (subId) {
            const subscription = await stripe.subscriptions.retrieve(subId);
            customerId = (subscription.customer as string) || "";
          } else if (typeof session.customer === "string") {
            customerId = session.customer;
          }
        } else if (ref.startsWith("pi_")) {
          const pi = await stripe.paymentIntents.retrieve(ref);
          if (typeof pi.customer === "string") customerId = pi.customer;
        }
      } catch (innerErr: any) {
        console.error("[StripePortal] lookup error:", innerErr?.message || innerErr);
      }

      // Fallback: procurar sessões recentes pelo metadata.userId e também por e-mail do usuário
      if (!customerId) {
        try {
          const user = await UserRepository.findUser(userId);
          const sessions = await stripe.checkout.sessions.list({ limit: 50 });
          const match = sessions.data.find((s: any) => {
            const hasRef = typeof s.customer === 'string' || typeof s.subscription === 'string';
            const metaMatch = s?.metadata?.userId === userId;
            const emailMatch = user?.email && s?.customer_details?.email && s.customer_details.email === user.email;
            return hasRef && (metaMatch || emailMatch);
          }) as any;
          if (match) {
            if (typeof match.subscription === 'string' && match.subscription) {
              const ssub = await stripe.subscriptions.retrieve(match.subscription);
              customerId = (ssub.customer as string) || '';
            } else if (typeof match.customer === 'string') {
              customerId = match.customer;
            }
          }
        } catch (listErr: any) {
          console.error('[StripePortal] list sessions error:', listErr?.message || listErr);
        }
      }

      if (!customerId) return res.status(400).json({ error: true, message: "Cliente Stripe não encontrado" });

      const returnUrl = `${process.env.APP_URL || "http://localhost:8080"}/#/account`;
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return res.json({ error: false, data: { url: portal.url } });
    } catch (err: any) {
      console.error("[StripePortal] erro:", err?.message || err);
      return res.status(500).json({ error: true, message: "Falha ao criar sessão do portal" });
    }
  }
}
