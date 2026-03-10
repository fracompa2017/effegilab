import { create } from "zustand";

import type { CartItem } from "@/types";

type CartStore = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  update: (productId: string, quantity: number) => void;
  clear: () => void;
  totale: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  add: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.productId === item.productId);

      if (existing) {
        return {
          items: state.items.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: entry.quantity + item.quantity }
              : entry,
          ),
        };
      }

      return { items: [...state.items, item] };
    }),
  remove: (productId) =>
    set((state) => ({
      items: state.items.filter((entry) => entry.productId !== productId),
    })),
  update: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((entry) => entry.productId !== productId)
          : state.items.map((entry) =>
              entry.productId === productId ? { ...entry, quantity } : entry,
            ),
    })),
  clear: () => set({ items: [] }),
  totale: () =>
    get().items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0),
}));
