import Stripe from "stripe";

declare global {
  var stripeServerSingleton: Stripe | undefined;
}

export function getStripeServer() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing environment variable: STRIPE_SECRET_KEY");
  }

  if (!globalThis.stripeServerSingleton) {
    globalThis.stripeServerSingleton = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return globalThis.stripeServerSingleton;
}
