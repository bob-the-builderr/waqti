-- =====================================================================
-- 007 — dispatch, driver cash and driver review (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 006.
-- Running it again is harmless.
--
--  • DISPATCH: a ready trip is offered to ONE driver at a time, for 45 s.
--    First in line = the free driver who has waited longest since his last
--    trip. «اقبل» takes it; «مش دلوقتي» or silence passes it to the next.
--    Saying no is never punished. (Nearest-first needs phone GPS: with the APK.)
--  • CASH: each driver has a cash limit (600 EGP to start). Cash he holds =
--    cash orders delivered − what he deposited. Over the limit he only gets
--    orders paid by transfer until he deposits.
--  • REVIEW: new drivers wait as 'pending' until we approve them — unless
--    auto_approve_drivers is 'true' (it is, for testing). Before launch:
--      update public.app_settings set value = 'false' where key = 'auto_approve_drivers';
--
-- Day-to-day, from the Supabase dashboard (Table Editor):
--  • approve a driver:  drivers → status = 'active'   (see view drivers_to_review)
--  • record a deposit:  driver_deposits → insert driver_id, amount, method
--  • see who holds cash: view driver_cash
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Settings, driver columns, deposits, offers.
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
insert into public.app_settings (key, value) values
  ('auto_approve_drivers', 'true'),
  ('offer_seconds', '45')
on conflict (key) do nothing;

alter table public.drivers add column if not exists cash_limit int not null default 600;
alter table public.drivers add column if not exists last_trip_at timestamptz;
alter table public.drivers alter column status set default 'pending';

create table if not exists public.driver_deposits (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(user_id) on delete cascade,
  amount int not null check (amount > 0),
  method text not null default 'instapay' check (method in ('instapay', 'vodafone_cash', 'fawry', 'office')),
  reference text,
  created_at timestamptz not null default now()
);
alter table public.driver_deposits enable row level security;
revoke all on public.driver_deposits from anon, authenticated;

create table if not exists public.trip_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.drivers(user_id) on delete cascade,
  status text not null default 'offered' check (status in ('offered', 'accepted', 'declined', 'expired')),
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  answered_at timestamptz
);
create index if not exists trip_offers_order_idx on public.trip_offers (order_id, status);
-- At most one live offer per driver and per order.
create unique index if not exists trip_offers_live_driver on public.trip_offers (driver_id) where status = 'offered';
create unique index if not exists trip_offers_live_order on public.trip_offers (order_id) where status = 'offered';
alter table public.trip_offers enable row level security;
revoke all on public.trip_offers from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Cash and dispatch (internal).
-- ---------------------------------------------------------------------

