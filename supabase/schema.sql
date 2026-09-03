-- ============================================================
--  Akshya Swadam — Supabase Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Products ────────────────────────────────────────────────
create table if not exists products (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  description      text,
  price_in_paise   integer not null check (price_in_paise > 0),
  stock_quantity   integer not null default 0,
  image_emoji      text default '🌶️',
  created_at       timestamptz default now()
);

-- ─── Orders ──────────────────────────────────────────────────
create table if not exists orders (
  id                 uuid primary key default uuid_generate_v4(),
  razorpay_order_id  text unique,
  total_amount       integer not null,   -- in paise
  status             text not null default 'pending'
                       check (status in ('pending', 'paid', 'failed')),
  cart_snapshot      jsonb,              -- snapshot of items at order time
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─── Order Items ─────────────────────────────────────────────
create table if not exists order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid references orders(id) on delete cascade,
  product_id  uuid references products(id),
  quantity    integer not null check (quantity > 0),
  unit_price  integer not null   -- price_in_paise at time of order
);

-- ─── RLS Policies (Row Level Security) ───────────────────────
alter table products enable row level security;
alter table orders   enable row level security;
alter table order_items enable row level security;

-- Grant schema + table access to anon role (required when RLS is on)
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select, insert, update on public.orders to anon, authenticated;
grant select, insert on public.order_items to anon, authenticated;

-- Allow public read on products
create policy "anon_read_products"
  on products for select to anon, authenticated using (true);

-- Allow insert on orders (anon users placing orders)
create policy "anon_insert_orders"
  on orders for insert to anon, authenticated with check (true);

create policy "anon_select_orders"
  on orders for select to anon, authenticated using (true);

create policy "anon_update_orders"
  on orders for update to anon, authenticated using (true);

create policy "anon_insert_order_items"
  on order_items for insert to anon, authenticated with check (true);

create policy "anon_select_order_items"
  on order_items for select to anon, authenticated using (true);

-- ─── Seed Data: Akshya Swadam Products ───────────────────────
insert into products (name, description, price_in_paise, stock_quantity, image_emoji) values
(
  'Signature Garam Masala',
  'Our flagship blend of 18 whole spices slow-roasted and ground fresh. The heart of every Akshya Swadam dish.',
  34900,
  200,
  '🫙'
),
(
  'Premium Turmeric Powder',
  'Pure Erode turmeric with 5%+ curcumin content. Vibrant colour, earthy aroma, no fillers.',
  18900,
  350,
  '✨'
),
(
  'Authentic Sambar Powder',
  'Traditional Brahmin-style sambar powder with roasted coriander, cumin, and curry leaves.',
  24900,
  180,
  '🍲'
),
(
  'Rasam Powder',
  'Tangy and peppery rasam powder made from black pepper, coriander, and dry red chilli.',
  21900,
  220,
  '🌿'
),
(
  'Byadgi Chilli Powder',
  'Mild-heat, deep-red Byadgi chillies from Karnataka. Rich colour without the burn.',
  27900,
  150,
  '🌶️'
)
on conflict do nothing;
