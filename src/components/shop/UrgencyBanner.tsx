"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type UrgencyBannerProps = {
  type: "coupon" | "seasonal" | "default";
  expiryDate?: Date;
  message?: string;
};

function getDefaultMessage(type: UrgencyBannerProps["type"]) {
  if (type === "coupon") {
    return "🎉 Codice LAB15 attivo — 15% su tutto fino a domenica";
  }
  if (type === "seasonal") {
    return "📅 Matrimoni estate 2025 — prenota ora la tua consulenza gratuita";
  }
  return "✨ Bozza grafica GRATUITA con ogni ordine";
}

function formatTimeRemaining(targetDate: Date) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    return "in scadenza";
  }

  const totalHours = Math.floor(diff / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `${days}g ${hours}h`;
  }
  return `${hours}h`;
}

export function UrgencyBanner({ type, expiryDate, message }: UrgencyBannerProps) {
  const storageKey = `effegilab-urgency-${type}-closed`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(storageKey) === "1";
  });
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!expiryDate || type !== "coupon") {
      return;
    }

    const update = () => setCountdown(formatTimeRemaining(expiryDate));
    update();
    const timer = window.setInterval(update, 60_000);

    return () => window.clearInterval(timer);
  }, [expiryDate, type]);

  const text = useMemo(() => message || getDefaultMessage(type), [message, type]);

  if (dismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-[60] h-10 bg-[#D4918F] px-4 text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center">
        <p className="truncate pr-8 text-center text-[12px] font-medium md:text-[13px]">
          {text}
          {type === "coupon" && countdown ? ` · termina tra ${countdown}` : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            window.localStorage.setItem(storageKey, "1");
          }}
          className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-full"
          aria-label="Chiudi banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