-- Cash a driver holds now: cash orders he delivered minus what he deposited.
create or replace function public.driver_cash_held(p_driver uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (
    coalesce((select sum(o.total) from public.orders o
              where o.driver_id = p_driver and o.status = 'delivered' and o.payment_method = 'cash'), 0)
    - coalesce((select sum(d.amount) from public.driver_deposits d where d.driver_id = p_driver), 0)
  )::int
$$;
revoke all on function public.driver_cash_held(uuid) from public, anon, authenticated;

-- Expires old offers and offers every waiting trip to the next driver in line.
-- Runs whenever a driver checks for offers, a shop accepts, or a driver says no.
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
      and not exists (select 1 from public.order_stores os where os.order_id = o.id and os.status = 'pending')
      and exists (select 1 from public.order_stores os where os.order_id = o.id and os.status in ('accepted', 'ready'))
      and not exists (select 1 from public.trip_offers t where t.order_id = o.id and t.status = 'offered')
    order by o.placed_at
  loop
    v_driver := null;
    select d.user_id into v_driver
    from public.drivers d
    where d.status = 'active' and d.is_online
      and public.vehicle_can_take(d.vehicle, r.distance_km)
      and not exists (select 1 from public.orders x where x.driver_id = d.user_id and x.status not in ('delivered', 'cancelled'))
      and not exists (select 1 from public.trip_offers t where t.driver_id = d.user_id and t.status = 'offered')
      and not exists (select 1 from public.trip_offers t where t.driver_id = d.user_id and t.order_id = r.id)
      and (r.payment_method <> 'cash' or public.driver_cash_held(d.user_id) + r.total <= d.cash_limit)
    order by d.last_trip_at nulls first, d.created_at
    limit 1;

    if v_driver is null then
      -- Everyone free has seen it: after 2 minutes they may be asked again.
      delete from public.trip_offers t
      where t.order_id = r.id and t.status in ('declined', 'expired') and t.answered_at < now() - interval '2 minutes';
      continue;
    end if;

    begin
      insert into public.trip_offers (order_id, driver_id, expires_at)
      values (r.id, v_driver, now() + make_interval(secs => v_secs));
    exception when unique_violation then
      null; -- another tick got there first
    end;
  end loop;
end;
$$;
revoke all on function public.dispatch_tick() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Driver functions (replacing 006's broadcast versions).
-- ---------------------------------------------------------------------

create or replace function public.driver_register(p_name text, p_phone text, p_vehicle text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_status text := case
    when (select value from public.app_settings where key = 'auto_approve_drivers') = 'true' then 'active'
    else 'pending'
  end;
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
  -- Re-registering updates the details but never changes an existing status.
  insert into public.drivers (user_id, name, phone, vehicle, status)
  values (v_user, trim(p_name), p_phone, p_vehicle, v_status)
  on conflict (user_id) do update set name = excluded.name, phone = excluded.phone, vehicle = excluded.vehicle;
  return jsonb_build_object('ok', true);
end;
$$;

-- The trip offered to me right now (at most one), with seconds left.
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
  perform public.dispatch_tick();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'order_id', o.id, 'number', o.number, 'placed_at', o.placed_at, 'driver_pay', o.driver_pay,
      'total', o.total, 'payment_method', o.payment_method, 'distance_km', o.distance_km,
      'store_count', o.store_count, 'guaranteed_minutes', o.guaranteed_minutes,
      'drop_area', z.name, 'landmark', o.landmark,
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

-- «اقبل»: only the driver the trip was offered to, while the offer is live.
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
  update public.trip_offers set status = 'accepted', answered_at = now()
  where order_id = p_order_id and driver_id = v_driver and status = 'offered' and expires_at >= now();
  if not found then
    raise exception 'offer expired';
  end if;
  update public.orders set driver_id = v_driver, assigned_at = now()
  where id = p_order_id and driver_id is null and status in ('placed', 'preparing');
  if not found then
    raise exception 'trip taken';
  end if;
  update public.drivers set last_trip_at = now() where user_id = v_driver;
end;
$$;

-- «مش دلوقتي»: pass, at no cost; the trip goes to the next driver at once.
create or replace function public.driver_decline(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.trip_offers set status = 'declined', answered_at = now()
  where order_id = p_order_id and driver_id = public.my_driver_id() and status = 'offered';
  perform public.dispatch_tick();
end;
$$;

-- Going offline hands back any live offer.
create or replace function public.driver_set_online(p_online boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.my_driver_id();
begin
  update public.drivers set is_online = coalesce(p_online, false) where user_id = v_driver;
  if not found then
    raise exception 'not an active driver';
  end if;
  if not coalesce(p_online, false) then
    update public.trip_offers set status = 'declined', answered_at = now() where driver_id = v_driver and status = 'offered';
    perform public.dispatch_tick();
  end if;
end;
$$;

-- Earnings plus the cash he holds and his limit.
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
    ),
    'cash_held', public.driver_cash_held(public.my_driver_id()),
    'cash_limit', (select d.cash_limit from public.drivers d where d.user_id = public.my_driver_id())
  )
$$;

-- A shop accepting is often the moment a trip becomes ready: dispatch at once.
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
  perform public.dispatch_tick();
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'driver_register(text, text, text)', 'driver_offers()', 'driver_accept(uuid)', 'driver_decline(uuid)',
    'driver_set_online(boolean)', 'driver_earnings()', 'merchant_accept(uuid, integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) Views for us (Supabase dashboard only).
-- ---------------------------------------------------------------------
create or replace view public.drivers_to_review
with (security_invoker = true) as
select user_id, name, phone, vehicle, created_at
from public.drivers where status = 'pending'
order by created_at;

create or replace view public.driver_cash
with (security_invoker = true) as
select
  d.user_id, d.name, d.phone, d.status, d.is_online, d.cash_limit,
  public.driver_cash_held(d.user_id) as cash_held,
  (select max(x.created_at) from public.driver_deposits x where x.driver_id = d.user_id) as last_deposit_at
from public.drivers d
order by public.driver_cash_held(d.user_id) desc;

revoke all on public.drivers_to_review from public, anon, authenticated;
revoke all on public.driver_cash from public, anon, authenticated;
