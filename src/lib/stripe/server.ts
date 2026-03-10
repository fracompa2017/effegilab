import Stripe from "stripe";

let stripeServer: Stripe | null = null;

export function getStripeServer() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing environment variable: STRIPE_SECRET_KEY");
  }

  if (!stripeServer) {
    stripeServer = new Stripe(secretKey);
  }

  return stripeServer;
}
