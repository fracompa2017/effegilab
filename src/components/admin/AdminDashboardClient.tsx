"use client";

import Link from "next/link";
import { BarChart3, Clock3, Package, ShoppingBag, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardStats } from "@/components/admin/DashboardStats";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus, Product } from "@/types";

type TopProduct = {
  id: string;
  name: string;
  collection: string | null;
  image: string | null;
  sold: number;
  price: number | null;
};

type DashboardData = {
  userName: string;
  todayLabel: string;
  monthOrders: number;
  ordersTrend: { trend: "up" | "down" | "neutral"; value: string };
  monthRevenue: number;
  revenueTrend: { trend: "up" | "down" | "neutral"; value: string };
  activeProducts: number;
  pendingOrders: number;
  latestOrders: Order[];
  sales14Days: Array<{ day: string; total: number }>;
  topProducts: TopProduct[];
};

function getMonthBounds(baseDate: Date) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const next = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  return { start, next };
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0 && current > 0) {
    return { trend: "up" as const, value: "+100%" };
  }
  if (previous === 0 && current === 0) {
    return { trend: "neutral" as const, value: "0%" };
  }

  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.round(raw);

  if (rounded > 0) {
    return { trend: "up" as const, value: `+${rounded}%` };
  }
  if (rounded < 0) {
    return { trend: "down" as const, value: `${rounded}%` };
  }
  return { trend: "neutral" as const, value: "0%" };
}

