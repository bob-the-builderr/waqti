-- =====================================================================
-- 016 — «صوّر الروشتة» and «هاتلي أي حاجة» (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 015.
-- Running it again is harmless.
--
-- RX: the customer photographs a prescription and sends it to a pharmacy.
--     The pharmacy answers with the price (and a line, e.g. «متوفر كله»);
--     the customer says «موافق» and it goes like any order. Prescription
--     photos are PRIVATE: only that customer and that pharmacy can open them.
--
-- ERRAND: the customer writes what they need (and from where, if they care),
--     with a spending cap. A rider takes it, buys it, types what he paid and
--     photographs the receipt; the customer pays that plus the errand fee.
--     New customers (under 3 delivered orders) can spend up to 500 EGP.
--     Change the fee or caps here:
--       update public.app_settings set value = '30' where key = 'errand_fee';
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Order kinds and their fields.
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists kind text not null default 'shop';
alter table public.orders drop constraint if exists orders_kind_check;
alter table public.orders add constraint orders_kind_check check (kind in ('shop', 'rx', 'errand'));
alter table public.orders add column if not exists rx_photo_path text;
alter table public.orders add column if not exists rx_note text;
alter table public.orders add column if not exists rx_quote_note text;
alter table public.orders add column if not exists errand_text text;
alter table public.orders add column if not exists errand_from text;
alter table public.orders add column if not exists errand_budget int;
alter table public.orders add column if not exists receipt_path text;

-- An errand has no shop.
alter table public.orders drop constraint if exists orders_store_count_check;
alter table public.orders add constraint orders_store_count_check check (store_count between 0 and 3);
-- A pharmacy's price waits for the customer as «quoted».
alter table public.order_stores drop constraint if exists order_stores_status_check;
alter table public.order_stores add constraint order_stores_status_check
  check (status in ('pending', 'quoted', 'accepted', 'rejected', 'ready', 'picked_up', 'rerouted'));

insert into public.app_settings (key, value) values
  ('errand_fee', '30'),
  ('errand_driver_pay', '25'),
  ('errand_budget_new', '500'),
  ('errand_budget_max', '1500')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 2) Private photos: prescriptions and receipts.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-photos', 'order-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Who may open a photo: the uploader, the order's customer, and (for a
-- prescription) the pharmacy's staff, (for a receipt) the order's rider.
create or replace function public.can_read_order_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(p_name, '/', 2) = auth.uid()::text
    or (p_name like 'rx/%' and exists (
      select 1 from public.orders o
      where o.rx_photo_path = p_name
        and (o.customer_id = auth.uid()
             or exists (select 1 from public.order_stores os join public.store_staff st on st.store_id = os.store_id
                        where os.order_id = o.id and st.user_id = auth.uid()))))
    or (p_name like 'receipts/%' and exists (
      select 1 from public.orders o
      where o.receipt_path = p_name and (o.customer_id = auth.uid() or o.driver_id = auth.uid())))
$$;
revoke all on function public.can_read_order_photo(text) from public, anon;
grant execute on function public.can_read_order_photo(text) to authenticated;

drop policy if exists "upload own order photos" on storage.objects;
create policy "upload own order photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'order-photos'
    and (storage.foldername(name))[1] in ('rx', 'receipts')
    and (storage.foldername(name))[2] = auth.uid()::text
  );
drop policy if exists "read allowed order photos" on storage.objects;
create policy "read allowed order photos" on storage.objects for select to authenticated
  using (bucket_id = 'order-photos' and public.can_read_order_photo(name));

