-- Fayoum delivery, step 2: catalog + customer ordering.
-- Paste the whole file into Supabase > SQL Editor > Run. Safe to run again.

-- =====================================================================
-- Catalog
-- =====================================================================

create table if not exists public.categories (
  id text primary key,
  name text not null,
  icon text not null,
  sort int not null default 0,
  -- Share of each order's goods the store pays us (0.100 = 10%).
  commission_rate numeric(4,3) not null check (commission_rate >= 0 and commission_rate < 1)
);

create table if not exists public.zones (
  id text primary key,
  name text not null,
  base_fee int not null check (base_fee >= 0),
  extra_store_fee int not null default 5 check (extra_store_fee >= 0),
  is_active boolean not null default true
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mark text not null,
  category_id text not null references public.categories(id),
  area text not null,
  zone_id text references public.zones(id),
  lat double precision,
  lng double precision,
  rating numeric(2,1) not null default 5.0,
  eta_min int not null check (eta_min > 0),
  eta_max int not null check (eta_max >= eta_min),
  tint text not null default '#EFE9DD',
  is_pharmacy boolean not null default false,
  daily_prices boolean not null default false,
  -- Printed on the store's sticker; customers who scan it are linked to the store.
  referral_code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  note text not null default '',
  price int not null check (price > 0),
  is_available boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists products_store_idx on public.products (store_id);

-- =====================================================================
-- Customers
-- =====================================================================

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  zone_id text not null references public.zones(id),
  details text not null,
  landmark text not null default '',
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);

-- Stores whose code the customer scanned ("محلاتك"). Their orders pay half commission.
create table if not exists public.customer_stores (
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

-- =====================================================================
-- Orders: one order can collect from up to three stores in one trip.
-- =====================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  customer_id uuid not null references auth.users(id),
  status text not null default 'placed'
    check (status in ('placed', 'preparing', 'picked_up', 'on_the_way', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('cash', 'wallet')),
  missing_policy text not null check (missing_policy in ('call', 'substitute', 'remove')),
  zone_id text not null references public.zones(id),
  address_text text not null,
  landmark text not null default '',
  lat double precision,
  lng double precision,
  store_count int not null check (store_count between 1 and 3),
  subtotal int not null,
  delivery_fee int not null,
  service_fee int not null default 0,
  total int not null,
  guaranteed_minutes int not null,
  placed_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists orders_customer_idx on public.orders (customer_id, placed_at desc);

create table if not exists public.order_stores (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'ready', 'picked_up', 'rerouted')),
  subtotal int not null,
  commission_rate numeric(4,3) not null,
  commission int not null,
  via_store_code boolean not null default false,
  rerouted_from uuid references public.stores(id),
  unique (order_id, store_id)
);
create index if not exists order_stores_store_idx on public.order_stores (store_id, status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_store_id uuid not null references public.order_stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  note text not null default '',
  unit_price int not null,
  qty int not null check (qty between 1 and 50),
  line_total int not null
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- =====================================================================
-- Access: everyone reads the catalog; customers read only their own rows.
-- Orders are written only through place_order(), which prices them itself.
-- =====================================================================

alter table public.categories enable row level security;
alter table public.zones enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.customer_stores enable row level security;
alter table public.orders enable row level security;
alter table public.order_stores enable row level security;
alter table public.order_items enable row level security;

grant select on public.categories, public.zones, public.stores, public.products to anon, authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, delete on public.customer_stores to authenticated;
grant select on public.orders, public.order_stores, public.order_items to authenticated;

drop policy if exists "categories readable" on public.categories;
create policy "categories readable" on public.categories for select to anon, authenticated using (true);

drop policy if exists "zones readable" on public.zones;
create policy "zones readable" on public.zones for select to anon, authenticated using (is_active);

drop policy if exists "active stores readable" on public.stores;
create policy "active stores readable" on public.stores for select to anon, authenticated using (is_active);

drop policy if exists "products of active stores readable" on public.products;
create policy "products of active stores readable" on public.products for select to anon, authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.is_active));

