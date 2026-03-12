"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";

import { useCartStore } from "@/lib/cart-store";
import { getStripeClient } from "@/lib/stripe/client";
import { cn, formatPrice } from "@/lib/utils";

type PaymentMethod = "card" | "cod";

type CheckoutResponse = {
  success: boolean;
  clientSecret?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
};

const stripePromise = getStripeClient();
const STANDARD_SHIPPING = 6.9;
const FREE_SHIPPING_THRESHOLD = 150;

function StepIndicator() {
  const steps = ["Dati", "Spedizione", "Pagamento"];

  return (
    <div className="space-y-2 rounded-2xl border border-[#E8DED2] bg-white p-4">
      <div className="grid grid-cols-3 text-center text-xs font-medium uppercase tracking-[0.08em] text-[#7A6F66]">
        {steps.map((step, index) => (
          <p key={step}>
            {index + 1} {step}
          </p>
        ))}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[#EFE5DA]">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-[#D4918F] via-[#D4918F] to-[#7EA890]" />
      </div>
    </div>
  );
}

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
  const [couponInput, setCouponInput] = useState(couponCode ?? "LAB15");
  const [message, setMessage] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    province: "",
    notes: "",
  });

  const shippingCost = total >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const grandTotal = total + shippingCost;

  const canSubmit = useMemo(
    () => Boolean(items.length && form.email && form.firstName && form.lastName && form.phone && form.address),
    [form.address, form.email, form.firstName, form.lastName, form.phone, items.length],
  );

  function handleApplyCoupon() {
    const valid = applyCoupon(couponInput);
    setMessage(valid ? "Coupon LAB15 applicato." : "Coupon non valido.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage("Compila i campi obbligatori per proseguire.");
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          couponCode,
          items,
          customer: {
            customer_name: `${form.firstName} ${form.lastName}`.trim(),
            customer_email: form.email,
            customer_phone: form.phone,
            customization_notes: form.notes,
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
        throw new Error(payload.error ?? "Errore checkout.");
      }

      if (!payload.orderNumber) {
        throw new Error("Numero ordine mancante.");
      }

      if (paymentMethod === "card") {
        if (!stripe || !elements || !payload.clientSecret) {
          throw new Error("Stripe non inizializzato.");
        }

        const card = elements.getElement(CardElement);
        if (!card) {
          throw new Error("Inserisci i dati carta.");
        }

        const result = await stripe.confirmCardPayment(payload.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              name: `${form.firstName} ${form.lastName}`.trim(),
              email: form.email,
              phone: form.phone,
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message ?? "Pagamento non riuscito.");
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
      <section className="rounded-2xl border border-dashed border-[#D8CEC1] bg-white p-6 text-center">
        <h1 className="font-serif text-[34px] text-[#1E1810]">Checkout</h1>
        <p className="mt-2 text-sm text-[#6F645A]">Il carrello è vuoto. Aggiungi prodotti prima di procedere.</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex min-h-12 items-center rounded-full bg-[#D4918F] px-6 text-sm font-medium text-white"
        >
          Torna allo shop
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <StepIndicator />

        <div className="space-y-4 rounded-2xl border border-[#E8DED2] bg-white p-4">
          <h2 className="font-serif text-[30px] text-[#1E1810]">Dati cliente</h2>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder="Nome"
              className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
            />
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder="Cognome"
              className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
            />
          </div>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Telefono (WhatsApp)"
            className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
          />
          <input
            type="text"
            required
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="Indirizzo"
            className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.zip}
              onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
              placeholder="CAP"
              className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
            />
            <input
              type="text"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Città"
              className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
            />
          </div>
          <select
            value={form.province}
            onChange={(event) => setForm((prev) => ({ ...prev, province: event.target.value }))}
            className="h-12 w-full rounded-xl border border-[#D7CEC1] px-4 text-base outline-none"
          >
            <option value="">Provincia</option>
            <option value="NA">Napoli</option>
            <option value="CE">Caserta</option>
            <option value="SA">Salerno</option>
            <option value="AV">Avellino</option>
            <option value="BN">Benevento</option>
          </select>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4">
          <h2 className="font-serif text-[30px] text-[#1E1810]">Spedizione</h2>
          <label className="flex min-h-12 items-center justify-between rounded-xl border border-[#E8DED2] px-3">
            <span className="text-sm text-[#5C5048]">Standard 5-7gg</span>
            <span className="text-sm font-medium text-[#1E1810]">{formatPrice(shippingCost)}</span>
          </label>
          <div className="rounded-xl bg-[#F8F6F2] p-3 text-sm text-[#5C5048]">
            {shippingCost === 0 ? "Spedizione gratuita attiva da 150€." : "Spedizione gratuita da 150€."}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4">
          <h2 className="font-serif text-[30px] text-[#1E1810]">Pagamento</h2>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#E8DED2] px-3 text-sm text-[#5C5048]">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            Carta (Apple Pay / Google Pay se disponibili)
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#E8DED2] px-3 text-sm text-[#5C5048]">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            Contrassegno
          </label>
          {paymentMethod === "card" ? (
            <div className="rounded-xl border border-[#D7CEC1] p-3">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
          ) : null}
          <div className="inline-flex items-center gap-2 text-xs text-[#6F645A]">
            <Lock size={13} />
            SSL attivo · Stripe sicuro
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-[#E8DED2] bg-white p-4">
          <h2 className="font-serif text-[28px] text-[#1E1810]">Coupon</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              className="h-12 flex-1 rounded-full border border-[#D7CEC1] px-4 text-base outline-none"
              placeholder="LAB15"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] px-5 text-sm font-medium text-white"
            >
              Applica
            </button>
          </div>
          {couponCode ? (
            <button type="button" onClick={removeCoupon} className="text-xs text-[#5C5048] underline">
              Rimuovi coupon ({couponCode})
            </button>
          ) : null}
        </div>

        {message ? <p className="text-sm text-[#A24D49]">{message}</p> : null}
      </section>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <section className="space-y-3 rounded-2xl border border-[#E8DED2] bg-white p-4">
          <button
            type="button"
            onClick={() => setSummaryOpen((current) => !current)}
            className="flex min-h-12 w-full items-center justify-between text-left"
          >
            <span className="font-serif text-[30px] text-[#1E1810]">Il tuo ordine ({items.length} articoli)</span>
            <ChevronDown size={18} className={cn("transition lg:hidden", summaryOpen ? "rotate-180" : "")} />
          </button>

          <div className={cn("space-y-2", summaryOpen ? "block" : "hidden lg:block")}>
            {items.map((item) => (
              <div key={`${item.product.id}-${JSON.stringify(item.selected_options)}`} className="flex justify-between gap-3 text-sm text-[#5C5048]">
                <span className="line-clamp-1">
                  {item.quantity} × {item.product.name}
                </span>
                <span>{formatPrice((item.product.price ?? 0) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-[#EFE6DB] pt-2 text-sm text-[#5C5048]">
              <span>Subtotale</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#5C5048]">
              <span>Sconto</span>
              <span>- {formatPrice(discount)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#5C5048]">
              <span>Spedizione</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex min-h-14 w-full items-center justify-center rounded-full bg-[#D4918F] px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Elaborazione..." : `Completa l'Ordine → ${formatPrice(grandTotal)}`}
          </button>
          <p className="text-center text-xs text-[#6F645A]">🔒 Pagamento sicuro Visa · Mastercard · PayPal</p>
        </section>
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