-- ---------------------------------------------------------------------
-- 3) Prescriptions.
-- ---------------------------------------------------------------------
create or replace function public.place_rx_order(p_store_id uuid, p_photo_path text, p_note text, p_payment text, p_address jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_store public.stores%rowtype;
  v_zone public.zones%rowtype;
  v_lat double precision := (p_address->>'lat')::double precision;
  v_lng double precision := (p_address->>'lng')::double precision;
  v_phone text := nullif(trim(coalesce(p_address->>'phone', '')), '');
  v_km numeric;
  v_fee int;
  v_rate numeric(4,3);
  v_order uuid;
  v_number bigint;
begin
  if v_user is null then
    return jsonb_build_object('error', 'not signed in');
  end if;
  select * into v_store from public.stores s where s.id = p_store_id and s.is_active and s.is_pharmacy;
  if not found then
    return jsonb_build_object('error', 'not a pharmacy');
  end if;
  if not v_store.is_open or (v_store.paused_until is not null and v_store.paused_until > now()) then
    return jsonb_build_object('error', 'store closed');
  end if;
  if coalesce(p_photo_path, '') not like 'rx/' || v_user::text || '/%' then
    return jsonb_build_object('error', 'bad path');
  end if;
  if coalesce(p_payment, '') not in ('cash', 'wallet') then
    return jsonb_build_object('error', 'bad payment');
  end if;
  if v_phone is not null and v_phone !~ '^01[0125][0-9]{8}$' then
    return jsonb_build_object('error', 'bad phone number');
  end if;
  select * into v_zone from public.zones z where z.id = p_address->>'zone_id' and z.is_active;
  if not found then
    return jsonb_build_object('error', 'unknown zone');
  end if;

  v_km := public.distance_km(v_store.lat, v_store.lng, v_lat, v_lng);
  v_fee := public.delivery_fee(v_km, 1);
  select c.commission_rate into v_rate from public.categories c where c.id = v_store.category_id;

  insert into public.orders (
    customer_id, kind, payment_method, missing_policy, zone_id, address_text, landmark, lat, lng,
    store_count, subtotal, delivery_fee, total, guaranteed_minutes, customer_phone,
    distance_km, driver_pay, rx_photo_path, rx_note
  ) values (
    v_user, 'rx', p_payment, 'call', v_zone.id, coalesce(p_address->>'details', ''), coalesce(p_address->>'landmark', ''), v_lat, v_lng,
    1, 0, v_fee, v_fee, v_store.eta_max + 5, v_phone,
    v_km, public.driver_pay(v_km, 1, now()), p_photo_path, nullif(left(trim(coalesce(p_note, '')), 300), '')
  )
  returning id, number into v_order, v_number;

  insert into public.order_stores (order_id, store_id, subtotal, commission_rate, commission)
  values (v_order, v_store.id, 0, coalesce(v_rate, 0.06), 0);

  return jsonb_build_object('order_id', v_order, 'number', v_number, 'delivery_fee', v_fee);
end;
$$;

-- The pharmacy's answer: the price of what's on the prescription.
create or replace function public.merchant_rx_quote(p_order_store_id uuid, p_total int, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  select os.order_id into v_order
  from public.order_stores os join public.orders o on o.id = os.order_id
  where os.id = p_order_store_id and os.store_id = public.my_store_id()
    and os.status = 'pending' and o.kind = 'rx' and o.status = 'placed';
  if v_order is null then
    return jsonb_build_object('error', 'order not available');
  end if;
  if coalesce(p_total, 0) not between 1 and 100000 then
    return jsonb_build_object('error', 'bad price');
  end if;
  delete from public.order_items where order_store_id = p_order_store_id;
  insert into public.order_items (order_id, order_store_id, name, note, unit_price, qty, line_total)
  values (v_order, p_order_store_id, 'أدوية الروشتة', left(trim(coalesce(p_note, '')), 300), p_total, 1, p_total);
  perform public.recalc_order(v_order);
  update public.order_stores set status = 'quoted' where id = p_order_store_id;
  update public.orders set rx_quote_note = nullif(left(trim(coalesce(p_note, '')), 300), '') where id = v_order;
  return jsonb_build_object('ok', true);
end;
$$;

-- The customer's «موافق» / «لا شكراً» on the pharmacy's price.
create or replace function public.rx_answer(p_order_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_os uuid;
begin
  select os.id into v_os
  from public.orders o join public.order_stores os on os.order_id = o.id
  where o.id = p_order_id and o.customer_id = auth.uid() and o.kind = 'rx' and o.status = 'placed' and os.status = 'quoted';
  if v_os is null then
    return jsonb_build_object('error', 'nothing to answer');
  end if;
  if coalesce(p_accept, false) then
    update public.order_stores set status = 'accepted', accepted_at = now(), prep_minutes = 10 where id = v_os;
    update public.orders set status = 'preparing' where id = p_order_id;
    perform public.dispatch_tick();
  else
    update public.orders set status = 'cancelled' where id = p_order_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- A prescription is priced with merchant_rx_quote, never accepted blind.
create or replace function public.merchant_accept(p_order_store_id uuid, p_prep_minutes int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  if exists (select 1 from public.order_stores os join public.orders o on o.id = os.order_id
             where os.id = p_order_store_id and o.kind = 'rx') then
    raise exception 'quote first';
  end if;
  update public.order_stores os
  set status = 'accepted', prep_minutes = least(greatest(coalesce(p_prep_minutes, 10), 1), 120), accepted_at = now()
  where os.id = p_order_store_id and os.store_id = public.my_store_id() and os.status = 'pending'
    and exists (select 1 from public.orders o where o.id = os.order_id and o.status <> 'cancelled')
  returning os.order_id into v_order;
  if v_order is null then
    raise exception 'order not available';
  end if;
  update public.orders set status = 'preparing' where id = v_order and status = 'placed';
  perform public.dispatch_tick();
end;
$$;

-- The shop's orders, now with the prescription (photo path, note, price note).
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
      o.kind,
      o.rx_photo_path,
      o.rx_note,
      o.rx_quote_note,
      case when os.status in ('accepted', 'ready') then o.customer_phone else null end as customer_phone,
      case os.status when 'pending' then 0 when 'quoted' then 1 when 'accepted' then 2 when 'ready' then 3 else 4 end as sort_key,
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
        os.status in ('pending', 'quoted', 'accepted', 'ready')
        or (o.placed_at at time zone 'Africa/Cairo')::date = (now() at time zone 'Africa/Cairo')::date
      )
    order by o.placed_at desc
    limit 60
  ) x
$$;

-- ---------------------------------------------------------------------
-- 4) Errands.
-- ---------------------------------------------------------------------
create or replace function public.place_errand(p_text text, p_from text, p_budget int, p_payment text, p_address jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_zone public.zones%rowtype;
  v_phone text := nullif(trim(coalesce(p_address->>'phone', '')), '');
  v_fee int := coalesce((select value::int from public.app_settings where key = 'errand_fee'), 30);
  v_pay int := coalesce((select value::int from public.app_settings where key = 'errand_driver_pay'), 25);
  v_cap int;
  v_order uuid;
  v_number bigint;
begin
  if v_user is null then
    return jsonb_build_object('error', 'not signed in');
  end if;
  if char_length(trim(coalesce(p_text, ''))) not between 3 and 500 then
    return jsonb_build_object('error', 'bad errand');
  end if;
  if coalesce(p_payment, '') not in ('cash', 'wallet') then
    return jsonb_build_object('error', 'bad payment');
  end if;
  if v_phone is null or v_phone !~ '^01[0125][0-9]{8}$' then
    return jsonb_build_object('error', 'bad phone number');
  end if;
  -- New customers start with a smaller cap, to keep the rider's own money safe.
  v_cap := case
    when (select count(*) from public.orders o where o.customer_id = v_user and o.status = 'delivered') >= 3
      then coalesce((select value::int from public.app_settings where key = 'errand_budget_max'), 1500)
    else coalesce((select value::int from public.app_settings where key = 'errand_budget_new'), 500)
  end;
  if coalesce(p_budget, 0) < 20 or p_budget > v_cap then
    return jsonb_build_object('error', 'over cap', 'cap', v_cap);
  end if;
  select * into v_zone from public.zones z where z.id = p_address->>'zone_id' and z.is_active;
  if not found then
    return jsonb_build_object('error', 'unknown zone');
  end if;

  insert into public.orders (
    customer_id, kind, payment_method, missing_policy, zone_id, address_text, landmark, lat, lng,
    store_count, subtotal, delivery_fee, total, guaranteed_minutes, customer_phone,
    driver_pay, errand_text, errand_from, errand_budget
  ) values (
    v_user, 'errand', p_payment, 'call', v_zone.id, coalesce(p_address->>'details', ''), coalesce(p_address->>'landmark', ''),
    (p_address->>'lat')::double precision, (p_address->>'lng')::double precision,
    0, 0, v_fee, v_fee, 60, v_phone,
    v_pay, trim(p_text), nullif(left(trim(coalesce(p_from, '')), 120), ''), p_budget
  )
  returning id, number into v_order, v_number;
  perform public.dispatch_tick();
  return jsonb_build_object('order_id', v_order, 'number', v_number, 'fee', v_fee, 'cap', v_cap);
end;
$$;

-- The rider bought it: what he paid, and the receipt photo.
create or replace function public.driver_errand_bought(p_order_id uuid, p_amount int, p_receipt_path text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders o
  where o.id = p_order_id and o.driver_id = public.my_driver_id() and o.kind = 'errand' and o.status in ('placed', 'preparing');
  if not found then
    return jsonb_build_object('error', 'order not available');
  end if;
  if coalesce(p_amount, 0) < 1 then
    return jsonb_build_object('error', 'bad price');
  end if;
  if p_amount > v_order.errand_budget then
    return jsonb_build_object('error', 'over budget');
  end if;
  if coalesce(p_receipt_path, '') not like 'receipts/' || auth.uid()::text || '/%' then
    return jsonb_build_object('error', 'bad path');
  end if;
  update public.orders
  set subtotal = p_amount, total = p_amount + delivery_fee, receipt_path = p_receipt_path,
      status = 'on_the_way', picked_up_at = now()
  where id = p_order_id;
  return jsonb_build_object('ok', true, 'total', p_amount + v_order.delivery_fee);
end;
$$;

-- ---------------------------------------------------------------------
-- 5) Dispatch and the rider's view know errands.
-- ---------------------------------------------------------------------
create or replace function public.dispatch_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_driver uuid;
  v_secs int := coalesce((select value::int from public.app_settings where key = 'offer_seconds'), 45);
begin
  update public.trip_offers set status = 'expired', answered_at = now()
  where status = 'offered' and expires_at < now();

  for r in
    select o.id, o.total, o.payment_method, o.distance_km
    from public.orders o
    where o.driver_id is null
      and o.status in ('placed', 'preparing')
      and (
        o.kind = 'errand'
        or (not exists (select 1 from public.order_stores os where os.order_id = o.id and os.status in ('pending', 'quoted'))
            and exists (select 1 from public.order_stores os where os.order_id = o.id and os.status in ('accepted', 'ready')))
      )
      and not exists (select 1 from public.trip_offers t where t.order_id = o.id and t.status = 'offered')
    order by o.placed_at
  loop
    v_driver := null;
    select d.user_id into v_driver
    from public.drivers d
    where d.status = 'active' and d.is_online
      and d.last_seen_at > now() - interval '45 seconds'
      and public.vehicle_can_take(d.vehicle, r.distance_km)
      and not exists (select 1 from public.orders x where x.driver_id = d.user_id and x.status not in ('delivered', 'cancelled'))
      and not exists (select 1 from public.trip_offers t where t.driver_id = d.user_id and t.status = 'offered')
      and not exists (select 1 from public.trip_offers t where t.driver_id = d.user_id and t.order_id = r.id)
      and (r.payment_method <> 'cash' or public.driver_cash_held(d.user_id) < d.cash_limit)
    order by d.last_trip_at nulls first, d.created_at
    limit 1;

    if v_driver is null then
      delete from public.trip_offers t
      where t.order_id = r.id and t.status in ('declined', 'expired') and t.answered_at < now() - interval '2 minutes';
      continue;
    end if;

    begin
      insert into public.trip_offers (order_id, driver_id, expires_at)
      values (r.id, v_driver, now() + make_interval(secs => v_secs));
    exception when unique_violation then
      null;
    end;
  end loop;
end;
$$;
revoke all on function public.dispatch_tick() from public, anon, authenticated;

create or replace function public.driver_offers()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.my_driver_id();
begin
  if v_driver is null then
    return '[]'::jsonb;
  end if;
  update public.drivers set last_seen_at = now() where user_id = v_driver;
  perform public.dispatch_tick();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'order_id', o.id, 'number', o.number, 'placed_at', o.placed_at, 'driver_pay', o.driver_pay,
      'total', o.total, 'payment_method', o.payment_method, 'distance_km', o.distance_km,
      'store_count', o.store_count, 'guaranteed_minutes', o.guaranteed_minutes,
      'drop_area', z.name, 'landmark', o.landmark,
      'kind', o.kind, 'errand_text', o.errand_text, 'errand_from', o.errand_from, 'errand_budget', o.errand_budget,
      'seconds_left', greatest(0, ceil(extract(epoch from (t.expires_at - now())))::int),
      'pieces', (select coalesce(sum(i.qty), 0) from public.order_items i where i.order_id = o.id and not i.out_of_stock),
      'stores', (
        select jsonb_agg(jsonb_build_object('name', s.name, 'area', s.area, 'ready', os.status = 'ready') order by s.name)
        from public.order_stores os join public.stores s on s.id = os.store_id
        where os.order_id = o.id and os.status <> 'rejected'
      )
    ))
    from public.trip_offers t
    join public.orders o on o.id = t.order_id
    join public.zones z on z.id = o.zone_id
    where t.driver_id = v_driver and t.status = 'offered' and t.expires_at >= now()
  ), '[]'::jsonb);
