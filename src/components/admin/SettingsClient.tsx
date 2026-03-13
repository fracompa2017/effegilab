"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SettingsKey = "store" | "shipping" | "payments" | "whatsapp" | "email";
type TabKey = "store" | "shipping" | "payments" | "whatsapp" | "email" | "api_keys";

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

type ApiKeyRow = {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
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

async function fetchApiKeys(): Promise<ApiKeyRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id,name,key,enabled,last_used_at,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ApiKeyRow[];
}

function maskApiKey(key: string) {
  if (key.length <= 8) {
    return "********";
  }
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Mai";
  }

  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateApiKey(length = 32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let output = "";
  for (const byte of bytes) {
    output += alphabet[byte % alphabet.length];
  }

  return output;
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
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [paymentsSettings, setPaymentsSettings] = useState<PaymentsSettings | null>(null);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [latestCreatedKey, setLatestCreatedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettingsRows,
    refetchInterval: 30_000,
  });

  const apiKeysQuery = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: fetchApiKeys,
    refetchInterval: 30_000,
  });

  const settingsMap = useMemo(
    () => new Map((settingsQuery.data ?? []).map((row) => [row.key, row.value])),
    [settingsQuery.data],
  );
  const resolvedStoreSettings = storeSettings ?? parseStoreSettings(settingsMap.get("store"));
  const resolvedShippingSettings = shippingSettings ?? parseShippingSettings(settingsMap.get("shipping"));
  const resolvedPaymentsSettings = paymentsSettings ?? parsePaymentsSettings(settingsMap.get("payments"));
  const resolvedWhatsappSettings = whatsappSettings ?? parseWhatsappSettings(settingsMap.get("whatsapp"));
  const resolvedEmailSettings = emailSettings ?? parseEmailSettings(settingsMap.get("email"));

  function updateStoreSettings(updates: Partial<StoreSettings>) {
    setStoreSettings((prev) => ({ ...(prev ?? resolvedStoreSettings), ...updates }));
  }

  function updateShippingSettings(updates: Partial<ShippingSettings>) {
    setShippingSettings((prev) => ({ ...(prev ?? resolvedShippingSettings), ...updates }));
  }

  function updatePaymentsSettings(updates: Partial<PaymentsSettings>) {
    setPaymentsSettings((prev) => ({ ...(prev ?? resolvedPaymentsSettings), ...updates }));
  }

  function updateWhatsappSettings(updates: Partial<WhatsAppSettings>) {
    setWhatsappSettings((prev) => ({ ...(prev ?? resolvedWhatsappSettings), ...updates }));
  }

  function updateEmailSettings(updates: Partial<EmailSettings>) {
    setEmailSettings((prev) => ({ ...(prev ?? resolvedEmailSettings), ...updates }));
  }

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

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      const name = newApiKeyName.trim();
      if (!name) {
        throw new Error("Inserisci un nome per la API key.");
      }

      const generatedKey = generateApiKey(32);
      const { error } = await supabase.from("api_keys").insert({
        name,
        key: generatedKey,
        enabled: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      return generatedKey;
    },
    onSuccess: async (createdKey) => {
      setLatestCreatedKey(createdKey);
      setNewApiKeyName("");
      showToast("API key creata con successo.");
      await queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore creazione API key.");
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").update({ enabled: false }).eq("id", id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      showToast("API key revocata.");
      await queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
    },
    onError: (error: Error) => {
      showToast(error.message || "Errore revoca API key.");
    },
  });

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast("API key copiata.");
    } catch {
      showToast("Impossibile copiare la API key.");
    }
  }

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
            { id: "api_keys" as const, label: "API Keys" },
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
                value={resolvedStoreSettings.name}
                onChange={(event) => updateStoreSettings({ name: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Email contatto
              <input
                value={resolvedStoreSettings.email}
                onChange={(event) => updateStoreSettings({ email: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Telefono / WhatsApp
              <input
                value={resolvedStoreSettings.phone}
                onChange={(event) => updateStoreSettings({ phone: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              P.IVA
              <input
                value={resolvedStoreSettings.vat}
                onChange={(event) => updateStoreSettings({ vat: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Indirizzo
              <input
                value={resolvedStoreSettings.address}
                onChange={(event) => updateStoreSettings({ address: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Orari apertura
              <input
                value={resolvedStoreSettings.openingHours}
                onChange={(event) => updateStoreSettings({ openingHours: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Instagram
              <input
                value={resolvedStoreSettings.instagram}
                onChange={(event) => updateStoreSettings({ instagram: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Facebook
              <input
                value={resolvedStoreSettings.facebook}
                onChange={(event) => updateStoreSettings({ facebook: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Pinterest
              <input
                value={resolvedStoreSettings.pinterest}
                onChange={(event) => updateStoreSettings({ pinterest: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "store", value: resolvedStoreSettings })}
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
                value={resolvedShippingSettings.free_threshold}
                onChange={(event) => updateShippingSettings({ free_threshold: Number(event.target.value) })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Costo spedizione standard (€)
              <input
                type="number"
                step="0.01"
                value={resolvedShippingSettings.standard_cost}
                onChange={(event) => updateShippingSettings({ standard_cost: Number(event.target.value) })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Giorni consegna
              <input
                type="number"
                value={resolvedShippingSettings.delivery_days}
                onChange={(event) => updateShippingSettings({ delivery_days: Number(event.target.value) })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
            Testo info spedizione
            <textarea
              value={resolvedShippingSettings.info_text}
              onChange={(event) => updateShippingSettings({ info_text: event.target.value })}
              rows={3}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "shipping", value: resolvedShippingSettings })}
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
                checked={resolvedPaymentsSettings.stripe}
                onChange={(checked) => updatePaymentsSettings({ stripe: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Contrassegno attivo</span>
              <Toggle
                checked={resolvedPaymentsSettings.cod}
                onChange={(checked) => updatePaymentsSettings({ cod: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3 md:col-span-2">
              <span className="text-sm text-[#1E1810]">Bonifico bancario attivo</span>
              <Toggle
                checked={resolvedPaymentsSettings.bank_transfer}
                onChange={(checked) => updatePaymentsSettings({ bank_transfer: checked })}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Costo contrassegno (€)
              <input
                type="number"
                step="0.01"
                value={resolvedPaymentsSettings.cod_fee}
                onChange={(event) => updatePaymentsSettings({ cod_fee: Number(event.target.value) })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              IBAN bonifico
              <input
                value={resolvedPaymentsSettings.iban}
                onChange={(event) => updatePaymentsSettings({ iban: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "payments", value: resolvedPaymentsSettings })}
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
              value={resolvedWhatsappSettings.number}
              onChange={(event) => updateWhatsappSettings({ number: event.target.value })}
              className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
            Messaggio pre-compilato ordine
            <textarea
              value={resolvedWhatsappSettings.prefilled_message}
              onChange={(event) => updateWhatsappSettings({ prefilled_message: event.target.value })}
              rows={4}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">WhatsApp attivo</span>
              <Toggle
                checked={resolvedWhatsappSettings.enabled}
                onChange={(checked) => updateWhatsappSettings({ enabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">CTA su prodotto</span>
              <Toggle
                checked={resolvedWhatsappSettings.show_cta_product}
                onChange={(checked) => updateWhatsappSettings({ show_cta_product: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Notifica nuovo ordine</span>
              <Toggle
                checked={resolvedWhatsappSettings.notify_new_order}
                onChange={(checked) => updateWhatsappSettings({ notify_new_order: checked })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "whatsapp", value: resolvedWhatsappSettings })}
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
                value={resolvedEmailSettings.admin_email}
                onChange={(event) => updateEmailSettings({ admin_email: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Nome mittente
              <input
                value={resolvedEmailSettings.sender_name}
                onChange={(event) => updateEmailSettings({ sender_name: event.target.value })}
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66] md:col-span-2">
              Footer email
              <textarea
                value={resolvedEmailSettings.footer_text}
                onChange={(event) => updateEmailSettings({ footer_text: event.target.value })}
                rows={3}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Conferma email cliente attiva</span>
              <Toggle
                checked={resolvedEmailSettings.confirm_customer}
                onChange={(checked) => updateEmailSettings({ confirm_customer: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
              <span className="text-sm text-[#1E1810]">Notifica ordine admin attiva</span>
              <Toggle
                checked={resolvedEmailSettings.notify_admin}
                onChange={(checked) => updateEmailSettings({ notify_admin: checked })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ key: "email", value: resolvedEmailSettings })}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {isSaving ? "Salvataggio..." : "Salva Email"}
          </button>
        </section>
      ) : null}

      {activeTab === "api_keys" ? (
        <section className="space-y-4 rounded-2xl border border-black/7 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="space-y-1 text-xs uppercase tracking-[0.08em] text-[#7A6E66]">
              Nome API key
              <input
                value={newApiKeyName}
                onChange={(event) => setNewApiKeyName(event.target.value)}
                placeholder="Es. Mobile App, Zapier, CRM"
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#D4918F]"
              />
            </label>

            <button
              type="button"
              onClick={() => createApiKeyMutation.mutate()}
              disabled={createApiKeyMutation.isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={15} />
              {createApiKeyMutation.isPending ? "Creazione..." : "Genera API key"}
            </button>
          </div>

          {latestCreatedKey ? (
            <div className="rounded-xl border border-[#E8D8C7] bg-[#FBF8F4] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7A6E66]">Nuova API key (copiala ora)</p>
              <p className="mt-1 break-all font-mono text-sm text-[#1E1810]">{latestCreatedKey}</p>
              <button
                type="button"
                onClick={() => void copyToClipboard(latestCreatedKey)}
                className="mt-2 rounded-full border border-black/10 px-3 py-1.5 text-xs text-[#5C5048]"
              >
                Copia
              </button>
            </div>
          ) : null}

          {apiKeysQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-[#F3EFE8]" />
          ) : apiKeysQuery.isError ? (
            <div className="rounded-xl border border-[#EDC6C3] bg-[#FDF0EF] p-4 text-sm text-[#A24D49]">
              Errore caricamento API keys.
            </div>
          ) : !apiKeysQuery.data?.length ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF9F6] p-6 text-sm text-[#5C5048]">
              Nessuna API key presente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black/7 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#9C9088]">
                    <th className="pb-3 font-medium">Nome</th>
                    <th className="pb-3 font-medium">Key</th>
                    <th className="pb-3 font-medium">Stato</th>
                    <th className="pb-3 font-medium">Ultimo utilizzo</th>
                    <th className="pb-3 font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/7">
                  {apiKeysQuery.data.map((apiKey) => (
                    <tr key={apiKey.id}>
                      <td className="py-3 text-[#1E1810]">{apiKey.name}</td>
                      <td className="py-3 font-mono text-xs text-[#5C5048]">{maskApiKey(apiKey.key)}</td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs",
                            apiKey.enabled ? "bg-[#EAF5EE] text-[#2E6D45]" : "bg-[#F3EFE8] text-[#7A6E66]",
                          )}
                        >
                          {apiKey.enabled ? "Attiva" : "Revocata"}
                        </span>
                      </td>
                      <td className="py-3 text-[#5C5048]">{formatDateTime(apiKey.last_used_at)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void copyToClipboard(apiKey.key)}
                            className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-[#5C5048]"
                          >
                            Copia
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeApiKeyMutation.mutate(apiKey.id)}
                            disabled={!apiKey.enabled || revokeApiKeyMutation.isPending}
                            className="rounded-full border border-[#EDC6C3] px-2.5 py-1 text-xs text-[#A24D49] disabled:opacity-50"
                          >
                            Revoca
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
      ) : null}
    </div>
  );
}