drop policy if exists "own addresses" on public.addresses;
create policy "own addresses" on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own linked stores readable" on public.customer_stores;
create policy "own linked stores readable" on public.customer_stores for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "own linked stores removable" on public.customer_stores;
create policy "own linked stores removable" on public.customer_stores for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "own orders readable" on public.orders;
create policy "own orders readable" on public.orders for select to authenticated
  using (customer_id = (select auth.uid()));

drop policy if exists "own order stores readable" on public.order_stores;
create policy "own order stores readable" on public.order_stores for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));

drop policy if exists "own order items readable" on public.order_items;
create policy "own order items readable" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));

-- =====================================================================
-- place_order: prices the cart from the database, never from the app.
--   p_items   [{"product_id": "...", "qty": 2}, ...]
--   p_payment 'cash' | 'wallet'
--   p_missing 'call' | 'substitute' | 'remove'
--   p_address {"zone_id": "...", "details": "...", "landmark": "...", "lat": 0, "lng": 0}
-- =====================================================================

create or replace function public.place_order(p_items jsonb, p_payment text, p_missing text, p_address jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_zone public.zones%rowtype;
  v_store_count int;
  v_max_eta int;
  v_subtotal int;
  v_fee int;
  v_minutes int;
  v_total int;
  v_order_id uuid;
  v_number bigint;
  v_order_store_id uuid;
  v_rate numeric(4,3);
  r record;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_payment is null or p_payment not in ('cash', 'wallet') then
    raise exception 'bad payment method';
  end if;
  if p_missing is null or p_missing not in ('call', 'substitute', 'remove') then
    raise exception 'bad missing-item policy';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'empty cart';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'empty cart';
  end if;
  if jsonb_array_length(p_items) > 60 then
    raise exception 'too many lines';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
    where li.product_id is null or li.qty is null or li.qty < 1 or li.qty > 50
  ) then
    raise exception 'bad quantity';
  end if;

  select * into v_zone from public.zones z where z.id = p_address->>'zone_id' and z.is_active;
  if not found then
    raise exception 'unknown delivery zone';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
    left join public.products p on p.id = li.product_id and p.is_available
    left join public.stores s on s.id = p.store_id and s.is_active
    where s.id is null
  ) then
    raise exception 'item unavailable';
  end if;

  select count(distinct p.store_id), max(s.eta_max), sum(p.price * li.qty)
    into v_store_count, v_max_eta, v_subtotal
  from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
  join public.products p on p.id = li.product_id
  join public.stores s on s.id = p.store_id;

  if v_store_count > 3 then
    raise exception 'one trip collects from at most 3 stores';
  end if;

  v_fee := v_zone.base_fee + v_zone.extra_store_fee * (v_store_count - 1);
  v_minutes := v_max_eta + 5 + 5 * (v_store_count - 1);
  v_total := v_subtotal + v_fee;

  insert into public.orders (
    customer_id, payment_method, missing_policy, zone_id, address_text, landmark, lat, lng,
    store_count, subtotal, delivery_fee, total, guaranteed_minutes
  ) values (
    v_user, p_payment, p_missing, v_zone.id,
    coalesce(p_address->>'details', ''), coalesce(p_address->>'landmark', ''),
    (p_address->>'lat')::double precision, (p_address->>'lng')::double precision,
    v_store_count, v_subtotal, v_fee, v_total, v_minutes
  )
  returning id, number into v_order_id, v_number;

  for r in
    select s.id as store_id,
           c.commission_rate,
           sum(p.price * li.qty)::int as subtotal,
           exists (
             select 1 from public.customer_stores cs where cs.user_id = v_user and cs.store_id = s.id
           ) as via_code
    from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
    join public.products p on p.id = li.product_id
    join public.stores s on s.id = p.store_id
    join public.categories c on c.id = s.category_id
    group by s.id, c.commission_rate
  loop
    -- Customers the store brought in themselves cost the store half the commission.
    v_rate := case when r.via_code then r.commission_rate / 2 else r.commission_rate end;

    insert into public.order_stores (order_id, store_id, subtotal, commission_rate, commission, via_store_code)
    values (v_order_id, r.store_id, r.subtotal, v_rate, round(r.subtotal * v_rate)::int, r.via_code)
    returning id into v_order_store_id;

    insert into public.order_items (order_id, order_store_id, product_id, name, note, unit_price, qty, line_total)
    select v_order_id, v_order_store_id, p.id, p.name, p.note, p.price, sum(li.qty)::int, (p.price * sum(li.qty))::int
    from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
    join public.products p on p.id = li.product_id
    where p.store_id = r.store_id
    group by p.id, p.name, p.note, p.price;
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'number', v_number,
    'store_count', v_store_count,
    'subtotal', v_subtotal,
    'delivery_fee', v_fee,
    'total', v_total,
    'guaranteed_minutes', v_minutes
  );
