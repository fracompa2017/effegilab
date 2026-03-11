"use client";

import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Coupon } from "@/types";

type CouponForm = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  min_order: string;
  expires_at: string;
  is_active: boolean;
};

async function fetchCoupons() {
  const supabase = createClient();
  const { data, error } = await supabase.from("coupons").select("*").order("code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Coupon[];
}

export function AdminCouponClient() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<CouponForm>({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order: "",
    expires_at: "",
    is_active: true,
  });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const couponsQuery = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: fetchCoupons,
    refetchInterval: 30_000,
  });

  const saveCouponMutation = useMutation({
    mutationFn: async (payload: CouponForm & { id?: string }) => {
      const values = {
        code: payload.code.toUpperCase().trim(),
        discount_type: payload.discount_type,
        discount_value: Number(payload.discount_value),
        min_order: payload.min_order ? Number(payload.min_order) : null,
        expires_at: payload.expires_at ? new Date(payload.expires_at).toISOString() : null,
        is_active: payload.is_active,
      };

      if (payload.id) {
        const { error } = await supabase.from("coupons").update(values).eq("id", payload.id);
        if (error) {
          throw new Error(error.message);
        }
        return;
      }

      const { error } = await supabase.from("coupons").insert(values);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", couponId);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async (payload: { id: string; nextValue: boolean }) => {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: payload.nextValue })
        .eq("id", payload.id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  function resetForm() {
    setForm({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_order: "",
      expires_at: "",
      is_active: true,
    });
    setEditingCouponId(null);
  }

  async function handleSaveCoupon() {
    if (!form.code.trim()) {
      setMessage("Il codice coupon è obbligatorio.");
      return;
    }
    if (!form.discount_value) {
      setMessage("Il valore sconto è obbligatorio.");
      return;
    }

    setMessage(null);
    try {
      await saveCouponMutation.mutateAsync({ ...form, id: editingCouponId ?? undefined });
      setMessage(editingCouponId ? "Coupon aggiornato." : "Coupon creato.");
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore salvataggio coupon.");
    }
  }

  function startEdit(coupon: Coupon) {
    setEditingCouponId(coupon.id);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order: coupon.min_order ? String(coupon.min_order) : "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
      is_active: coupon.is_active,
    });
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Coupon</h1>
        <p className="text-sm text-[#5C5048]">
          Gestisci codici sconto, scadenze e stato attivo. LAB15 è già disponibile.
        </p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-5">
        <h2 className="font-serif text-3xl text-[#1E1810]">
          {editingCouponId ? "Modifica coupon" : "Nuovo coupon"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[160px_180px_140px_160px_170px_120px_auto]">
          <input
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
            placeholder="Codice"
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <select
            value={form.discount_type}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                discount_type: event.target.value as "percentage" | "fixed",
              }))
            }
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="percentage">Percentuale</option>
            <option value="fixed">Importo fisso</option>
          </select>
          <input
            type="number"
            value={form.discount_value}
            onChange={(event) => setForm((prev) => ({ ...prev, discount_value: event.target.value }))}
            placeholder="Valore"
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <input
            type="number"
            value={form.min_order}
            onChange={(event) => setForm((prev) => ({ ...prev, min_order: event.target.value }))}
            placeholder="Ordine minimo"
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <input
            type="date"
            value={form.expires_at}
            onChange={(event) => setForm((prev) => ({ ...prev, expires_at: event.target.value }))}
            className="h-10 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          />
          <label className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 text-sm text-[#5C5048]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Attivo
          </label>
          <div className="flex items-center gap-2">
            <Button onClick={() => void handleSaveCoupon()}>
              <Plus size={14} className="mr-1" />
              {editingCouponId ? "Aggiorna" : "Crea"}
            </Button>
            {editingCouponId ? (
              <Button variant="outline" onClick={resetForm}>
                Annulla
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-xl border border-black/7 bg-white px-4 py-2 text-sm text-[#5C5048]">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        {couponsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-[#F3EFE8]" />
            ))}
          </div>
        ) : couponsQuery.isError ? (
          <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
            Errore caricamento coupon.
          </div>
        ) : !couponsQuery.data?.length ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF9F6] p-8 text-center">
            <p className="text-sm text-[#5C5048]">Nessun coupon disponibile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/7 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#9C9088]">
                  <th className="pb-3 font-medium">Codice</th>
                  <th className="pb-3 font-medium">Tipo sconto</th>
                  <th className="pb-3 font-medium">Valore</th>
                  <th className="pb-3 font-medium">Ordine minimo</th>
                  <th className="pb-3 font-medium">Scadenza</th>
                  <th className="pb-3 font-medium">Attivo</th>
                  <th className="pb-3 font-medium">Utilizzi</th>
                  <th className="pb-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/7">
                {couponsQuery.data.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 font-medium text-[#1E1810]">{coupon.code}</td>
                    <td className="py-3 text-[#5C5048]">
                      {coupon.discount_type === "percentage" ? "Percentuale" : "Importo fisso"}
                    </td>
                    <td className="py-3 text-[#5C5048]">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td className="py-3 text-[#5C5048]">
                      {coupon.min_order ? formatPrice(coupon.min_order) : "—"}
                    </td>
                    <td className="py-3 text-[#5C5048]">
                      {coupon.expires_at ? formatDate(coupon.expires_at) : "Nessuna"}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleCouponMutation.mutate({
                            id: coupon.id,
                            nextValue: !coupon.is_active,
                          })
                        }
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          coupon.is_active
                            ? "bg-[#E9F8EE] text-[#2F7B45]"
                            : "bg-[#F3EFE8] text-[#7A6E66]"
                        }`}
                      >
                        {coupon.is_active ? "Sì" : "No"}
                      </button>
                    </td>
                    <td className="py-3 text-[#5C5048]">0</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(coupon)}
                          className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-xs text-[#5C5048]"
                        >
                          <Edit3 size={12} />
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCouponMutation.mutate(coupon.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#EDC6C3] px-2 py-1 text-xs text-[#A24D49]"
                        >
                          <Trash2 size={12} />
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

