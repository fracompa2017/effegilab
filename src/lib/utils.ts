import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Coupon } from "@/types";

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDate(date: string): string {
  const formatter = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formatted = formatter.format(new Date(date));
  return formatted.replace(/^./, (letter) => letter.toUpperCase());
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const serial = Math.floor(1000 + Math.random() * 9000);
  return `EL-${year}-${serial}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function calculateDiscount(price: number, coupon: Coupon | null): number {
  if (!coupon || !coupon.is_active) {
    return 0;
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return 0;
  }

  if (coupon.min_order && price < coupon.min_order) {
    return 0;
  }

  if (coupon.discount_type === "percentage") {
    return Number(((price * coupon.discount_value) / 100).toFixed(2));
  }

  if (coupon.discount_type === "fixed") {
    return Number(Math.min(price, coupon.discount_value).toFixed(2));
  }

  return 0;
}