end;
$$;

revoke all on function public.place_order(jsonb, text, text, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, text, text, jsonb) to authenticated;

-- link_store: what scanning a store's sticker does.
create or replace function public.link_store(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_store public.stores%rowtype;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select * into v_store from public.stores s where s.referral_code = upper(trim(p_code)) and s.is_active;
  if not found then
    raise exception 'unknown store code';
  end if;
  insert into public.customer_stores (user_id, store_id) values (v_user, v_store.id) on conflict do nothing;
  return jsonb_build_object('store_id', v_store.id, 'name', v_store.name);
end;
$$;

revoke all on function public.link_store(text) from public, anon;
grant execute on function public.link_store(text) to authenticated;

-- =====================================================================
-- Sample data (fictional stores in Fayoum city). Ids are fixed so a
-- re-run updates nothing and duplicates nothing.
-- =====================================================================

insert into public.categories (id, name, icon, sort, commission_rate) values
  ('rest',   'مطاعم',              'bowl',     1, 0.100),
  ('market', 'سوبرماركت وبقالة',   'cart',     2, 0.050),
  ('pharm',  'صيدليات',            'pharmacy', 3, 0.050),
  ('veg',    'خضار وفاكهة',        'produce',  4, 0.070),
  ('meat',   'لحوم وفراخ',         'meat',     5, 0.070),
  ('bakery', 'مخابز وحلويات',      'bread',    6, 0.080)
on conflict (id) do nothing;

-- Delivery fees per zone are placeholders until the owner prices them.
insert into public.zones (id, name, base_fee, extra_store_fee) values
  ('university', 'حي الجامعة', 20, 5),
  ('masalla',    'المسلة',     20, 5),
  ('hadaqa',     'الحادقة',    20, 5),
  ('dalla',      'دلة',        20, 5),
  ('kiman',      'كيمان فارس', 20, 5),
  ('sufi',       'الصوفي',     20, 5)
on conflict (id) do nothing;

insert into public.stores (id, name, mark, category_id, area, zone_id, lat, lng, rating, eta_min, eta_max, tint, is_pharmacy, daily_prices, referral_code) values
  (md5('store:r1')::uuid, 'كشري الساقية',       'ك', 'rest',   'المسلة',     'masalla',    29.3105, 30.8442, 4.7, 25, 35, '#F7E2C2', false, false, 'SAQIA'),
  (md5('store:r2')::uuid, 'مشويات قارون',       'ق', 'rest',   'الحادقة',    'hadaqa',     29.3192, 30.8331, 4.6, 30, 45, '#F3D6CC', false, false, 'QAROUN'),
  (md5('store:r3')::uuid, 'بيتزا الواحة',       'و', 'rest',   'الجامعة',    'university', 29.3041, 30.8379, 4.4, 35, 50, '#F9E6B8', false, false, 'WAHA'),
  (md5('store:r4')::uuid, 'فطاطري العمدة',      'ع', 'rest',   'دلة',        'dalla',      29.2988, 30.8527, 4.5, 20, 30, '#EADFCB', false, false, 'OMDA'),
  (md5('store:m1')::uuid, 'سوبرماركت النخيل',   'ن', 'market', 'الجامعة',    'university', 29.3058, 30.8390, 4.6, 30, 40, '#D7E9DF', false, false, 'NAKHIL'),
  (md5('store:m2')::uuid, 'بقالة الحاج سيد',    'س', 'market', 'حي الجامعة', 'university', 29.3070, 30.8402, 4.8, 15, 25, '#E3E9D2', false, false, 'SAYED'),
  (md5('store:p1')::uuid, 'صيدلية الحادقة',     'ح', 'pharm',  'الحادقة',    'hadaqa',     29.3150, 30.8360, 4.9, 15, 25, '#D5E6EE', true,  false, 'HADAQA'),
  (md5('store:p2')::uuid, 'صيدلية النور',       'ن', 'pharm',  'المسلة',     'masalla',    29.3112, 30.8466, 4.7, 20, 30, '#DCE3F2', true,  false, 'NOUR'),
  (md5('store:v1')::uuid, 'خضار وفاكهة البستان','ب', 'veg',    'كيمان فارس', 'kiman',      29.3201, 30.8489, 4.5, 25, 35, '#DDEBC9', false, true,  'BOSTAN'),
  (md5('store:k1')::uuid, 'جزارة الأمانة',      'أ', 'meat',   'الصوفي',     'sufi',       29.2961, 30.8301, 4.6, 30, 45, '#F1D3D0', false, true,  'AMANA'),
  (md5('store:k2')::uuid, 'فراخ الريف',         'ر', 'meat',   'دلة',        'dalla',      29.3002, 30.8549, 4.4, 25, 40, '#F4E0CF', false, true,  'RIF'),
  (md5('store:b1')::uuid, 'مخبز الفيوم البلدي', 'ف', 'bakery', 'المسلة',     'masalla',    29.3096, 30.8418, 4.5, 15, 25, '#F2E6CF', false, false, 'BALADY'),
  (md5('store:b2')::uuid, 'حلواني السلطان',     'س', 'bakery', 'الحادقة',    'hadaqa',     29.3177, 30.8352, 4.7, 25, 40, '#F4DCE4', false, false, 'SULTAN')
on conflict (id) do nothing;

insert into public.products (id, store_id, name, note, price, sort) values
  (md5('product:r1a')::uuid, md5('store:r1')::uuid, 'كشري وسط', 'بالصلصة والدقة', 45, 1),
  (md5('product:r1b')::uuid, md5('store:r1')::uuid, 'كشري كبير', 'بالصلصة والدقة', 60, 2),
  (md5('product:r1c')::uuid, md5('store:r1')::uuid, 'طاجن مكرونة باللحمة', 'في الفرن', 85, 3),
  (md5('product:r1d')::uuid, md5('store:r1')::uuid, 'أرز بلبن', 'بالمكسرات', 25, 4),
  (md5('product:r2a')::uuid, md5('store:r2')::uuid, 'ربع فرخة مشوية', 'مع عيش وطحينة', 95, 1),
  (md5('product:r2b')::uuid, md5('store:r2')::uuid, 'نص فرخة مشوية', 'مع عيش وطحينة', 170, 2),
  (md5('product:r2c')::uuid, md5('store:r2')::uuid, 'كفتة ربع كيلو', 'على الفحم', 160, 3),
  (md5('product:r2d')::uuid, md5('store:r2')::uuid, 'سلطات مشكلة', 'طحينة وبابا غنوج وخضرا', 30, 4),
  (md5('product:r3a')::uuid, md5('store:r3')::uuid, 'بيتزا مارجريتا وسط', 'موتزاريلا وصلصة طماطم', 140, 1),
  (md5('product:r3b')::uuid, md5('store:r3')::uuid, 'بيتزا خضار وسط', 'فلفل وزيتون ومشروم', 155, 2),
  (md5('product:r3c')::uuid, md5('store:r3')::uuid, 'بيتزا فراخ باربكيو وسط', 'فراخ مشوية وبصل', 195, 3),
  (md5('product:r4a')::uuid, md5('store:r4')::uuid, 'فطير مشلتت صغير', 'مع عسل وجبنة قديمة', 90, 1),
  (md5('product:r4b')::uuid, md5('store:r4')::uuid, 'فطيرة سجق', 'سجق وفلفل', 110, 2),
  (md5('product:r4c')::uuid, md5('store:r4')::uuid, 'فطيرة شوكولاتة', 'بالموز', 85, 3),
  (md5('product:m1a')::uuid, md5('store:m1')::uuid, 'لبن كامل الدسم', '1 لتر', 42, 1),
  (md5('product:m1b')::uuid, md5('store:m1')::uuid, 'زيت عباد الشمس', '1 لتر', 95, 2),
  (md5('product:m1c')::uuid, md5('store:m1')::uuid, 'سكر أبيض', '1 كيلو', 38, 3),
  (md5('product:m1d')::uuid, md5('store:m1')::uuid, 'أرز مصري', '1 كيلو', 40, 4),
  (md5('product:m1e')::uuid, md5('store:m1')::uuid, 'جبنة بيضاء', '500 جم', 70, 5),
  (md5('product:m2a')::uuid, md5('store:m2')::uuid, 'سكر أبيض', '1 كيلو', 38, 1),
  (md5('product:m2b')::uuid, md5('store:m2')::uuid, 'زيت عباد الشمس', '1 لتر', 95, 2),
  (md5('product:m2c')::uuid, md5('store:m2')::uuid, 'مكرونة', '400 جم', 18, 3),
  (md5('product:m2d')::uuid, md5('store:m2')::uuid, 'شاي', '250 جم', 75, 4),
  (md5('product:m2e')::uuid, md5('store:m2')::uuid, 'بيض', '10 بيضات', 65, 5),
  (md5('product:p1a')::uuid, md5('store:p1')::uuid, 'مسكن للصداع', 'شريط', 38, 1),
  (md5('product:p1b')::uuid, md5('store:p1')::uuid, 'فيتامين سي فوار', 'أنبوبة', 60, 2),
  (md5('product:p1c')::uuid, md5('store:p1')::uuid, 'كمامات طبية', '10 قطع', 25, 3),
  (md5('product:p1d')::uuid, md5('store:p1')::uuid, 'ميزان حرارة رقمي', 'قطعة', 120, 4),
  (md5('product:p2a')::uuid, md5('store:p2')::uuid, 'مسكن للصداع', 'شريط', 38, 1),
  (md5('product:p2b')::uuid, md5('store:p2')::uuid, 'فيتامين سي فوار', 'أنبوبة', 60, 2),
  (md5('product:p2c')::uuid, md5('store:p2')::uuid, 'كمامات طبية', '10 قطع', 25, 3),
  (md5('product:v1a')::uuid, md5('store:v1')::uuid, 'طماطم', 'كيلو', 20, 1),
  (md5('product:v1b')::uuid, md5('store:v1')::uuid, 'بطاطس', 'كيلو', 22, 2),
  (md5('product:v1c')::uuid, md5('store:v1')::uuid, 'خيار', 'كيلو', 25, 3),
  (md5('product:v1d')::uuid, md5('store:v1')::uuid, 'برتقال', 'كيلو', 25, 4),
  (md5('product:v1e')::uuid, md5('store:v1')::uuid, 'موز', 'كيلو', 40, 5),
  (md5('product:k1a')::uuid, md5('store:k1')::uuid, 'لحم كندوز', 'كيلو', 460, 1),
  (md5('product:k1b')::uuid, md5('store:k1')::uuid, 'لحم مفروم', 'كيلو', 440, 2),
  (md5('product:k1c')::uuid, md5('store:k1')::uuid, 'كبدة', 'كيلو', 480, 3),
  (md5('product:k2a')::uuid, md5('store:k2')::uuid, 'فرخة بيضاء', 'كيلو', 95, 1),
  (md5('product:k2b')::uuid, md5('store:k2')::uuid, 'صدور فراخ', 'كيلو', 190, 2),
  (md5('product:k2c')::uuid, md5('store:k2')::uuid, 'أوراك فراخ', 'كيلو', 120, 3),
  (md5('product:b1a')::uuid, md5('store:b1')::uuid, 'عيش بلدي', '10 أرغفة', 20, 1),
  (md5('product:b1b')::uuid, md5('store:b1')::uuid, 'عيش فينو', '5 أرغفة', 15, 2),
  (md5('product:b1c')::uuid, md5('store:b1')::uuid, 'عيش شامي', '5 أرغفة', 20, 3),
  (md5('product:b2a')::uuid, md5('store:b2')::uuid, 'بسبوسة', 'ربع كيلو', 45, 1),
  (md5('product:b2b')::uuid, md5('store:b2')::uuid, 'كنافة بالقشطة', 'ربع كيلو', 60, 2),
  (md5('product:b2c')::uuid, md5('store:b2')::uuid, 'تورتة صغيرة', '6 أفراد', 280, 3)
on conflict (id) do nothing;
