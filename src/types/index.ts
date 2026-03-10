export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  priceMin?: number;
  priceMax?: number;
  images: string[];
  categoryId?: string;
  collection?: string;
  isCustomizable: boolean;
  hasVariants: boolean;
  stock: number;
  isActive: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  sortOrder: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled";
  customizationNotes?: string;
  createdAt?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

export type PageBlockType = "hero" | "text" | "image";

export type PageBlock = {
  id: string;
  type: PageBlockType;
  title?: string;
  text?: string;
  imageUrl?: string;
  backgroundColor?: string;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder?: number;
  expiresAt?: string;
  isActive: boolean;
};
