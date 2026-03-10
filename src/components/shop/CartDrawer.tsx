"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";

type CartDrawerProps = {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
};

export function CartDrawer({ isOpen, items, onClose }: CartDrawerProps) {
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white p-6 shadow-xl transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Carrello</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Chiudi carrello">
            <X size={18} />
          </Button>
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600">Il carrello e in costruzione.</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-600">
                  {item.quantity} x {formatPrice(item.price)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">Totale: {formatPrice(total)}</p>
          <Button className="mt-3 w-full">Vai al checkout</Button>
        </div>
      </aside>
    </div>
  );
}
