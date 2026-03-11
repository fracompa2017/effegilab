"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types";

type OrderDetailClientProps = {
  order: Order;
};

const statusFlow: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

const statusLabel: Record<OrderStatus, string> = {
  pending: "In attesa",
  processing: "In lavorazione",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

function getSubtotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function isReachedStatus(currentStatus: OrderStatus, checkStatus: OrderStatus) {
  if (currentStatus === "cancelled") {
    return checkStatus === "cancelled";
  }
  if (checkStatus === "cancelled") {
    return false;
  }
  const currentIndex = statusFlow.indexOf(currentStatus);
  const checkIndex = statusFlow.indexOf(checkStatus);
  return checkIndex <= currentIndex;
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const supabase = createClient();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const orderItems = (order.items ?? []) as OrderItem[];
  const subtotal = getSubtotal(orderItems);
  const discount = Math.max(0, subtotal - Number(order.total));

  async function handleSaveStatus() {
    if (selectedStatus === order.status) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("orders").update({ status: selectedStatus }).eq("id", order.id);

    if (error) {
      setFeedback("Errore nel salvataggio stato.");
      setIsSaving(false);
      return;
    }

    setFeedback("Stato ordine aggiornato correttamente.");
    setIsSaving(false);
  }

  const whatsappText = `Ciao ${order.customer_name}, il tuo ordine ${order.order_number} è pronto per la bozza!`;
  const whatsappUrl = `https://wa.me/${(order.customer_phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <section className="space-y-6">
        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#5C5048]">Ordine</p>
              <h1 className="font-serif text-4xl text-[#1E1810]">{order.order_number}</h1>
            </div>
            <OrderStatusBadge status={selectedStatus} />
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-[#5C5048]">
              Cambia stato
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}
                className="h-10 min-w-48 rounded-full border border-black/10 bg-white px-4 text-sm outline-none focus:border-[#D4918F]"
              >
                <option value="pending">Pending</option>
                <option value="processing">In lavorazione</option>
                <option value="shipped">Spedito</option>
                <option value="delivered">Consegnato</option>
                <option value="cancelled">Annullato</option>
              </select>
            </label>
            <Button onClick={handleSaveStatus} disabled={isSaving} className="rounded-full bg-[#D4918F] text-white">
              {isSaving ? "Salvataggio..." : "Salva cambio stato"}
            </Button>
            {feedback ? <p className="text-xs text-[#5C5048]">{feedback}</p> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <h2 className="font-serif text-3xl text-[#1E1810]">Timeline stato</h2>
          <div className="mt-4 space-y-3">
            {[...statusFlow, "cancelled" as OrderStatus].map((status) => {
              const reached = isReachedStatus(selectedStatus, status);
              return (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      reached ? "bg-[#7EA890]" : "bg-[#D7CEC1]"
                    }`}
                  />
                  <span className={reached ? "text-[#1E1810]" : "text-[#9C9088]"}>
                    {statusLabel[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <h2 className="font-serif text-3xl text-[#1E1810]">Cliente</h2>
          <div className="mt-3 space-y-1 text-sm text-[#5C5048]">
            <p>
              <span className="font-medium text-[#1E1810]">Nome:</span> {order.customer_name}
            </p>
            <p>
              <span className="font-medium text-[#1E1810]">Email:</span> {order.customer_email}
            </p>
            <p>
              <span className="font-medium text-[#1E1810]">Telefono:</span>{" "}
              {order.customer_phone ?? "N/D"}
            </p>
          </div>
          <div className="mt-3 rounded-xl bg-[#F8F6F2] p-3 text-sm text-[#5C5048]">
            <p className="font-medium text-[#1E1810]">Indirizzo spedizione</p>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-[#5C5048]">
              {JSON.stringify(order.shipping_address ?? {}, null, 2)}
            </pre>
          </div>
        </article>

        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <h2 className="font-serif text-3xl text-[#1E1810]">Prodotti ordinati</h2>
          <ul className="mt-3 space-y-3">
            {orderItems.map((item, index) => (
              <li key={`${item.product_id}-${index}`} className="rounded-xl border border-black/7 p-3">
                <p className="font-medium text-[#1E1810]">{item.product_name}</p>
                <p className="mt-1 text-xs text-[#5C5048]">
                  Quantità: {item.quantity} · Prezzo: {formatPrice(item.price)}
                </p>
                {item.options ? (
                  <p className="mt-1 text-xs text-[#9C9088]">
                    Opzioni:{" "}
                    {Object.entries(item.options)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <h2 className="font-serif text-3xl text-[#1E1810]">Totali</h2>
          <div className="mt-3 space-y-1 text-sm text-[#5C5048]">
            <p className="flex items-center justify-between">
              <span>Subtotale</span>
              <span>{formatPrice(subtotal)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Sconto coupon</span>
              <span>- {formatPrice(discount)}</span>
            </p>
            <p className="flex items-center justify-between border-t border-black/7 pt-2 text-base font-semibold text-[#1E1810]">
              <span>Totale</span>
              <span>{formatPrice(Number(order.total))}</span>
            </p>
            <p className="pt-1 text-xs text-[#9C9088]">
              Metodo pagamento: {order.stripe_payment_id ? "Carta (Stripe)" : "Contrassegno"}
            </p>
            <p className="text-xs text-[#9C9088]">Creato il {formatDate(order.created_at)}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <h2 className="font-serif text-3xl text-[#1E1810]">Personalizzazione</h2>
          <p className="mt-3 text-sm text-[#5C5048]">
            {order.customization_notes || "Nessuna nota aggiuntiva dal cliente."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={whatsappUrl}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full bg-[#D4918F] px-4 py-2 text-sm font-medium text-white"
            >
              <MessageCircle size={14} />
              Apri chat WhatsApp
            </Link>
            <Link
              href="/admin/ordini"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[#5C5048]"
            >
              Torna alla lista
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

