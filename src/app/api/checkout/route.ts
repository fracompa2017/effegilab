import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;

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
    }

    const orderItems = body.items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price ?? 0,
      options: item.selected_options,
    }));

    const { error: orderError } = await supabase.from("orders").insert({
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
    });

    if (orderError) {
      throw new Error(orderError.message);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      clientSecret,
      subtotal,
      discount,
      total,
      couponValid: Boolean(coupon),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Errore interno checkout.",
      },
      { status: 500 },
    );
  }
}

