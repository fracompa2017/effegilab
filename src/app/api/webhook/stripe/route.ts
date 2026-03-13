import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { getStripeServer } from "@/lib/stripe/server";

type LogLevel = "info" | "warn" | "error";

function logOrder(level: LogLevel, event: string, data: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...data,
    }),
  );
}

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
  await updateOrderStatus(paymentIntent.id, "processing", "payment_intent.succeeded");
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await updateOrderStatus(paymentIntent.id, "cancelled", "payment_intent.payment_failed");
}

async function updateOrderStatus(
  paymentIntentId: string,
  nextStatus: "processing" | "cancelled",
  eventType: string,
) {
  const supabase = getAdminSupabaseClient();
  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id,status")
    .eq("stripe_payment_id", paymentIntentId)
    .maybeSingle();

  if (readError) {
    logOrder("error", "webhook.order.read_failed", {
      eventType,
      paymentIntentId,
      error: readError.message,
    });
    return;
  }

  if (!order?.id) {
    logOrder("warn", "webhook.order.not_found", {
      eventType,
      paymentIntentId,
    });
    return;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: nextStatus,
    })
    .eq("id", order.id);

  if (updateError) {
    logOrder("error", "webhook.order.update_failed", {
      orderId: order.id,
      eventType,
      paymentIntentId,
      error: updateError.message,
    });
    return;
  }

  logOrder("info", "order.status.updated", {
    orderId: order.id,
    paymentIntentId,
    eventType,
    previousStatus: order.status,
    newStatus: nextStatus,
  });
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
    const object = event.data.object as { id?: string };
    logOrder("info", "webhook.received", {
      type: event.type,
      paymentIntentId: object?.id ?? null,
    });

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
    logOrder("error", "webhook.failed", {
      error: error instanceof Error ? error.message : "Webhook error.",
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook error.",
      },
      { status: 400 },
    );
  }
}
