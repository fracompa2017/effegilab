import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import { formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getOrder(orderNumber?: string): Promise<Order | null> {
  if (!orderNumber) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as Order | null) ?? null;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { order } = await searchParams;
  const orderData = await getOrder(order);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#D7CEC1] bg-white p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[#7EA890]">Ordine confermato</p>
        <h1 className="mt-2 font-serif text-5xl text-[#1E1810]">Grazie per il tuo ordine</h1>
        <p className="mt-3 text-[#5C5048]">
          Abbiamo ricevuto la richiesta. A breve riceverai aggiornamenti via email e WhatsApp.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="space-y-4 rounded-3xl border border-[#E7DFD4] bg-white p-6">
          <h2 className="font-serif text-3xl text-[#1E1810]">Riepilogo acquisto</h2>
          <div className="space-y-2 text-sm text-[#5C5048]">
            <p>
              <span className="font-medium text-[#1E1810]">Numero ordine:</span>{" "}
              {orderData?.order_number ?? order ?? "In elaborazione"}
            </p>
            <p>
              <span className="font-medium text-[#1E1810]">Data:</span>{" "}
              {orderData?.created_at ? formatDate(orderData.created_at) : formatDate(new Date().toISOString())}
            </p>
            <p>
              <span className="font-medium text-[#1E1810]">Stato:</span>{" "}
              {orderData?.status ?? "pending"}
            </p>
            <p>
              <span className="font-medium text-[#1E1810]">Totale:</span>{" "}
              {orderData?.total ? formatPrice(orderData.total) : "Da confermare"}
            </p>
          </div>
        </article>

        <aside className="space-y-4 rounded-3xl border border-[#E7DFD4] bg-white p-6">
          <h2 className="font-serif text-3xl text-[#1E1810]">Prossimi passi</h2>
          <p className="text-sm text-[#5C5048]">
            Scrivici su WhatsApp indicando il numero ordine per iniziare subito la personalizzazione
            e ricevere la bozza grafica prima della produzione.
          </p>
          <Link
            href={`https://wa.me/393333333333?text=Ciao%20Effegi%20Lab,%20il%20mio%20numero%20ordine%20%C3%A8%20${encodeURIComponent(orderData?.order_number ?? order ?? "")}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#D4918F] px-5 py-3 text-sm font-medium text-white hover:bg-[#c47f7d]"
          >
            Invia numero ordine su WhatsApp
          </Link>
          <Link
            href="https://effegi-lab2.reservio.com/booking"
            className="inline-flex w-full items-center justify-center rounded-full border border-[#D7CEC1] bg-white px-5 py-3 text-sm font-medium text-[#5C5048] hover:border-[#A8C4B0]"
          >
            Prenota appuntamento
          </Link>
          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center rounded-full border border-[#D7CEC1] bg-[#F8F6F2] px-5 py-3 text-sm font-medium text-[#5C5048]"
          >
            Continua lo shopping
          </Link>
        </aside>
      </section>
    </div>
  );
}

