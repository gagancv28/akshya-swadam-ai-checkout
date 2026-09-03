-- ============================================================
--  DEFINITIVE PERMISSIONS FIX
--  Run this in Supabase SQL Editor → New Query
-- ============================================================

-- Step 1: Disable RLS temporarily to test connection
alter table public.products disable row level security;
alter table public.orders disable row level security;
alter table public.order_items disable row level security;

-- Step 2: Grant full access to all roles
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on public.products to anon, authenticated;
grant all privileges on public.orders to anon, authenticated;
grant all privileges on public.order_items to anon, authenticated;

-- Step 3: Re-enable RLS with proper policies
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Step 4: Drop ALL old policies to start fresh
do $$
declare
  r record;
begin
  for r in (select policyname, tablename from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Step 5: Create clean simple policies (no role restriction = works for all)
create policy "allow_all_products"   on public.products   for all using (true) with check (true);
create policy "allow_all_orders"     on public.orders     for all using (true) with check (true);
create policy "allow_all_order_items" on public.order_items for all using (true) with check (true);

-- Verify it works:
select count(*) as product_count from public.products;
