-- Effegi Lab - Demo seed data
-- Safe to run multiple times (uses upsert).

-- Categories
insert into public.categories (name, slug, description, image_url, sort_order)
values
  ('Inviti', 'inviti', 'Inviti eleganti e personalizzabili per matrimonio.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', 1),
  ('Coordinati Cerimonia', 'coordinati-cerimonia', 'Menu, segnaposto, tableau e coordinati grafici.', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3', 2),
  ('Bomboniere', 'bomboniere', 'Dettagli e confezioni coordinate per gli ospiti.', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486', 3)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

-- Products
with categories_ref as (
  select id, slug from public.categories
)
insert into public.products (
  name,
  slug,
  description,
  price,
  images,
  category_id,
  collection,
  is_customizable,
  has_variants,
  stock,
  is_active,
  seo_title,
  seo_description
)
values
  (
    'Invito Matrimonio Elegance',
    'invito-matrimonio-elegance',
    'Invito premium con stampa su carta avorio e dettagli oro.',
    4.90,
    array['https://images.unsplash.com/photo-1519741497674-611481863552'],
    (select id from categories_ref where slug = 'inviti'),
    'Elegance',
    true,
    false,
    250,
    true,
    'Invito Matrimonio Elegance | Effegi Lab',
    'Invito matrimonio elegante con finiture premium e personalizzazione completa.'
  ),
  (
    'Menu Ricevimento Gold',
    'menu-ricevimento-gold',
    'Menu verticale coordinato con la linea inviti Gold Collection.',
    3.50,
    array['https://images.unsplash.com/photo-1478145046317-39f10e56b5e9'],
    (select id from categories_ref where slug = 'coordinati-cerimonia'),
    'Gold Collection',
    true,
    false,
    500,
    true,
    'Menu Ricevimento Gold | Effegi Lab',
    'Menu ricevimento personalizzato in stile gold, ideale per wedding stationery.'
  ),
  (
    'Segnaposto Minimal',
    'segnaposto-minimal',
    'Segnaposto minimal con font calligrafico e carta textured.',
    2.20,
    array['https://images.unsplash.com/photo-1463320726281-696a485928c7'],
    (select id from categories_ref where slug = 'coordinati-cerimonia'),
    'Minimal',
    true,
    false,
    800,
    true,
    'Segnaposto Minimal | Effegi Lab',
    'Segnaposto matrimonio minimal e personalizzabile, perfetto per tavoli eleganti.'
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  images = excluded.images,
  category_id = excluded.category_id,
  collection = excluded.collection,
  is_customizable = excluded.is_customizable,
  has_variants = excluded.has_variants,
  stock = excluded.stock,
  is_active = excluded.is_active,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;

-- Home page blocks
insert into public.page_content (page, blocks)
values (
  'home',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'hero-home-1',
      'type', 'hero',
      'title', 'Wedding Stationery su misura',
      'text', 'Inviti, coordinati e dettagli personalizzati per il tuo giorno speciale.'
    ),
    jsonb_build_object(
      'id', 'text-home-1',
      'type', 'text',
      'title', 'Collezioni in evidenza',
      'text', 'Scopri Elegance, Gold Collection e Minimal.'
    )
  )
)
on conflict (page) do update
set
  blocks = excluded.blocks,
  updated_at = now();

-- Coupons
insert into public.coupons (code, discount_type, discount_value, min_order, expires_at, is_active)
values
  ('WELCOME10', 'percentage', 10.00, 50.00, now() + interval '90 days', true),
  ('SPOSI25', 'fixed', 25.00, 150.00, now() + interval '45 days', true)
on conflict (code) do update
set
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  min_order = excluded.min_order,
  expires_at = excluded.expires_at,
  is_active = excluded.is_active;

