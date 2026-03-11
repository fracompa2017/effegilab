"use client";

import Link from "next/link";
import { Download, Eye, Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const PAGE_SIZE = 20;

type StatusFilter = "all" | OrderStatus;
type SortField = "order_number" | "customer_name" | "total" | "created_at" | "status";
type SortDirection = "asc" | "desc";

const statusTabs: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tutti", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In lavorazione", value: "processing" },
  { label: "Spediti", value: "shipped" },
  { label: "Consegnati", value: "delivered" },
];

type OrdersResponse = {
  data: Order[];
  count: number;
};

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

function csvEscape(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function fetchOrders(params: {
  page: number;
  status: StatusFilter;
  search: string;
  fromDate: string;
  toDate: string;
  sortField: SortField;
  sortDirection: SortDirection;
}): Promise<OrdersResponse> {
  const supabase = createClient();
  const from = (params.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order(params.sortField, { ascending: params.sortDirection === "asc" })
    .range(from, to);

  if (params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.search.trim()) {
    const safeSearch = params.search.trim().replace(/,/g, "");
    query = query.or(`order_number.ilike.%${safeSearch}%,customer_name.ilike.%${safeSearch}%`);
  }

  if (params.fromDate) {
    query = query.gte("created_at", `${params.fromDate}T00:00:00.000Z`);
  }
  if (params.toDate) {
    query = query.lte("created_at", `${params.toDate}T23:59:59.999Z`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const normalized = ((data ?? []) as Order[]).map((order) => ({
    ...order,
    status: normalizeStatus(order.status),
  }));

  return {
    data: normalized,
    count: count ?? 0,
  };
}

export function AdminOrdersListClient() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusDraft, setStatusDraft] = useState<Record<string, OrderStatus>>({});

  const ordersQuery = useQuery({
    queryKey: [
      "admin-orders-list",
      page,
      statusFilter,
      search,
      fromDate,
      toDate,
      sortField,
      sortDirection,
    ],
    queryFn: () =>
      fetchOrders({
        page,
        status: statusFilter,
        search,
        fromDate,
        toDate,
        sortField,
        sortDirection,
      }),
    refetchInterval: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status: payload.status }).eq("id", payload.id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders-list"] });
    },
  });

  const totalItems = ordersQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  }

  function handleChangeStatus(orderId: string, currentStatus: OrderStatus) {
    const nextStatus = statusDraft[orderId];
    if (!nextStatus || nextStatus === currentStatus) {
      return;
    }
    updateStatusMutation.mutate({ id: orderId, status: nextStatus });
  }

  function exportCsv() {
    const rows = ordersQuery.data?.data ?? [];
    if (!rows.length) {
      return;
    }

    const header = [
      "#Ordine",
      "Cliente",
      "Email",
      "Prodotti",
      "Totale",
      "Stato",
      "Data",
    ];
    const csvRows = rows.map((order) => [
      csvEscape(order.order_number),
      csvEscape(order.customer_name),
      csvEscape(order.customer_email),
      csvEscape(Array.isArray(order.items) ? order.items.length : 0),
      csvEscape(Number(order.total).toFixed(2)),
      csvEscape(order.status),
      csvEscape(order.created_at),
    ]);

    const content = [header.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ordini_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Ordini</h1>
        <p className="text-sm text-[#5C5048]">Monitora ordini, stati e avanzamento lavorazione.</p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                statusFilter === tab.value
                  ? "border-[#D4918F] bg-[#FDF4F3] text-[#1E1810]"
                  : "border-black/10 bg-white text-[#5C5048] hover:border-[#D4918F]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9088]" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cerca per numero ordine o cliente"
              className="h-10 w-full rounded-full border border-black/10 bg-white pl-9 pr-4 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-[#5C5048] hover:border-[#D4918F]"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        {ordersQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-[#F3EFE8]" />
            ))}
          </div>
        ) : ordersQuery.isError ? (
          <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
            Impossibile caricare gli ordini. Riprova.
          </div>
        ) : !ordersQuery.data?.data.length ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF9F6] p-8 text-center">
            <p className="text-sm text-[#5C5048]">Nessun ordine trovato con i filtri attivi.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black/7 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#9C9088]">
                    <th className="pb-3 font-medium">
                      <button type="button" onClick={() => handleSort("order_number")} className="hover:text-[#5C5048]">
                        #Ordine
                      </button>
                    </th>
                    <th className="pb-3 font-medium">
                      <button type="button" onClick={() => handleSort("customer_name")} className="hover:text-[#5C5048]">
                        Cliente
                      </button>
                    </th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Prodotti</th>
                    <th className="pb-3 font-medium">
                      <button type="button" onClick={() => handleSort("total")} className="hover:text-[#5C5048]">
                        Totale
                      </button>
                    </th>
                    <th className="pb-3 font-medium">
                      <button type="button" onClick={() => handleSort("status")} className="hover:text-[#5C5048]">
                        Stato
                      </button>
                    </th>
                    <th className="pb-3 font-medium">
                      <button type="button" onClick={() => handleSort("created_at")} className="hover:text-[#5C5048]">
                        Data
                      </button>
                    </th>
                    <th className="pb-3 font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/7">
                  {ordersQuery.data.data.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF8F4]">
                      <td className="py-3 font-medium text-[#1E1810]">{order.order_number}</td>
                      <td className="py-3 text-[#5C5048]">{order.customer_name}</td>
                      <td className="py-3 text-[#5C5048]">{order.customer_email}</td>
                      <td className="py-3 text-[#5C5048]">{Array.isArray(order.items) ? order.items.length : 0}</td>
                      <td className="py-3 text-[#5C5048]">{formatPrice(Number(order.total))}</td>
                      <td className="py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-[#5C5048]">{formatDate(order.created_at)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/ordini/${order.id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-xs text-[#5C5048]"
                          >
                            <Eye size={12} />
                            Vedi
                          </Link>
                          <select
                            value={statusDraft[order.id] ?? order.status}
                            onChange={(event) =>
                              setStatusDraft((prev) => ({
                                ...prev,
                                [order.id]: event.target.value as OrderStatus,
                              }))
                            }
                            className="h-8 rounded-full border border-black/10 bg-white px-2 text-xs text-[#5C5048] outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">In lavorazione</option>
                            <option value="shipped">Spedito</option>
                            <option value="delivered">Consegnato</option>
                            <option value="cancelled">Annullato</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleChangeStatus(order.id, order.status)}
                            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-xs text-[#5C5048]"
                          >
                            <Pencil size={12} />
                            Cambia
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[#9C9088]">
                Pagina {page} di {totalPages} · {totalItems} ordini
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Precedente
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Successiva
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

