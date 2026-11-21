-- =====================================================================
-- 009 — big cash orders reach a driver (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 008.
-- Running it again is harmless.
--
-- Found in testing: the cash-limit check was "cash he holds + this order
-- ≤ 600", so a cash order above 600 EGP never reached anyone. Now the rule
-- is the one the driver app shows: a driver who holds less than his limit
-- gets cash orders; one who reached it gets only transfer orders until he
-- deposits.
-- =====================================================================

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
      -- Cash orders skip drivers who already hold their limit; a big order still
      -- goes to someone below it (else it would wait forever).
      and (r.payment_method <> 'cash' or public.driver_cash_held(d.user_id) < d.cash_limit)
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
