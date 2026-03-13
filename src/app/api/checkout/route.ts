import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

import { getStripeServer } from "@/lib/stripe/server";
import { generateOrderNumber } from "@/lib/utils";
import type { CartItem, Coupon } from "@/types";

type PaymentMethod = "card" | "cod";

type CheckoutRequestBody = {
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  items: CartItem[];
  customer: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customization_notes?: string;
    shipping_address?: Record<string, string | null>;
  };
};

type LogLevel = "info" | "warn" | "error";
type EmailDeliveryStatus = "sent" | "failed" | null;
type EmailStatus = {
  admin: EmailDeliveryStatus;
  customer: EmailDeliveryStatus;
};

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

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function logOrder(level: LogLevel, event: string, data: Record<string, unknown>) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };

  console.log(JSON.stringify(payload));
}

function calculateSubtotal(items: CartItem[]) {
  return Number(
    items
      .reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
      .toFixed(2),
  );
}

async function validateCoupon(code: string | null | undefined, subtotal: number): Promise<Coupon | null> {
  if (!code) {
    return null;
  }

  const supabase = getAdminSupabaseClient();
  const normalized = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const coupon = data as Coupon;

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return null;
  }

  if (coupon.min_order && subtotal < coupon.min_order) {
    return null;
  }

  return coupon;
}

function calculateDiscount(subtotal: number, coupon: Coupon | null) {
  if (!coupon) {
    return 0;
  }

  if (coupon.discount_type === "percentage") {
    return Number(((subtotal * coupon.discount_value) / 100).toFixed(2));
  }

  return Number(Math.min(subtotal, coupon.discount_value).toFixed(2));
}

