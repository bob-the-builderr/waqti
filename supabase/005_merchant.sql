-- =====================================================================
-- 005 — the shop app (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 004.
-- Running it again is harmless.
--
--  • A shop signs in once with a secret 6-digit staff code (no email).
--  • It sees its new orders, accepts with a prep time or says «مشغول»,
--    marks items «خلصان», and marks the order «جاهز».
--  • It can open/close or pause the shop, switch items on/off and change
--    prices, and see today's money.
--  • Customers can no longer order from a closed or paused shop.
-- Everything goes through functions below; shops get no direct table access.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Shop accounts and shop state.
-- ---------------------------------------------------------------------
create table if not exists public.store_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.store_staff enable row level security;
revoke all on public.store_staff from anon, authenticated;

alter table public.stores add column if not exists staff_code text;
alter table public.stores add column if not exists is_open boolean not null default true;
alter table public.stores add column if not exists paused_until timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_staff_code_key') then
    alter table public.stores add constraint stores_staff_code_key unique (staff_code);
  end if;
end;
$$;

-- Test codes for the 13 sample shops: 7 + its 4-digit customer code + 1
-- (بقالة الحاج سيد = 748211). Real shops get random codes from our team.
update public.stores set staff_code = '7' || pin_code || '1' where staff_code is null and pin_code is not null;

-- Customers may see whether a shop is open; staff codes stay hidden.
grant select (is_open, paused_until) on public.stores to anon, authenticated;

alter table public.order_stores add column if not exists prep_minutes int;
alter table public.order_stores add column if not exists accepted_at timestamptz;
alter table public.order_stores add column if not exists ready_at timestamptz;
alter table public.order_items add column if not exists out_of_stock boolean not null default false;

-- ---------------------------------------------------------------------
-- 2) Helpers (not callable from the apps).
-- ---------------------------------------------------------------------

-- The shop the signed-in user works for, or null.
create or replace function public.my_store_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select st.store_id from public.store_staff st where st.user_id = auth.uid()
$$;
revoke all on function public.my_store_id() from public, anon, authenticated;

-- Re-prices an order after items run out or a shop says «مشغول».
create or replace function public.recalc_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n int;
  v_sub int;
  v_fee int;
begin
  update public.order_stores os set
    subtotal = coalesce((select sum(i.line_total) from public.order_items i where i.order_store_id = os.id and not i.out_of_stock), 0)::int,
    commission = round(coalesce((select sum(i.line_total) from public.order_items i where i.order_store_id = os.id and not i.out_of_stock), 0) * os.commission_rate)::int
  where os.order_id = p_order_id;

  -- A shop left with nothing to send drops out of the trip.
  update public.order_stores set status = 'rejected'
  where order_id = p_order_id and subtotal = 0 and status in ('pending', 'accepted');

  select count(*), coalesce(sum(subtotal), 0) into v_n, v_sub
  from public.order_stores where order_id = p_order_id and status <> 'rejected';

  if v_n = 0 then
    update public.orders set status = 'cancelled' where id = p_order_id;
    return;
  end if;

  select public.delivery_fee(o.distance_km, v_n) into v_fee from public.orders o where o.id = p_order_id;
  update public.orders set store_count = v_n, subtotal = v_sub, delivery_fee = v_fee, total = v_sub + v_fee
  where id = p_order_id;
end;
$$;
revoke all on function public.recalc_order(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) What the shop app calls.
-- ---------------------------------------------------------------------

-- Sign the shop in with its staff code. Wrong codes count toward the
-- same 10-tries-an-hour limit as customer codes.
create or replace function public.merchant_link(p_code text)
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
  if (select count(*) from public.link_attempts a where a.user_id = v_user and a.at > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'too many tries');
  end if;
  insert into public.link_attempts (user_id) values (v_user);

  select * into v_store from public.stores s where s.staff_code = trim(coalesce(p_code, '')) and s.is_active;
  if not found then
    return jsonb_build_object('error', 'unknown staff code');
  end if;
  insert into public.store_staff (user_id, store_id) values (v_user, v_store.id)
  on conflict (user_id) do update set store_id = excluded.store_id;
  return jsonb_build_object('store_id', v_store.id, 'name', v_store.name);
end;
$$;

-- The signed-in shop, or null.
create or replace function public.merchant_store()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'store_id', s.id, 'name', s.name, 'mark', s.mark, 'tint', s.tint,
    'category', c.name, 'is_open', s.is_open, 'paused_until', s.paused_until
  )
  from public.stores s join public.categories c on c.id = s.category_id
  where s.id = public.my_store_id()
