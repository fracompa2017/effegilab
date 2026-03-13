"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SettingsKey = "store" | "shipping" | "payments" | "whatsapp" | "email";
type TabKey = "store" | "shipping" | "payments" | "whatsapp" | "email";

type StoreSettings = {
  name: string;
  email: string;
  phone: string;
  address: string;
  vat: string;
  openingHours: string;
  instagram: string;
  facebook: string;
  pinterest: string;
};

type ShippingSettings = {
  free_threshold: number;
  standard_cost: number;
  delivery_days: number;
  info_text: string;
};

type PaymentsSettings = {
  stripe: boolean;
  cod: boolean;
  bank_transfer: boolean;
  cod_fee: number;
  iban: string;
};

type WhatsAppSettings = {
  number: string;
  prefilled_message: string;
  show_cta_product: boolean;
  notify_new_order: boolean;
  enabled: boolean;
};

type EmailSettings = {
  admin_email: string;
  sender_name: string;
  footer_text: string;
  confirm_customer: boolean;
  notify_admin: boolean;
};

type SettingsRow = {
  key: SettingsKey;
  value: Record<string, unknown>;
};

const defaultStore: StoreSettings = {
  name: "Effegi Lab",
  email: "info@effegi-lab.it",
  phone: "",
  address: "Napoli, Italia",
  vat: "04752200610",
  openingHours: "Lun-Ven 9:00 - 18:00",
  instagram: "",
  facebook: "",
  pinterest: "",
};

const defaultShipping: ShippingSettings = {
  free_threshold: 150,
  standard_cost: 6.9,
  delivery_days: 7,
  info_text: "Spedizione gratuita sopra i 150€ · Consegna 5-7 giorni",
};

const defaultPayments: PaymentsSettings = {
  stripe: true,
  cod: true,
  bank_transfer: false,
  cod_fee: 0,
  iban: "",
};

const defaultWhatsapp: WhatsAppSettings = {
  number: "",
  prefilled_message:
    "Ciao Giuseppina! Ho appena ordinato {prodotti} (ordine #{numero}). Sono disponibile per la bozza.",
  show_cta_product: true,
  notify_new_order: false,
  enabled: true,
};

const defaultEmail: EmailSettings = {
  admin_email: "info@effegi-lab.it",
  sender_name: "Effegi Lab",
  footer_text: "Con affetto, Giuseppina — Effegi Lab",
  confirm_customer: true,
  notify_admin: true,
};

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function parseStoreSettings(value: Record<string, unknown> | null | undefined): StoreSettings {
  const source = value ?? {};
  return {
    name: stringValue(source.name, defaultStore.name),
    email: stringValue(source.email, defaultStore.email),
    phone: stringValue(source.phone),
    address: stringValue(source.address, defaultStore.address),
    vat: stringValue(source.vat, defaultStore.vat),
    openingHours: stringValue(source.openingHours, defaultStore.openingHours),
    instagram: stringValue(source.instagram),
    facebook: stringValue(source.facebook),
    pinterest: stringValue(source.pinterest),
  };
}

function parseShippingSettings(value: Record<string, unknown> | null | undefined): ShippingSettings {
  const source = value ?? {};
  return {
    free_threshold: numberValue(source.free_threshold, defaultShipping.free_threshold),
    standard_cost: numberValue(source.standard_cost, defaultShipping.standard_cost),
    delivery_days: numberValue(source.delivery_days, defaultShipping.delivery_days),
    info_text: stringValue(source.info_text, defaultShipping.info_text),
  };
}

function parsePaymentsSettings(value: Record<string, unknown> | null | undefined): PaymentsSettings {
  const source = value ?? {};
  return {
    stripe: booleanValue(source.stripe, defaultPayments.stripe),
    cod: booleanValue(source.cod, defaultPayments.cod),
    bank_transfer: booleanValue(source.bank_transfer, defaultPayments.bank_transfer),
    cod_fee: numberValue(source.cod_fee, defaultPayments.cod_fee),
    iban: stringValue(source.iban),
  };
}

function parseWhatsappSettings(value: Record<string, unknown> | null | undefined): WhatsAppSettings {
  const source = value ?? {};
  return {
    number: stringValue(source.number),
    prefilled_message: stringValue(source.prefilled_message, defaultWhatsapp.prefilled_message),
    show_cta_product: booleanValue(source.show_cta_product, true),
    notify_new_order: booleanValue(source.notify_new_order, false),
    enabled: booleanValue(source.enabled, true),
  };
}