function normalizeStatus(status: string): OrderStatus {
  if (
    status === "pending" ||
    status === "processing" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "pending";
}

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  const now = new Date();
  const { start: monthStart } = getMonthBounds(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { start: previousMonthStart, next: previousMonthEnd } = getMonthBounds(previousMonthDate);

  const [
    userResponse,
    ordersResponse,
    activeProductsResponse,
    pendingOrdersResponse,
    productsResponse,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate() - 45).toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("id,name,collection,images,price"),
  ]);

  const user = userResponse.data.user;
  const userName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Team Effegi";

  const orders = ((ordersResponse.data ?? []) as Order[]).map((order) => ({
    ...order,
    status: normalizeStatus(order.status),
  }));

  const monthOrders = orders.filter((order) => new Date(order.created_at) >= monthStart);
  const previousMonthOrders = orders.filter((order) => {
    const date = new Date(order.created_at);
    return date >= previousMonthStart && date < previousMonthEnd;
  });

  const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + Number(order.total), 0);

  const latestOrders = orders.slice(0, 10);
  const activeProducts = activeProductsResponse.count ?? 0;
  const pendingOrders = pendingOrdersResponse.count ?? 0;

  const sales14Days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const dayKey = date.toISOString().slice(0, 10);
    return {
      day: dayKey,
      total: 0,
    };
  });

  const salesMap = new Map<string, number>();
  for (const day of sales14Days) {
    salesMap.set(day.day, 0);
  }

  for (const order of orders) {
    if (order.status === "cancelled") {
      continue;
    }
    const key = order.created_at.slice(0, 10);
    if (!salesMap.has(key)) {
      continue;
    }
    salesMap.set(key, (salesMap.get(key) ?? 0) + Number(order.total));
  }

  const salesBars = sales14Days.map((entry) => ({
    day: entry.day,
    total: Number((salesMap.get(entry.day) ?? 0).toFixed(2)),
  }));

  const productMap = new Map<string, Product>();
  for (const product of (productsResponse.data ?? []) as Product[]) {
    productMap.set(product.id, product);
  }

  const soldCounter = new Map<string, number>();
  for (const order of orders) {
    const orderItems = (order.items ?? []) as OrderItem[];
    for (const item of orderItems) {
      const id = item.product_id;
      soldCounter.set(id, (soldCounter.get(id) ?? 0) + Number(item.quantity ?? 0));
    }
  }

  const topProducts: TopProduct[] = Array.from(soldCounter.entries())
    .map(([id, sold]) => {
      const product = productMap.get(id);
      return {
        id,
        sold,
        name: product?.name ?? "Prodotto",
        collection: product?.collection ?? null,
        image: product?.images?.[0] ?? null,
        price: product?.price ?? null,
      };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return {
    userName,
    todayLabel: formatDate(now.toISOString()),
    monthOrders: monthOrders.length,
    ordersTrend: calculateTrend(monthOrders.length, previousMonthOrders.length),
    monthRevenue,
    revenueTrend: calculateTrend(monthRevenue, previousMonthRevenue),
    activeProducts,
    pendingOrders,
    latestOrders,
    sales14Days: salesBars,
    topProducts,
  };
}

function latestOrderMainProduct(order: Order) {
  const items = (order.items ?? []) as OrderItem[];
  if (!items.length) {
    return "N/D";
  }
  if (items.length === 1) {
    return items[0].product_name;
  }
  return `${items[0].product_name} +${items.length - 1}`;
}

export function AdminDashboardClient() {
  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30_000,
  });

  const maxBarValue = useMemo(() => {
    const values = dashboardQuery.data?.sales14Days.map((entry) => entry.total) ?? [0];
    return Math.max(...values, 1);
  }, [dashboardQuery.data?.sales14Days]);

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-5 text-sm text-[#A24D49]">
        Errore nel caricamento dashboard. Riprova tra qualche secondo.
      </div>
    );
  }

  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-black/7 bg-white p-6">
        <h1 className="font-serif text-4xl text-[#1E1810]">Buongiorno, {data.userName}! 👋</h1>
        <p className="mt-1 text-sm text-[#5C5048]">{data.todayLabel}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStats
          title="Ordini questo mese"
          value={data.monthOrders}
          trend={data.ordersTrend.trend}
          trendValue={data.ordersTrend.value}
          icon={ShoppingBag}
          color="rose"
        />
        <DashboardStats
          title="Fatturato mensile (€)"
          value={Math.round(data.monthRevenue)}
          trend={data.revenueTrend.trend}
          trendValue={data.revenueTrend.value}
          icon={Wallet}
          color="sage"
        />
        <DashboardStats
          title="Prodotti attivi"
          value={data.activeProducts}
          trend="neutral"
          trendValue="Catalogo live"
          icon={Package}
          color="lavender"
        />
        <DashboardStats
          title="Ordini in sospeso"
          value={data.pendingOrders}
          trend={data.pendingOrders > 0 ? "down" : "up"}
          trendValue={data.pendingOrders > 0 ? "Da gestire" : "Nessun alert"}
          icon={Clock3}
          color="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[#1E1810]">Ultimi ordini</h2>
            <Link href="/admin/ordini" className="text-sm font-medium text-[#5C5048] hover:text-[#1E1810]">
              Vedi tutti →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/7 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.1em] text-[#9C9088]">
                  <th className="pb-3 font-medium">#Ordine</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Prodotto</th>
                  <th className="pb-3 font-medium">Totale</th>
                  <th className="pb-3 font-medium">Stato</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/7">
                {data.latestOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3">
                      <Link href={`/admin/ordini/${order.id}`} className="font-medium text-[#1E1810] underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 text-[#5C5048]">{order.customer_name}</td>
                    <td className="py-3 text-[#5C5048]">{latestOrderMainProduct(order)}</td>
                    <td className="py-3 text-[#5C5048]">{formatPrice(Number(order.total))}</td>
                    <td className="py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-[#5C5048]">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-black/7 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#D4918F]" />
            <h2 className="font-serif text-3xl text-[#1E1810]">Vendite ultimi 14 giorni</h2>
          </div>
          <div className="grid h-64 grid-cols-14 items-end gap-2">
            {data.sales14Days.map((entry) => {
              const height = Math.max(8, (entry.total / maxBarValue) * 100);
              const label = new Date(entry.day).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
              });

              return (
                <div key={entry.day} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-[#D4918F]/85"
                    style={{ height: `${height}%` }}
                    title={`${label} · ${formatPrice(entry.total)}`}
                  />
                  <span className="text-[10px] text-[#9C9088]">{label}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-black/7 bg-white p-5">
        <h2 className="mb-4 font-serif text-3xl text-[#1E1810]">Prodotti più venduti</h2>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-[#5C5048]">Nessun dato di vendita disponibile.</p>
        ) : (
          <ul className="space-y-3">
            {data.topProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-black/7 bg-[#FFFEFD] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3ECE3] text-xs text-[#5C5048]">
                    {product.image ? "IMG" : "N/D"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1E1810]">{product.name}</p>
                    <p className="text-xs text-[#9C9088]">{product.collection ?? "Senza collezione"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#1E1810]">{product.sold} vendite</p>
                  <p className="text-xs text-[#5C5048]">
                    {product.price !== null ? formatPrice(product.price) : "Prezzo N/D"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