async function sendOrderEmails(params: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    customizationNotes?: string | null;
  }>;
}): Promise<EmailStatus> {
  const emailStatus: EmailStatus = {
    admin: null,
    customer: null,
  };

  const resend = getResendClient();
  if (!resend) {
    logOrder("warn", "email.skipped", {
      orderId: params.orderId,
      reason: "RESEND_API_KEY missing",
    });
    return emailStatus;
  }

  // IMPORTANT: Custom domains (e.g. ordini@effegi-lab.it) must be verified in Resend.
  // Until verified, onboarding@resend.dev is the safest sender fallback.
  const emailFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const firstName = params.customerName.split(" ")[0] || "Sposa";

  const adminItemsHtml = params.items
    .map(
      (item) => `
      <div style="margin-bottom:12px;">
        <strong>${item.name}</strong> x${item.quantity}<br>
        ${item.customizationNotes ? `<em>Note: ${item.customizationNotes}</em>` : ""}
      </div>
    `,
    )
    .join("");

  const customerItemsHtml = params.items
    .map(
      (item) =>
        `<div>${item.name} x${item.quantity} — €${item.price.toFixed(2)}</div>`,
    )
    .join("");

  try {
    await resend.emails.send({
      from: emailFrom,
      to: "info@effegi-lab.it",
      subject: `🎉 Nuovo ordine #${params.orderNumber} — ${params.customerName}`,
      html: `
        <h2>Nuovo Ordine Ricevuto!</h2>
        <p><strong>Cliente:</strong> ${params.customerName}</p>
        <p><strong>Email:</strong> ${params.customerEmail}</p>
        <p><strong>Telefono:</strong> ${params.customerPhone}</p>
        <p><strong>Totale:</strong> €${params.total.toFixed(2)}</p>
        <h3>Prodotti:</h3>
        ${adminItemsHtml}
        <p><a href="https://effegilab.vercel.app/admin/ordini/${params.orderId}">Gestisci ordine nel pannello admin →</a></p>
      `,
    });
    emailStatus.admin = "sent";
    logOrder("info", "email.admin.sent", { orderId: params.orderId });
  } catch (error) {
    emailStatus.admin = "failed";
    logOrder("error", "email.admin.failed", {
      orderId: params.orderId,
      error: error instanceof Error ? error.message : "unknown",
      hint:
        error instanceof Error && error.message.toLowerCase().includes("domain")
          ? "Verifica dominio mittente su https://resend.com/domains"
          : undefined,
    });
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to: params.customerEmail,
      subject: `✅ Ordine confermato — Effegi Lab #${params.orderNumber}`,
      html: `
        <h2>Grazie per il tuo ordine, ${firstName}!</h2>
        <p>Abbiamo ricevuto il tuo ordine e lo stiamo elaborando.</p>
        <p>Ti contatteremo entro 48h su WhatsApp per la bozza grafica.</p>
        <h3>Riepilogo ordine:</h3>
        ${customerItemsHtml}
        <p><strong>Totale: €${params.total.toFixed(2)}</strong></p>
        <p>Hai domande? Scrivici su WhatsApp o rispondi a questa email.</p>
        <p>Con affetto,<br>Giuseppina — Effegi Lab 💍</p>
      `,
    });
    emailStatus.customer = "sent";
    logOrder("info", "email.customer.sent", { orderId: params.orderId });
  } catch (error) {
    emailStatus.customer = "failed";
    logOrder("error", "email.customer.failed", {
      orderId: params.orderId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  return emailStatus;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    logOrder("info", "checkout.started", {
      paymentMethod: body.paymentMethod,
      itemCount: body.items?.length ?? 0,
    });

    if (!body.items?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Carrello vuoto.",
        },
        { status: 400 },
      );
    }

    if (!body.customer?.customer_name || !body.customer?.customer_email || !body.customer?.customer_phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Dati cliente incompleti.",
        },
        { status: 400 },
      );
    }

    const subtotal = calculateSubtotal(body.items);
    const coupon = await validateCoupon(body.couponCode, subtotal);
    const discount = calculateDiscount(subtotal, coupon);
    const total = Number(Math.max(subtotal - discount, 0).toFixed(2));

    if (total <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Totale ordine non valido.",
        },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber();
    const supabase = getAdminSupabaseClient();

    let paymentIntentId: string | null = null;
    let clientSecret: string | null = null;

    if (body.paymentMethod === "card") {
      const stripe = getStripeServer();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_number: orderNumber,
          customer_email: body.customer.customer_email,
        },
      });

      paymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
      logOrder("info", "payment.intent.created", {
        paymentIntentId: paymentIntent.id,
        orderNumber,
      });
    }

    const orderItems = body.items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price ?? 0,
      options: item.selected_options,
      customizationNotes: item.customizationNotes ?? null,
    }));

    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: body.customer.customer_email,
        customer_name: body.customer.customer_name,
        customer_phone: body.customer.customer_phone,
        items: orderItems,
        total,
        status: "pending",
        customization_notes: body.customer.customization_notes ?? null,
        shipping_address: body.customer.shipping_address ?? null,
        stripe_payment_id: paymentIntentId,
      })
      .select("id")
      .single();

    if (orderError) {
      throw new Error(orderError.message);
    }

    logOrder("info", "order.created", {
      orderId: String(createdOrder.id),
      orderNumber,
      total,
      paymentMethod: body.paymentMethod,
    });

    const emailStatus = await sendOrderEmails({
      orderId: String(createdOrder.id),
      orderNumber,
      customerName: body.customer.customer_name,
      customerEmail: body.customer.customer_email,
      customerPhone: body.customer.customer_phone,
      total,
      items: orderItems.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        customizationNotes: item.customizationNotes,
      })),
    });

    const { error: emailStatusError } = await supabase
      .from("orders")
      .update({ email_status: emailStatus })
      .eq("id", String(createdOrder.id));

    if (emailStatusError) {
      logOrder("warn", "order.email_status.update_failed", {
        orderId: String(createdOrder.id),
        error: emailStatusError.message,
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      clientSecret,
      subtotal,
      discount,
      total,
      couponValid: Boolean(coupon),
      emailStatus,
    });
  } catch (error) {
    logOrder("error", "checkout.failed", {
      error: error instanceof Error ? error.message : "Errore interno checkout.",
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Errore interno checkout.",
      },
      { status: 500 },
    );
  }
}
