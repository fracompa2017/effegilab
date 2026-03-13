export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  images: string[];
  category_id: string | null;
  collection: string | null;
  is_customizable: boolean;
  has_variants: boolean;
  stock: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  options: Record<string, string | number | boolean | null>;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customization_notes: string | null;
  shipping_address: Record<string, string | null> | null;
  stripe_payment_id: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected_options: Record<string, string | number | boolean | null>;
  customizationNotes?: string;
}

export interface PageBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  order: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order: number | null;
  expires_at: string | null;
  is_active: boolean;
}