$$;

-- Today's live orders for the shop: new, preparing, ready, plus the ones
-- already picked up or turned down today.
create or replace function public.merchant_orders()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by x.sort_key, x.placed_at desc), '[]'::jsonb)
  from (
    select
      os.id as order_store_id,
      o.number,
      o.placed_at,
      o.status as order_status,
      os.status,
      os.prep_minutes,
      os.accepted_at,
      os.subtotal,
      os.commission,
      o.payment_method,
      o.missing_policy,
      o.store_count,
      -- The customer's number only once the shop has taken the order.
      case when os.status in ('accepted', 'ready') then o.customer_phone else null end as customer_phone,
      case os.status when 'pending' then 0 when 'accepted' then 1 when 'ready' then 2 else 3 end as sort_key,
      (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', i.id, 'name', i.name, 'note', i.note, 'qty', i.qty,
          'unit_price', i.unit_price, 'line_total', i.line_total, 'out_of_stock', i.out_of_stock
        ) order by i.name), '[]'::jsonb)
        from public.order_items i where i.order_store_id = os.id
      ) as items
    from public.order_stores os
    join public.orders o on o.id = os.order_id
    where os.store_id = public.my_store_id()
      and o.status <> 'cancelled'
      and (
        os.status in ('pending', 'accepted', 'ready')
        or (o.placed_at at time zone 'Africa/Cairo')::date = (now() at time zone 'Africa/Cairo')::date
      )
    order by o.placed_at desc
    limit 60
  ) x
$$;

-- Accept with a prep time (minutes).
create or replace function public.merchant_accept(p_order_store_id uuid, p_prep_minutes int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  update public.order_stores os
  set status = 'accepted', prep_minutes = least(greatest(coalesce(p_prep_minutes, 10), 1), 120), accepted_at = now()
  where os.id = p_order_store_id and os.store_id = public.my_store_id() and os.status = 'pending'
    and exists (select 1 from public.orders o where o.id = os.order_id and o.status <> 'cancelled')
  returning os.order_id into v_order;
  if v_order is null then
    raise exception 'order not available';
  end if;
  update public.orders set status = 'preparing' where id = v_order and status = 'placed';
end;
$$;

-- «مشغول»: the shop can't take this order; the rest of the trip goes on.
create or replace function public.merchant_busy(p_order_store_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  update public.order_stores os set status = 'rejected'
  where os.id = p_order_store_id and os.store_id = public.my_store_id() and os.status = 'pending'
  returning os.order_id into v_order;
  if v_order is null then
    raise exception 'order not available';
  end if;
  perform public.recalc_order(v_order);
end;
$$;

-- «خلصان»: this item ran out. Taken off the bill and switched off in the menu.
create or replace function public.merchant_item_out(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
  v_product uuid;
begin
  update public.order_items i set out_of_stock = true
  from public.order_stores os
  where i.id = p_item_id and os.id = i.order_store_id
    and os.store_id = public.my_store_id() and os.status in ('pending', 'accepted')
  returning i.order_id, i.product_id into v_order, v_product;
  if v_order is null then
    raise exception 'item not available';
  end if;
  update public.products set is_available = false where id = v_product;
  perform public.recalc_order(v_order);
end;
$$;

-- «جاهز»: packed and waiting for the driver.
create or replace function public.merchant_ready(p_order_store_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.order_stores set status = 'ready', ready_at = now()
  where id = p_order_store_id and store_id = public.my_store_id() and status = 'accepted';
  if not found then
    raise exception 'order not available';
  end if;
end;
$$;

-- Today's and this week's money for the shop.
create or replace function public.merchant_money()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select os.subtotal, os.commission, (o.placed_at at time zone 'Africa/Cairo') as at_local
    from public.order_stores os
    join public.orders o on o.id = os.order_id
    where os.store_id = public.my_store_id()
      and os.status in ('accepted', 'ready', 'picked_up')
      and o.status <> 'cancelled'
  )
  select jsonb_build_object(
    'today', (
      select jsonb_build_object('orders', count(*), 'sales', coalesce(sum(subtotal), 0),
                                'commission', coalesce(sum(commission), 0), 'net', coalesce(sum(subtotal - commission), 0))
      from mine where at_local::date = (now() at time zone 'Africa/Cairo')::date
    ),
    'week', (
      select jsonb_build_object('orders', count(*), 'sales', coalesce(sum(subtotal), 0),
                                'commission', coalesce(sum(commission), 0), 'net', coalesce(sum(subtotal - commission), 0))
      from mine where date_trunc('week', at_local) = date_trunc('week', now() at time zone 'Africa/Cairo')
    )
  )
$$;

-- The shop's whole item list, available or not.
create or replace function public.merchant_products()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'note', p.note, 'price', p.price, 'is_available', p.is_available
  ) order by p.sort, p.name), '[]'::jsonb)
  from public.products p where p.store_id = public.my_store_id()
