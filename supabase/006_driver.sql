-- =====================================================================
-- ِ006 — the driver app (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 005.
-- Running it again is harmless.
--
--  • Anyone can sign up as a driver: name, phone, bicycle / scooter / motorbike.
--    (Test phase: new drivers are active at once. Before launch, our team
--     checks ID and licence first: set status 'pending' in driver_register.)
--  • An online driver sees open trips once every shop in them has accepted,
--    and the first to tap «اقبل» gets it. Smarter dispatch is the next step.
--  • Pick up at each shop, then deliver; the customer follows every step.
--  • Earnings and cash collected, today and this week.
-- Everything goes through functions below; drivers get no direct table access.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Drivers and trip columns.
-- ---------------------------------------------------------------------
create table if not exists public.drivers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  phone text not null check (phone ~ '^01[0125][0-9]{8}$'),
  vehicle text not null check (vehicle in ('bicycle', 'scooter', 'motorcycle')),
  status text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.drivers enable row level security;
revoke all on public.drivers from anon, authenticated;

alter table public.orders add column if not exists driver_id uuid references public.drivers(user_id);
alter table public.orders add column if not exists assigned_at timestamptz;
alter table public.orders add column if not exists picked_up_at timestamptz;
alter table public.order_stores add column if not exists picked_up_at timestamptz;
create index if not exists orders_driver_idx on public.orders (driver_id, status);

-- Bicycles only take short trips.
create or replace function public.vehicle_can_take(p_vehicle text, p_km numeric)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_vehicle <> 'bicycle' or coalesce(p_km, 0) <= 2.5
$$;

-- The active driver behind the signed-in user, or null.
create or replace function public.my_driver_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.user_id from public.drivers d where d.user_id = auth.uid() and d.status = 'active'
$$;
revoke all on function public.my_driver_id() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) What the driver app calls.
-- ---------------------------------------------------------------------

create or replace function public.driver_register(p_name text, p_phone text, p_vehicle text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    return jsonb_build_object('error', 'bad name');
  end if;
  if coalesce(p_phone, '') !~ '^01[0125][0-9]{8}$' then
    return jsonb_build_object('error', 'bad phone number');
  end if;
  if coalesce(p_vehicle, '') not in ('bicycle', 'scooter', 'motorcycle') then
    return jsonb_build_object('error', 'bad vehicle');
  end if;
  insert into public.drivers (user_id, name, phone, vehicle)
  values (v_user, trim(p_name), p_phone, p_vehicle)
  on conflict (user_id) do update set name = excluded.name, phone = excluded.phone, vehicle = excluded.vehicle;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.driver_me()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('name', d.name, 'phone', d.phone, 'vehicle', d.vehicle, 'status', d.status, 'is_online', d.is_online)
  from public.drivers d where d.user_id = auth.uid()
$$;

create or replace function public.driver_set_online(p_online boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.drivers set is_online = coalesce(p_online, false) where user_id = public.my_driver_id();
  if not found then
    raise exception 'not an active driver';
  end if;
end;
$$;

-- Open trips: every shop still in the order has accepted, nobody took it yet.
create or replace function public.driver_offers()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by x.placed_at), '[]'::jsonb)
  from (
    select
      o.id as order_id, o.number, o.placed_at, o.driver_pay, o.total, o.payment_method,
      o.distance_km, o.store_count, o.guaranteed_minutes,
      z.name as drop_area, o.landmark,
      (select coalesce(sum(i.qty), 0) from public.order_items i where i.order_id = o.id and not i.out_of_stock) as pieces,
      (
        select jsonb_agg(jsonb_build_object('name', s.name, 'area', s.area, 'ready', os.status = 'ready') order by s.name)
        from public.order_stores os join public.stores s on s.id = os.store_id
        where os.order_id = o.id and os.status <> 'rejected'
      ) as stores
    from public.orders o
    join public.zones z on z.id = o.zone_id
    join public.drivers d on d.user_id = public.my_driver_id() and d.is_online
    where o.driver_id is null
      and o.status in ('placed', 'preparing')
      and not exists (select 1 from public.order_stores os where os.order_id = o.id and os.status = 'pending')
      and exists (select 1 from public.order_stores os where os.order_id = o.id and os.status in ('accepted', 'ready'))
      and public.vehicle_can_take(d.vehicle, o.distance_km)
    order by o.placed_at
    limit 20
  ) x
$$;

