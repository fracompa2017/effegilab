import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItem } from "@/types";

const FREE_SHIPPING_THRESHOLD = 150;
const LAB15_COUPON = "LAB15";
const LAB15_DISCOUNT_PERCENTAGE = 15;

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  discount: number;
  isLoading: boolean;
  totalItems: number;
  subtotal: number;
  total: number;
  freeShipping: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: (isOpen?: boolean) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
};

type CartSummary = Pick<
  CartStore,
  "totalItems" | "subtotal" | "total" | "discount" | "freeShipping"
>;

function computeCartSummary(items: CartItem[], couponCode: string | null): CartSummary {
  const subtotal = Number(
    items
      .reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
      .toFixed(2),
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const discount =
    couponCode === LAB15_COUPON
      ? Number(((subtotal * LAB15_DISCOUNT_PERCENTAGE) / 100).toFixed(2))
      : 0;
  const total = Number(Math.max(subtotal - discount, 0).toFixed(2));

  return {
    totalItems,
    subtotal,
    discount,
    total,
    freeShipping: total >= FREE_SHIPPING_THRESHOLD,
  };
}

function cartItemKey(item: CartItem) {
  return `${item.product.id}-${JSON.stringify(item.selected_options)}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      discount: 0,
      isLoading: false,
      totalItems: 0,
      subtotal: 0,
      total: 0,
      freeShipping: false,
      addItem: (item) =>
        set((state) => {
          const itemKey = cartItemKey(item);
          const existing = state.items.find((entry) => cartItemKey(entry) === itemKey);

          const items = existing
            ? state.items.map((entry) =>
                cartItemKey(entry) === itemKey
                  ? { ...entry, quantity: entry.quantity + item.quantity }
                  : entry,
              )
            : [...state.items, item];

          return {
            items,
            ...computeCartSummary(items, state.couponCode),
          };
        }),
      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((entry) => entry.product.id !== productId);
          return {
            items,
            ...computeCartSummary(items, state.couponCode),
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((entry) => entry.product.id !== productId)
              : state.items.map((entry) =>
                  entry.product.id === productId ? { ...entry, quantity } : entry,
                );

          return {
            items,
            ...computeCartSummary(items, state.couponCode),
          };
        }),
      clearCart: () =>
        set({
          items: [],
          couponCode: null,
          discount: 0,
          totalItems: 0,
          subtotal: 0,
          total: 0,
          freeShipping: false,
        }),
      toggleCart: (isOpen) =>
        set((state) => ({
          isOpen: typeof isOpen === "boolean" ? isOpen : !state.isOpen,
        })),
      applyCoupon: (code) => {
        const normalized = code.trim().toUpperCase();
        const isValid = normalized === LAB15_COUPON;

        set({ isLoading: true });

        const couponCode = isValid ? normalized : null;
        const summary = computeCartSummary(get().items, couponCode);

        set({
          isLoading: false,
          couponCode,
          ...summary,
        });

        return isValid;
      },
      removeCoupon: () => {
        const summary = computeCartSummary(get().items, null);
        set({
          couponCode: null,
          ...summary,
        });
      },
    }),
    {
      name: "effegi-cart-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        const summary = computeCartSummary(state.items, state.couponCode);
        state.totalItems = summary.totalItems;
        state.subtotal = summary.subtotal;
        state.discount = summary.discount;
        state.total = summary.total;
        state.freeShipping = summary.freeShipping;
      },
    },
  ),
);