$$;

-- Change one item's price and/or availability.
create or replace function public.merchant_update_product(p_product_id uuid, p_price int, p_available boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_price is not null and (p_price < 1 or p_price > 100000) then
    raise exception 'bad price';
  end if;
  update public.products
  set price = coalesce(p_price, price), is_available = coalesce(p_available, is_available)
  where id = p_product_id and store_id = public.my_store_id();
  if not found then
    raise exception 'item not available';
  end if;
end;
$$;

-- Open / close the shop, or pause it for some minutes («مشغول 20 دقيقة»).
create or replace function public.merchant_set_open(p_open boolean, p_pause_minutes int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stores
  set is_open = coalesce(p_open, is_open),
      paused_until = case when coalesce(p_pause_minutes, 0) > 0 then now() + make_interval(mins => least(p_pause_minutes, 240)) else null end
  where id = public.my_store_id();
  if not found then
    raise exception 'not a shop';
  end if;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'merchant_link(text)', 'merchant_store()', 'merchant_orders()', 'merchant_accept(uuid, integer)',
    'merchant_busy(uuid)', 'merchant_item_out(uuid)', 'merchant_ready(uuid)', 'merchant_money()',
    'merchant_products()', 'merchant_update_product(uuid, integer, boolean)', 'merchant_set_open(boolean, integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Customers can't order from a closed or paused shop.
--    place_order = 004's, plus the open check.
-- ---------------------------------------------------------------------
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
  v_km numeric;
  v_fee int;
  v_driver int;
  v_minutes int;
  v_total int;
  v_order_id uuid;
  v_number bigint;
  v_order_store_id uuid;
  v_rate numeric(4,3);
  v_phone text := nullif(trim(coalesce(p_address->>'phone', '')), '');
  v_pay_with int;
  v_lat double precision := (p_address->>'lat')::double precision;
  v_lng double precision := (p_address->>'lng')::double precision;
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
  if v_phone is not null and v_phone !~ '^01[0125][0-9]{8}$' then
    raise exception 'bad phone number';
  end if;
  if jsonb_typeof(p_address->'pay_with') = 'number' and p_payment = 'cash' then
    v_pay_with := (p_address->>'pay_with')::numeric::int;
    if v_pay_with < 1 or v_pay_with > 100000 then
      v_pay_with := null;
    end if;
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

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
    join public.products p on p.id = li.product_id
    join public.stores s on s.id = p.store_id
    where not s.is_open or (s.paused_until is not null and s.paused_until > now())
  ) then
    raise exception 'store closed';
  end if;

  select count(distinct p.store_id), max(s.eta_max), sum(p.price * li.qty),
         max(public.distance_km(s.lat, s.lng, v_lat, v_lng))
    into v_store_count, v_max_eta, v_subtotal, v_km
  from jsonb_to_recordset(p_items) as li(product_id uuid, qty int)
  join public.products p on p.id = li.product_id
  join public.stores s on s.id = p.store_id;

  if v_store_count > 3 then
    raise exception 'one trip collects from at most 3 stores';
  end if;

  v_fee := public.delivery_fee(v_km, v_store_count);
  v_driver := public.driver_pay(v_km, v_store_count, now());
  v_minutes := v_max_eta + 5 + 5 * (v_store_count - 1);
  v_total := v_subtotal + v_fee;

  if v_pay_with is not null and v_pay_with < v_total then
    v_pay_with := null;
  end if;

  insert into public.orders (
    customer_id, payment_method, missing_policy, zone_id, address_text, landmark, lat, lng,
    store_count, subtotal, delivery_fee, total, guaranteed_minutes, customer_phone, pay_with,
    distance_km, driver_pay
  ) values (
    v_user, p_payment, p_missing, v_zone.id,
    coalesce(p_address->>'details', ''), coalesce(p_address->>'landmark', ''),
    v_lat, v_lng,
    v_store_count, v_subtotal, v_fee, v_total, v_minutes, v_phone, v_pay_with,
    v_km, v_driver
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
