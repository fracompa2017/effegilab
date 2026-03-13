import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { getAccountOrderById } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";

type AccountOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const timelineSteps = [
  "Ordine ricevuto",
  "Pagamento confermato",
  "In lavorazione (bozza grafica)",
  "Bozza approvata",
  "In stampa",
  "Spedito",
  "Consegnato",
];

function progressByStatus(status: OrderStatus): number {
  switch (status) {
    case "pending":
      return 2;
    case "processing":
      return 3;
    case "shipped":
      return 6;
    case "delivered":
      return 7;
    case "cancelled":
      return 1;
    default:
      return 1;
  }
}

function formatAddress(address: Record<string, string | null> | null) {
  if (!address) {
    return "Indirizzo non disponibile";
  }

  const parts = Object.values(address)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "Indirizzo non disponibile";
}

export default async function AccountOrderDetailPage({ params }: AccountOrderDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth");
  }

  const order = await getAccountOrderById(id, user.email);

  if (!order) {
    notFound();
  }

  const completedSteps = progressByStatus(order.status);
  const whatsappText = encodeURIComponent(
    `Ciao ${order.customer_name}, il tuo ordine ${order.order_number} è pronto per la bozza!`,
  );

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-black/7 bg-white p-5 sm:p-6">
        <Link href="/account" className="text-sm font-medium text-[#5C5048] underline">
          ← Torna ai tuoi ordini
        </Link>
        <h1 className="mt-3 font-serif text-4xl text-[#1E1810]">Ordine {order.order_number}</h1>
        <p className="text-sm text-[#5C5048]">Creato il {formatDate(order.created_at)}</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="space-y-5 rounded-2xl border border-black/7 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-3xl text-[#1E1810]">Stato ordine</h2>
            <OrderStatusBadge status={order.status} />
          </div>

          <ol className="space-y-3">
            {timelineSteps.map((step, index) => {
              const done = index + 1 <= completedSteps;

              return (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-[#D4918F] text-white" : "bg-[#EFE7DD] text-[#7F736A]"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className={done ? "text-[#1E1810]" : "text-[#7F736A]"}>{step}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {order.status === "cancelled" ? (
            <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] px-3 py-2 text-sm text-[#A24D49]">
              Questo ordine risulta annullato. Contattaci su WhatsApp per assistenza.
            </div>
          ) : null}
        </article>

        <aside className="space-y-5 rounded-2xl border border-black/7 bg-white p-5">
          <section>
            <h3 className="font-serif text-2xl text-[#1E1810]">Prodotti ordinati</h3>
            <ul className="mt-3 space-y-2">
              {order.items.map((item) => (
                <li key={`${item.product_id}-${item.product_name}`} className="rounded-xl border border-[#ECE4D8] bg-[#FCFAF8] p-3">
                  <p className="text-sm font-medium text-[#1E1810]">{item.product_name}</p>
                  <p className="mt-1 text-xs text-[#6F6359]">Quantità: {item.quantity}</p>
                  {item.options && Object.keys(item.options).length ? (
                    <p className="mt-1 text-xs text-[#6F6359]">Opzioni: {Object.values(item.options).join(" · ")}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-[#1E1810]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#ECE4D8] bg-[#FCFAF8] p-3 text-sm text-[#5C5048]">
            <p>
              <span className="font-medium text-[#1E1810]">Totale:</span> {formatPrice(order.total)}
            </p>
            <p className="mt-1">
              <span className="font-medium text-[#1E1810]">Indirizzo spedizione:</span> {formatAddress(order.shipping_address)}
            </p>
          </section>

          <Link
            href={`https://wa.me/393XXXXXXXXX?text=${whatsappText}`}
            target="_blank"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
          >
            Hai domande? Scrivici su WhatsApp
          </Link>
        </aside>
      </section>
    </div>
  );
}
