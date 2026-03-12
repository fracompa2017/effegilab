-- Effegi Lab - Initial schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Product categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references public.categories(id),
  image_url text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2),
  price_min numeric(10,2),
  price_max numeric(10,2),
  images text[] default '{}'::text[],
  category_id uuid references public.categories(id),
  collection text,
  is_customizable boolean default true,
  has_variants boolean default false,
  stock integer default 999,
  is_active boolean default true,
  seo_title text,
  seo_description text,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  items jsonb not null,
  total numeric(10,2) not null,
  status text default 'pending',
  customization_notes text,
  shipping_address jsonb,
  stripe_payment_id text,
  created_at timestamptz default now()
);

-- CMS content blocks (page builder)
create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  page text not null unique,
  blocks jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Coupons
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null,
  discount_value numeric(10,2) not null,
  min_order numeric(10,2),
  expires_at timestamptz,
  is_active boolean default true
);

-- Useful indexes
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_is_active on public.products(is_active);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_coupons_is_active on public.coupons(is_active);

