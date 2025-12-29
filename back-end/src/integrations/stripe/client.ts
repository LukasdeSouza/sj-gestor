import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY as string | undefined;

if (!stripeSecret) {
  // Mantemos silencioso em tempo de build; controllers validarão antes de uso
}

export const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
  : (undefined as unknown as Stripe);

export default stripe;

