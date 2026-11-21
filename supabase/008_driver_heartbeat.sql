-- =====================================================================
-- 008 — only drivers who have the app open get offers (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 007.
-- Running it again is harmless.
--
-- Found in testing 007: a driver who switched «متاح» on and then closed the
-- app stayed «online» forever, so every trip waited 45 s on him first.
-- Now the app checks in every time it looks for offers (every 8 s), and a
-- trip is only offered to drivers seen in the last 45 seconds.
-- =====================================================================

alter table public.drivers add column if not exists last_seen_at timestamptz;

-- Drivers who already did trips queue by their real last trip, not as "never".
update public.drivers d set last_trip_at = x.at
from (
  select o.driver_id, max(coalesce(o.assigned_at, o.placed_at)) as at
  from public.orders o where o.driver_id is not null group by o.driver_id
) x
where x.driver_id = d.user_id and d.last_trip_at is null;

-- Same as 007, plus: the driver must have checked in within 45 seconds.
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
      and d.last_seen_at > now() - interval '45 seconds'
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

-- Looking for offers = checking in.
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

-- Switching «متاح» on counts as checking in too.
create or replace function public.driver_set_online(p_online boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver uuid := public.my_driver_id();
begin
  update public.drivers
  set is_online = coalesce(p_online, false),
      last_seen_at = case when coalesce(p_online, false) then now() else last_seen_at end
  where user_id = v_driver;
  if not found then
    raise exception 'not an active driver';
  end if;
  if not coalesce(p_online, false) then
    update public.trip_offers set status = 'declined', answered_at = now() where driver_id = v_driver and status = 'offered';
    perform public.dispatch_tick();
  end if;
end;
$$;

revoke all on function public.driver_offers() from public, anon;
grant execute on function public.driver_offers() to authenticated;
revoke all on function public.driver_set_online(boolean) from public, anon;
grant execute on function public.driver_set_online(boolean) to authenticated;

-- Who is really online right now (dashboard only).
drop view if exists public.driver_cash;
create view public.driver_cash
with (security_invoker = true) as
select
  d.user_id, d.name, d.phone, d.status, d.is_online,
  (d.is_online and d.last_seen_at > now() - interval '45 seconds') as app_open,
  d.cash_limit,
  public.driver_cash_held(d.user_id) as cash_held,
  (select max(x.created_at) from public.driver_deposits x where x.driver_id = d.user_id) as last_deposit_at
from public.drivers d
order by public.driver_cash_held(d.user_id) desc;
revoke all on public.driver_cash from public, anon, authenticated;