-- «اقبل»: the first driver to accept gets the trip. One trip at a time.
create or replace function public.driver_accept(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.my_driver_id();
begin
  if v_driver is null then
    raise exception 'not an active driver';
  end if;
  if exists (select 1 from public.orders o where o.driver_id = v_driver and o.status not in ('delivered', 'cancelled')) then
    raise exception 'finish your trip first';
  end if;
  update public.orders set driver_id = v_driver, assigned_at = now()
  where id = p_order_id and driver_id is null and status in ('placed', 'preparing');
  if not found then
    raise exception 'trip taken';
  end if;
end;
$$;

-- The driver's current trip, with everything needed to do it.
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
    'total', o.total, 'payment_method', o.payment_method, 'pay_with', o.pay_with,
    'customer_phone', o.customer_phone, 'address', o.address_text, 'landmark', o.landmark,
    'drop_area', z.name, 'lat', o.lat, 'lng', o.lng, 'distance_km', o.distance_km,
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

-- «استلمت»: picked up at one shop. When every shop is done, the trip is on its way.
create or replace function public.driver_pickup(p_order_store_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  update public.order_stores os set status = 'picked_up', picked_up_at = now()
  from public.orders o
  where os.id = p_order_store_id and o.id = os.order_id
    and o.driver_id = public.my_driver_id() and o.status not in ('delivered', 'cancelled')
    and os.status in ('accepted', 'ready')
  returning os.order_id into v_order;
  if v_order is null then
    raise exception 'pickup not available';
  end if;

  if exists (select 1 from public.order_stores where order_id = v_order and status in ('pending', 'accepted', 'ready')) then
    update public.orders set status = 'picked_up', picked_up_at = coalesce(picked_up_at, now()) where id = v_order;
  else
    update public.orders set status = 'on_the_way', picked_up_at = coalesce(picked_up_at, now()) where id = v_order;
  end if;
end;
$$;

-- «وصّلت»: handed over (and cash collected when paying cash).
create or replace function public.driver_deliver(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders set status = 'delivered', delivered_at = now()
  where id = p_order_id and driver_id = public.my_driver_id() and status = 'on_the_way';
  if not found then
    raise exception 'deliver not available';
  end if;
end;
$$;

-- Earnings and cash collected, today and this week (Cairo time).
create or replace function public.driver_earnings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select o.driver_pay, o.total, o.payment_method, (o.delivered_at at time zone 'Africa/Cairo') as at_local
    from public.orders o
    where o.driver_id = public.my_driver_id() and o.status = 'delivered'
  )
  select jsonb_build_object(
    'today', (
      select jsonb_build_object('trips', count(*), 'earned', coalesce(sum(driver_pay), 0),
                                'cash', coalesce(sum(total) filter (where payment_method = 'cash'), 0))
      from mine where at_local::date = (now() at time zone 'Africa/Cairo')::date
    ),
    'week', (
      select jsonb_build_object('trips', count(*), 'earned', coalesce(sum(driver_pay), 0),
                                'cash', coalesce(sum(total) filter (where payment_method = 'cash'), 0))
      from mine where date_trunc('week', at_local) = date_trunc('week', now() at time zone 'Africa/Cairo')
    )
  )
$$;

-- ---------------------------------------------------------------------
-- 3) For the customer: who is bringing my order.
-- ---------------------------------------------------------------------
create or replace function public.order_driver(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('name', d.name, 'phone', d.phone, 'vehicle', d.vehicle)
  from public.orders o join public.drivers d on d.user_id = o.driver_id
  where o.id = p_order_id and o.customer_id = auth.uid() and o.status not in ('delivered', 'cancelled')
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'driver_register(text, text, text)', 'driver_me()', 'driver_set_online(boolean)', 'driver_offers()',
    'driver_accept(uuid)', 'driver_trip()', 'driver_pickup(uuid)', 'driver_deliver(uuid)', 'driver_earnings()',
    'order_driver(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- A customer may no longer cancel once a driver has the trip.
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
  v_driver uuid;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select o.status, o.driver_id into v_status, v_driver
  from public.orders o
  where o.id = p_order_id and o.customer_id = v_user
  for update;
  if not found then
    raise exception 'order not found';
  end if;

  if v_status <> 'placed' or v_driver is not null
     or exists (select 1 from public.order_stores os where os.order_id = p_order_id and os.status <> 'pending') then
    raise exception 'store already accepted the order';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;
revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
