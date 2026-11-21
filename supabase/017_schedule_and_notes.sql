-- =====================================================================
-- 017 — «إمتى؟» (order for later) and a note on a dish (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 016.
-- Running it again is harmless.
--
--  • SCHEDULED: the customer can pick a time from 1 hour to 3 days ahead.
--    The shop doesn't see the order until 60 minutes before, and no rider
--    is sent until 45 minutes before. The promise is the chosen time.
--  • DISH NOTE: on restaurant dishes only, a short note («من غير بصل»),
--    up to 100 letters. Shops see it in bold under the dish.
-- =====================================================================

alter table public.orders add column if not exists scheduled_for timestamptz;
alter table public.order_items add column if not exists customer_note text;

-- One call does it all, so the shop never sees an order before its time or notes are saved.
create or replace function public.place_order_v2(p_items jsonb, p_payment text, p_missing text, p_address jsonb, p_scheduled_for timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_placed jsonb;
  v_order uuid;
begin
  if p_scheduled_for is not null
     and (p_scheduled_for < now() + interval '55 minutes' or p_scheduled_for > now() + interval '3 days') then
    return jsonb_build_object('error', 'bad time');
  end if;

  v_placed := public.place_order(p_items, p_payment, p_missing, p_address);
  v_order := (v_placed->>'order_id')::uuid;

  -- Notes only on restaurant dishes, 100 letters at most.
  update public.order_items i
  set customer_note = left(trim(x.note), 100)
  from jsonb_to_recordset(p_items) as x(product_id uuid, note text)
  where i.order_id = v_order
    and i.product_id = x.product_id
    and nullif(trim(coalesce(x.note, '')), '') is not null
    and exists (select 1 from public.products p join public.stores s on s.id = p.store_id
                where p.id = x.product_id and s.category_id = 'rest');

  -- For later: the promise becomes the chosen time.
  if p_scheduled_for is not null then
    update public.orders
    set scheduled_for = p_scheduled_for,
        guaranteed_minutes = greatest(guaranteed_minutes, ceil(extract(epoch from (p_scheduled_for - placed_at)) / 60)::int)
    where id = v_order;
  end if;

  return v_placed || jsonb_build_object(
    'scheduled_for', p_scheduled_for,
    'guaranteed_minutes', (select o.guaranteed_minutes from public.orders o where o.id = v_order)
  );
end;
$$;
revoke all on function public.place_order_v2(jsonb, text, text, jsonb, timestamptz) from public, anon;
grant execute on function public.place_order_v2(jsonb, text, text, jsonb, timestamptz) to authenticated;

-- Shops: scheduled orders appear 60 minutes before their time; dish notes come along.
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
      o.scheduled_for,
      case when os.status in ('accepted', 'ready') then o.customer_phone else null end as customer_phone,
      case os.status when 'pending' then 0 when 'quoted' then 1 when 'accepted' then 2 when 'ready' then 3 else 4 end as sort_key,
      (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', i.id, 'name', i.name, 'note', i.note, 'qty', i.qty, 'customer_note', i.customer_note,
          'unit_price', i.unit_price, 'line_total', i.line_total, 'out_of_stock', i.out_of_stock
        ) order by i.name), '[]'::jsonb)
        from public.order_items i where i.order_store_id = os.id
      ) as items
    from public.order_stores os
    join public.orders o on o.id = os.order_id
    where os.store_id = public.my_store_id()
      and o.status <> 'cancelled'
      and (o.scheduled_for is null or o.scheduled_for <= now() + interval '60 minutes')
      and (
        os.status in ('pending', 'quoted', 'accepted', 'ready')
        or (o.placed_at at time zone 'Africa/Cairo')::date = (now() at time zone 'Africa/Cairo')::date
      )
    order by o.placed_at desc
    limit 60
  ) x
$$;
revoke all on function public.merchant_orders() from public, anon;
grant execute on function public.merchant_orders() to authenticated;

-- Riders: a scheduled trip is offered 45 minutes before its time (same as 016 otherwise).
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
      and (o.scheduled_for is null or o.scheduled_for <= now() + interval '45 minutes')
      and (
        o.kind = 'errand'
        or (not exists (select 1 from public.order_stores os where os.order_id = o.id and os.status in ('pending', 'quoted'))
            and exists (select 1 from public.order_stores os where os.order_id = o.id and os.status in ('accepted', 'ready')))
      )
      and not exists (select 1 from public.trip_offers t where t.order_id = o.id and t.status = 'offered')
    order by coalesce(o.scheduled_for, o.placed_at)
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