function parseEmailSettings(value: Record<string, unknown> | null | undefined): EmailSettings {
  const source = value ?? {};
  return {
    admin_email: stringValue(source.admin_email, defaultEmail.admin_email),
    sender_name: stringValue(source.sender_name, defaultEmail.sender_name),
    footer_text: stringValue(source.footer_text, defaultEmail.footer_text),
    confirm_customer: booleanValue(source.confirm_customer, true),
    notify_admin: booleanValue(source.notify_admin, true),
  };
}

async function fetchSettingsRows(): Promise<SettingsRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", ["store", "shipping", "payments", "whatsapp", "email"]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SettingsRow[];
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-8 w-14 items-center rounded-full border px-1 transition",
        checked ? "border-[#D4918F] bg-[#FCEEEE]" : "border-black/10 bg-[#F3EFE8]",
      )}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={cn(
          "h-6 w-6 rounded-full bg-white shadow transition",
          checked ? "translate-x-6" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function SettingsClient() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("store");
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStore);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShipping);
  const [paymentsSettings, setPaymentsSettings] = useState<PaymentsSettings>(defaultPayments);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>(defaultWhatsapp);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(defaultEmail);
  const [toast, setToast] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettingsRows,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const map = new Map((settingsQuery.data ?? []).map((row) => [row.key, row.value]));

    setStoreSettings(parseStoreSettings(map.get("store")));
    setShippingSettings(parseShippingSettings(map.get("shipping")));
    setPaymentsSettings(parsePaymentsSettings(map.get("payments")));
    setWhatsappSettings(parseWhatsappSettings(map.get("whatsapp")));
    setEmailSettings(parseEmailSettings(map.get("email")));
  }, [settingsQuery.data]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2500);
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { key: SettingsKey; value: Record<string, unknown> }) => {
      const { error } = await supabase.from("settings").upsert(
        {
          key: payload.key,
          value: payload.value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      showToast("Impostazioni salvate.");
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore salvataggio impostazioni.");
    },
  });

  if (settingsQuery.isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-white" />;
  }

  if (settingsQuery.isError) {
    return (
      <div className="rounded-2xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
        Errore nel caricamento impostazioni.
      </div>
    );
  }

  const isSaving = saveMutation.isPending;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-[#E6D6C8] bg-white px-4 py-2 text-sm text-[#5C5048] shadow-lg">
          {toast}
        </div>
      ) : null}

      <header className="space-y-1">
        <h1 className="font-serif text-5xl text-[#1E1810]">Impostazioni</h1>
        <p className="text-sm text-[#5C5048]">Configura negozio, spedizioni, pagamenti, WhatsApp ed email.</p>
      </header>

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "store" as const, label: "Generale" },
            { id: "shipping" as const, label: "Spedizione" },
            { id: "payments" as const, label: "Pagamenti" },
            { id: "whatsapp" as const, label: "WhatsApp" },
            { id: "email" as const, label: "Email" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                activeTab === tab.id
                  ? "border-[#D4918F] bg-[#FDF4F3] text-[#1E1810]"
                  : "border-black/10 bg-white text-[#5C5048] hover:border-[#D4918F]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "store" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Nome negozio
              <input
                value={storeSettings.name}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, name: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Email contatto
              <input
                value={storeSettings.email}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, email: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Telefono / WhatsApp
              <input
                value={storeSettings.phone}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, phone: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              P.IVA
              <input
                value={storeSettings.vat}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, vat: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Indirizzo
              <input
                value={storeSettings.address}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, address: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Orari apertura
              <input
                value={storeSettings.openingHours}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, openingHours: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Instagram
              <input
                value={storeSettings.instagram}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, instagram: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Facebook
              <input
                value={storeSettings.facebook}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, facebook: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Pinterest
              <input
                value={storeSettings.pinterest}
                onChange={(event) => setStoreSettings((prev) => ({ ...prev, pinterest: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "store", value: storeSettings })}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {isSaving ? "Salvataggio..." : "Salva Generale"}
          </button>
        </section>
      ) : null}

      {activeTab === "shipping" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Soglia spedizione gratuita (€)
              <input
                type="number"
                value={shippingSettings.free_threshold}
                onChange={(event) =>
                  setShippingSettings((prev) => ({ ...prev, free_threshold: Number(event.target.value) }))
                }
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Costo spedizione standard (€)
              <input
                type="number"
                step="0.01"
                value={shippingSettings.standard_cost}
                onChange={(event) =>
                  setShippingSettings((prev) => ({ ...prev, standard_cost: Number(event.target.value) }))
                }
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Giorni consegna
              <input
                type="number"
                value={shippingSettings.delivery_days}
                onChange={(event) =>
                  setShippingSettings((prev) => ({ ...prev, delivery_days: Number(event.target.value) }))
                }
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
            Testo info spedizione
            <textarea
              value={shippingSettings.info_text}
              onChange={(event) => setShippingSettings((prev) => ({ ...prev, info_text: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "shipping", value: shippingSettings })}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {isSaving ? "Salvataggio..." : "Salva Spedizione"}
          </button>
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Stripe attivo</span>
              <Toggle
                checked={paymentsSettings.stripe}
                onChange={(checked) => setPaymentsSettings((prev) => ({ ...prev, stripe: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Contrassegno attivo</span>
              <Toggle
                checked={paymentsSettings.cod}
                onChange={(checked) => setPaymentsSettings((prev) => ({ ...prev, cod: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3 md:col-span-2">
              <span className="text-sm text-[#1E1810]">Bonifico bancario attivo</span>
              <Toggle
                checked={paymentsSettings.bank_transfer}
                onChange={(checked) => setPaymentsSettings((prev) => ({ ...prev, bank_transfer: checked }))}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Costo contrassegno (€)
              <input
                type="number"
                step="0.01"
                value={paymentsSettings.cod_fee}
                onChange={(event) =>
                  setPaymentsSettings((prev) => ({ ...prev, cod_fee: Number(event.target.value) }))
                }
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              IBAN bonifico
              <input
                value={paymentsSettings.iban}
                onChange={(event) => setPaymentsSettings((prev) => ({ ...prev, iban: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "payments", value: paymentsSettings })}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {isSaving ? "Salvataggio..." : "Salva Pagamenti"}
          </button>
        </section>
      ) : null}

      {activeTab === "whatsapp" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
            Numero WhatsApp Business
            <input
              value={whatsappSettings.number}
              onChange={(event) => setWhatsappSettings((prev) => ({ ...prev, number: event.target.value }))}
              className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
            Messaggio pre-compilato ordine
            <textarea
              value={whatsappSettings.prefilled_message}
              onChange={(event) =>
                setWhatsappSettings((prev) => ({ ...prev, prefilled_message: event.target.value }))
              }
              rows={4}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">WhatsApp attivo</span>
              <Toggle
                checked={whatsappSettings.enabled}
                onChange={(checked) => setWhatsappSettings((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">CTA su prodotto</span>
              <Toggle
                checked={whatsappSettings.show_cta_product}
                onChange={(checked) =>
                  setWhatsappSettings((prev) => ({ ...prev, show_cta_product: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Notifica nuovo ordine</span>
              <Toggle
                checked={whatsappSettings.notify_new_order}
                onChange={(checked) =>
                  setWhatsappSettings((prev) => ({ ...prev, notify_new_order: checked }))
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "whatsapp", value: whatsappSettings })}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {isSaving ? "Salvataggio..." : "Salva WhatsApp"}
          </button>
        </section>
      ) : null}

      {activeTab === "email" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Email admin notifiche
              <input
                value={emailSettings.admin_email}
                onChange={(event) => setEmailSettings((prev) => ({ ...prev, admin_email: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Nome mittente
              <input
                value={emailSettings.sender_name}
                onChange={(event) => setEmailSettings((prev) => ({ ...prev, sender_name: event.target.value }))}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Footer email
              <textarea
                value={emailSettings.footer_text}
                onChange={(event) => setEmailSettings((prev) => ({ ...prev, footer_text: event.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Conferma email cliente attiva</span>
              <Toggle
                checked={emailSettings.confirm_customer}
                onChange={(checked) => setEmailSettings((prev) => ({ ...prev, confirm_customer: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Notifica ordine admin attiva</span>
              <Toggle
                checked={emailSettings.notify_admin}
                onChange={(checked) => setEmailSettings((prev) => ({ ...prev, notify_admin: checked }))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "email", value: emailSettings })}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {isSaving ? "Salvataggio..." : "Salva Email"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
