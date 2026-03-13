"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import {
  getAccountOrdersByEmail,
  getWishlistProducts,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Order, Product } from "@/types";

type AccountTab = "orders" | "profile" | "wishlist";

type AccountUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  shippingAddress: string;
};

type AccountClientProps = {
  user: AccountUser;
};

const WISHLIST_STORAGE_KEY = "effegi-wishlist";

function parseLocalWishlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function initials(name: string, surname: string) {
  return `${name.trim().charAt(0) || "E"}${surname.trim().charAt(0) || "L"}`.toUpperCase();
}

function orderProductsLabel(order: Order) {
  if (!Array.isArray(order.items) || !order.items.length) {
    return "Nessun prodotto";
  }

  return order.items
    .slice(0, 2)
    .map((item) => item.product_name)
    .join(" · ");
}

export function AccountClient({ user }: AccountClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<AccountTab>("orders");
  const [profileName, setProfileName] = useState(user.firstName);
  const [profileSurname, setProfileSurname] = useState(user.lastName);
  const [profilePhone, setProfilePhone] = useState(user.phone);
  const [profileAddress, setProfileAddress] = useState(user.shippingAddress);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["account-orders", user.email],
    queryFn: () => getAccountOrdersByEmail(user.email),
    refetchInterval: 30_000,
  });

  const wishlistQuery = useQuery({
    queryKey: ["account-wishlist", user.id],
    queryFn: async () => {
      const localIds = parseLocalWishlist();

      if (localIds.length > 0) {
        const rows = localIds.map((productId) => ({
          user_id: user.id,
          product_id: productId,
        }));

        await supabase.from("wishlists").upsert(rows, { onConflict: "user_id,product_id" });
        window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
      }

      return getWishlistProducts(user.id);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: profileName.trim(),
          last_name: profileSurname.trim(),
          phone: profilePhone.trim(),
          shipping_address: profileAddress.trim(),
          full_name: `${profileName} ${profileSurname}`.trim(),
        },
      });

      if (updateError) {
        throw updateError;
      }
    },
    onSuccess: () => {
      setError(null);
      setFeedback("Profilo aggiornato con successo.");
    },
    onError: () => {
      setFeedback(null);
      setError("Non sono riuscito a salvare il profilo. Riprova.");
    },
  });

  const removeWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error: deleteError } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (deleteError) {
        throw deleteError;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account-wishlist", user.id] });
    },
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  async function handlePasswordReset() {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (resetError) {
      setFeedback(null);
      setError("Invio email reset non riuscito. Riprova.");
      return;
    }

    setError(null);
    setFeedback("Email di reset password inviata.");
  }

  const wishlistProducts = wishlistQuery.data ?? [];

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-black/7 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F6E9E8] text-sm font-semibold text-[#1E1810]">
            {initials(profileName, profileSurname)}
          </div>
          <div>
            <h1 className="font-serif text-4xl text-[#1E1810]">Ciao, {profileName || "Sposa"}!</h1>
            <p className="text-sm text-[#5C5048]">Benvenuta nella tua area personale.</p>
          </div>
        </div>
      </header>

      <nav className="grid grid-cols-3 gap-2 rounded-2xl border border-black/7 bg-white p-2">
        {[
          { id: "orders", label: "Ordini" },
          { id: "profile", label: "Profilo" },
          { id: "wishlist", label: "Wishlist" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as AccountTab)}
            className={cn(
              "min-h-12 rounded-xl text-sm font-medium",
              activeTab === tab.id ? "bg-[#F7ECEB] text-[#1E1810]" : "text-[#5C5048]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "orders" ? (
        <section className="space-y-3">
          {ordersQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-[#ECE5DA]" />
            ))
          ) : ordersQuery.isError ? (
            <div className="rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
              Non riesco a caricare i tuoi ordini in questo momento.
            </div>
          ) : (ordersQuery.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-6 text-center">
              <p className="text-[#5C5048]">Non hai ancora ordini.</p>
              <Link href="/shop" className="mt-2 inline-flex text-sm font-medium text-[#1E1810] underline">
                Scopri il catalogo →
              </Link>
            </div>
          ) : (
            (ordersQuery.data ?? []).map((order) => (
              <Link
                key={order.id}
                href={`/account/ordini/${order.id}`}
                className="block rounded-2xl border border-black/7 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-[#1E1810]">{order.order_number}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#8D8177]">{formatDate(order.created_at)}</p>
                <p className="mt-2 text-sm text-[#5C5048]">{orderProductsLabel(order)}</p>
                <p className="mt-2 text-sm font-semibold text-[#1E1810]">{formatPrice(order.total)}</p>
              </Link>
            ))
          )}
        </section>
      ) : null}

      {activeTab === "profile" ? (
        <section className="rounded-2xl border border-black/7 bg-white p-5">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setFeedback(null);
              setError(null);
              updateProfileMutation.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-[#5C5048]">
                <span>Nome</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
                />
              </label>
              <label className="space-y-1 text-sm text-[#5C5048]">
                <span>Cognome</span>
                <input
                  type="text"
                  value={profileSurname}
                  onChange={(event) => setProfileSurname(event.target.value)}
                  className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
                />
              </label>
            </div>

            <label className="space-y-1 text-sm text-[#5C5048]">
              <span>Email</span>
              <input
                type="email"
                value={user.email}
                readOnly
                className="h-12 w-full rounded-xl border border-[#E8DED2] bg-[#F7F3EE] px-3 text-[16px] text-[#877A70]"
              />
            </label>

            <label className="space-y-1 text-sm text-[#5C5048]">
              <span>Telefono</span>
              <input
                type="tel"
                value={profilePhone}
                onChange={(event) => setProfilePhone(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#E8DED2] px-3 text-[16px] outline-none focus:border-[#D4918F]"
              />
            </label>

            <label className="space-y-1 text-sm text-[#5C5048]">
              <span>Indirizzo di spedizione predefinito</span>
              <textarea
                value={profileAddress}
                onChange={(event) => setProfileAddress(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#E8DED2] px-3 py-2 text-[16px] outline-none focus:border-[#D4918F]"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                Salva modifiche
              </button>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D7CEC1] px-4 text-sm font-medium text-[#5C5048]"
              >
                Cambia password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#EDC6C3] px-4 text-sm font-medium text-[#A24D49]"
              >
                Logout
              </button>
            </div>

            {feedback ? (
              <div className="rounded-xl border border-[#CFE4D4] bg-[#EFF8F1] px-3 py-2 text-sm text-[#44664F]">
                {feedback}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] px-3 py-2 text-sm text-[#A24D49]">
                {error}
              </div>
            ) : null}
          </form>
        </section>
      ) : null}

      {activeTab === "wishlist" ? (
        <section>
          {wishlistQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-[4/5] animate-pulse rounded-xl bg-[#ECE5DA]" />
              ))}
            </div>
          ) : wishlistQuery.isError ? (
            <div className="rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
              Non riesco a caricare la wishlist.
            </div>
          ) : wishlistProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-6 text-center">
              <p className="text-[#5C5048]">La tua wishlist è vuota.</p>
              <p className="mt-1 text-sm text-[#7F736A]">
                Aggiungi un cuoricino ai prodotti che ti piacciono!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {wishlistProducts.map((product: Product) => (
                <article key={product.id} className="overflow-hidden rounded-xl border border-black/7 bg-white">
                  <Link href={`/prodotto/${product.slug}`} className="relative block aspect-[4/5] bg-[#EFE8DC]">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        loader={cloudinaryLoader}
                        sizes="(max-width: 640px) 44vw, 28vw"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="space-y-2 p-3">
                    <Link href={`/prodotto/${product.slug}`} className="line-clamp-2 text-sm font-medium text-[#1E1810]">
                      {product.name}
                    </Link>
                    <p className="text-sm font-semibold text-[#1E1810]">
                      {formatPrice(product.price_min ?? product.price ?? 0)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeWishlistMutation.mutate(product.id)}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#E8DED2] text-xs font-medium text-[#5C5048]"
                    >
                      Rimuovi
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