end;
$$;

create or replace function public.driver_trip()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_id', o.id, 'number', o.number, 'status', o.status, 'placed_at', o.placed_at,
    'guaranteed_minutes', o.guaranteed_minutes, 'driver_pay', o.driver_pay,
    'total', o.total, 'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee,
    'payment_method', o.payment_method, 'pay_with', o.pay_with,
    'customer_phone', o.customer_phone, 'address', o.address_text, 'landmark', o.landmark,
    'drop_area', z.name, 'lat', o.lat, 'lng', o.lng, 'distance_km', o.distance_km,
    'kind', o.kind, 'errand_text', o.errand_text, 'errand_from', o.errand_from, 'errand_budget', o.errand_budget,
    'stores', (
      select jsonb_agg(jsonb_build_object(
        'order_store_id', os.id, 'name', s.name, 'area', s.area, 'phone', s.phone,
        'lat', s.lat, 'lng', s.lng, 'status', os.status, 'subtotal', os.subtotal,
        'pieces', (select coalesce(sum(i.qty), 0) from public.order_items i where i.order_store_id = os.id and not i.out_of_stock)
      ) order by s.name)
      from public.order_stores os join public.stores s on s.id = os.store_id
      where os.order_id = o.id and os.status <> 'rejected'
    )
  )
  from public.orders o
  join public.zones z on z.id = o.zone_id
  where o.driver_id = public.my_driver_id() and o.status not in ('delivered', 'cancelled')
  order by o.assigned_at desc
  limit 1
$$;

-- On an errand the rider paid the shop himself, so only the fee counts as cash he holds.
create or replace function public.driver_cash_held(p_driver uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (
    coalesce((select sum(case when o.kind = 'errand' then o.delivery_fee else o.total end) from public.orders o
              where o.driver_id = p_driver and o.status = 'delivered' and o.payment_method = 'cash'), 0)
    - coalesce((select sum(d.amount) from public.driver_deposits d where d.driver_id = p_driver), 0)
  )::int
$$;
revoke all on function public.driver_cash_held(uuid) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'place_rx_order(uuid, text, text, text, jsonb)', 'merchant_rx_quote(uuid, integer, text)', 'rx_answer(uuid, boolean)',
    'merchant_accept(uuid, integer)', 'merchant_orders()', 'place_errand(text, text, integer, text, jsonb)',
    'driver_errand_bought(uuid, integer, text)', 'driver_offers()', 'driver_trip()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;
