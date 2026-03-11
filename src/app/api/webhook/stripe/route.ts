import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { getStripeServer } from "@/lib/stripe/server";

function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const supabase = getAdminSupabaseClient();

  await supabase
    .from("orders")
    .update({
      status: "processing",
    })
    .eq("stripe_payment_id", paymentIntent.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = getAdminSupabaseClient();

  await supabase
    .from("orders")
    .update({
      status: "cancelled",
    })
    .eq("stripe_payment_id", paymentIntent.id);
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing Stripe webhook signature." }, { status: 400 });
    }

    const stripe = getStripeServer();
    const payload = await request.text();

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook error.",
      },
      { status: 400 },
    );
  }
}

