"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCartStore } from "@/lib/cart-store";
import { getStripeClient } from "@/lib/stripe/client";
import { formatPrice } from "@/lib/utils";

type PaymentMethod = "card" | "cod";

type CheckoutResponse = {
  success: boolean;
  clientSecret?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
};

const stripePromise = getStripeClient();

function CheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const {
    items,
    couponCode,
    subtotal,
    discount,
    total,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCartStore((state) => state);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    address: "",
    city: "",
    zip: "",
    province: "",
    customization_notes: "",
  });

  const canSubmit = useMemo(
    () => items.length > 0 && form.customer_name && form.customer_email && form.customer_phone && form.address,
    [items.length, form.customer_name, form.customer_email, form.customer_phone, form.address],
  );

  async function handleApplyCoupon() {
    const valid = applyCoupon(couponInput);
    setMessage(valid ? "Coupon applicato: 15% di sconto." : "Coupon non valido.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage("Compila i campi obbligatori per continuare.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          couponCode,
          items,
          customer: {
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            customer_phone: form.customer_phone,
            customization_notes: form.customization_notes,
            shipping_address: {
              address: form.address,
              city: form.city,
              zip: form.zip,
              province: form.province,
              country: "IT",
            },
          },
        }),
      });

      const payload = (await response.json()) as CheckoutResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Errore durante il checkout.");
      }

      if (!payload.orderNumber) {
        throw new Error("Numero ordine non ricevuto.");
      }

      if (paymentMethod === "card") {
        if (!stripe || !elements || !payload.clientSecret) {
          throw new Error("Stripe non inizializzato correttamente.");
        }

        const card = elements.getElement(CardElement);
        if (!card) {
          throw new Error("Inserisci i dati carta.");
        }

        const result = await stripe.confirmCardPayment(payload.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              name: form.customer_name,
              email: form.customer_email,
              phone: form.customer_phone,
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message ?? "Pagamento carta non riuscito.");
        }
      }

      clearCart();
      router.push(`/checkout/successo?order=${payload.orderNumber}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <section className="rounded-3xl border border-dashed border-[#D7CEC1] bg-white p-10 text-center">
        <h1 className="font-serif text-4xl text-[#1E1810]">Checkout</h1>
        <p className="mt-3 text-[#5C5048]">Il carrello è vuoto, aggiungi prodotti prima di procedere.</p>
        <Link href="/shop" className="mt-4 inline-flex rounded-full bg-[#D4918F] px-6 py-3 text-white">
          Torna allo shop
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6 rounded-3xl border border-[#E7DFD4] bg-white p-6">
        <div>
          <h1 className="font-serif text-5xl text-[#1E1810]">Checkout</h1>
          <p className="mt-2 text-[#5C5048]">
            Completa i dati per ricevere la bozza grafica su WhatsApp dopo l&apos;ordine.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="customer_name"
            label="Nome e cognome *"
            value={form.customer_name}
            onChange={(event) => setForm((prev) => ({ ...prev, customer_name: event.target.value }))}
          />
          <Input
            id="customer_email"
            type="email"
            label="Email *"
            value={form.customer_email}
            onChange={(event) => setForm((prev) => ({ ...prev, customer_email: event.target.value }))}
          />
          <Input
            id="customer_phone"
            label="Telefono *"
            value={form.customer_phone}
            onChange={(event) => setForm((prev) => ({ ...prev, customer_phone: event.target.value }))}
          />
          <Input
            id="address"
            label="Indirizzo *"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />
          <Input
            id="city"
            label="Città"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <Input
            id="zip"
            label="CAP"
            value={form.zip}
            onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
          />
          <Input
            id="province"
            label="Provincia"
            value={form.province}
            onChange={(event) => setForm((prev) => ({ ...prev, province: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="customization_notes" className="text-sm font-medium text-[#1E1810]">
            Note personalizzazione prodotti
          </label>
          <textarea
            id="customization_notes"
            rows={4}
            className="w-full rounded-2xl border border-[#D7CEC1] px-4 py-3 text-sm outline-none focus:border-[#D4918F]"
            value={form.customization_notes}
            onChange={(event) => setForm((prev) => ({ ...prev, customization_notes: event.target.value }))}
            placeholder="Es. palette colori, stile calligrafia, dettagli evento..."
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-[#E7DFD4] bg-[#F8F6F2] p-4">
          <p className="text-sm font-medium text-[#1E1810]">Metodo di pagamento</p>
          <label className="flex items-center gap-2 text-sm text-[#5C5048]">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            Carta (Stripe)
          </label>
          <label className="flex items-center gap-2 text-sm text-[#5C5048]">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            Contrassegno (pagamento alla consegna)
          </label>
          {paymentMethod === "card" ? (
            <div className="rounded-xl border border-[#D7CEC1] bg-white p-3">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
          ) : null}
        </div>

        {message ? <p className="text-sm text-[#8A5E5A]">{message}</p> : null}

        <Button
          type="submit"
          className="w-full rounded-full bg-[#D4918F] py-3 text-base text-white hover:bg-[#c47f7d]"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Elaborazione..." : "Conferma ordine"}
        </Button>
      </section>

      <aside className="h-fit space-y-4 rounded-3xl border border-[#E7DFD4] bg-white p-5">
        <h2 className="font-serif text-3xl text-[#1E1810]">Riepilogo ordine</h2>
        <div className="space-y-2 text-sm text-[#5C5048]">
          {items.map((item) => (
            <div key={`${item.product.id}-${JSON.stringify(item.selected_options)}`} className="flex justify-between gap-3">
              <span className="line-clamp-1">
                {item.quantity} x {item.product.name}
              </span>
              <span>{formatPrice((item.product.price ?? 0) * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl bg-[#F8F6F2] p-3">
          <label htmlFor="coupon" className="text-xs font-medium uppercase tracking-[0.1em] text-[#5C5048]">
            Coupon
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              className="h-10 flex-1 rounded-full border border-[#D7CEC1] bg-white px-4 text-sm outline-none focus:border-[#D4918F]"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              placeholder="LAB15"
            />
            <Button type="button" onClick={handleApplyCoupon}>
              Applica
            </Button>
          </div>
          {couponCode ? (
            <button type="button" className="text-xs underline" onClick={removeCoupon}>
              Rimuovi coupon ({couponCode})
            </button>
          ) : null}
        </div>

        <div className="space-y-1 text-sm text-[#5C5048]">
          <div className="flex justify-between">
            <span>Subtotale</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sconto</span>
            <span>- {formatPrice(discount)}</span>
          </div>
          <div className="flex justify-between border-t border-[#E7DFD4] pt-2 text-base font-semibold text-[#1E1810]">
            <span>Totale</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
