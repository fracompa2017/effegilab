-- Effegi Lab - RLS base policies
-- Goal:
-- 1) Public read on catalog/content tables.
-- 2) Write access only for admin users.

-- Helper:
-- A user is admin when one of these is true:
-- - role claim in app_metadata is "admin"
-- - role claim in user_metadata is "admin"
-- - request is made with service_role key
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.role() = 'service_role'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

comment on function public.is_admin is
  'Returns true when JWT contains role=admin in metadata or request uses service_role.';

-- Enable RLS on all business tables
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.page_content enable row level security;
alter table public.coupons enable row level security;

-- CATEGORIES
drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Admin write categories" on public.categories;

create policy "Public read categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Admin write categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PRODUCTS
drop policy if exists "Public read products" on public.products;
drop policy if exists "Admin write products" on public.products;

create policy "Public read products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "Admin write products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PAGE CONTENT (page builder output)
drop policy if exists "Public read page content" on public.page_content;
drop policy if exists "Admin write page content" on public.page_content;

create policy "Public read page content"
on public.page_content
for select
to anon, authenticated
using (true);

create policy "Admin write page content"
on public.page_content
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- COUPONS
drop policy if exists "Public read active coupons" on public.coupons;
drop policy if exists "Admin write coupons" on public.coupons;

create policy "Public read active coupons"
on public.coupons
for select
to anon, authenticated
using (
  is_active = true
  and (expires_at is null or expires_at > now())
);

create policy "Admin write coupons"
on public.coupons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ORDERS
drop policy if exists "Admin full access orders" on public.orders;
drop policy if exists "Customer read own orders" on public.orders;

create policy "Admin full access orders"
on public.orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Customer read own orders"
on public.orders
for select
to authenticated
using (customer_email = coalesce(auth.jwt() ->> 'email', ''));

