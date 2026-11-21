-- =====================================================================
-- 004 — the simple money model, like Talabat (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 003.
-- Running it again is harmless.
--
--  • We collect all the money; every party is paid by transfer.
--  • Shops pay ONE commission per category, from the contract
--    (half for customers who came through the shop's own code).
--  • Delivery is by distance: 15 / 20 / 25 EGP, +7 for each extra shop,
--    never more than 30 for the customer.
--  • The driver is paid per order: 16 + 3 per km after 2 km
--    + 7 per extra shop + a peak / late-night bonus.
--  • Weekly statement per shop: sales, commission, what we owe it.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Commission per category (the contract rate).
--    own_delivery_commission_rate is for shops that deliver with their
--    own boy; it applies once the merchant app can mark such orders.
-- ---------------------------------------------------------------------
update public.categories set commission_rate = case id
  when 'rest' then 0.15
  when 'bakery' then 0.10
  when 'veg' then 0.08
  when 'meat' then 0.08
  when 'market' then 0.06
  when 'pharm' then 0.06
  else commission_rate
end;

alter table public.categories add column if not exists own_delivery_commission_rate numeric(4,3);
update public.categories
set own_delivery_commission_rate = case when id = 'rest' then 0.10 else 0.05 end
where own_delivery_commission_rate is null;

-- ---------------------------------------------------------------------
-- 2) Distance, delivery fee and driver pay: one place for each rule.
-- ---------------------------------------------------------------------

-- Straight-line km between two points, to one decimal (the app shows the same number).
create or replace function public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null
    else round((6371 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    )))::numeric, 1)
  end
$$;

-- What the customer pays for delivery. p_km = the farthest shop in the trip.
create or replace function public.delivery_fee(p_km numeric, p_store_count int)
returns int
language sql
immutable
set search_path = ''
as $$
  select least(
    30,
    (case
      when p_km is null then 20
      when p_km <= 1 then 15
      when p_km <= 2.5 then 20
      else 25
    end) + 7 * greatest(0, p_store_count - 1)
  )::int
$$;

-- What the driver earns for the trip (Cairo time decides the bonus).
create or replace function public.driver_pay(p_km numeric, p_store_count int, p_at timestamptz)
returns int
language sql
stable
set search_path = ''
as $$
  select (
    16
    + 3 * ceil(greatest(0, coalesce(p_km, 2) - 2))
    + 7 * greatest(0, p_store_count - 1)
    + case
        when extract(hour from p_at at time zone 'Africa/Cairo') < 6 then 6           -- after midnight
        when extract(hour from p_at at time zone 'Africa/Cairo') between 14 and 15 then 4  -- 2–4 pm
        when extract(hour from p_at at time zone 'Africa/Cairo') between 20 and 22 then 4  -- 8–11 pm
        else 0
      end
  )::int
$$;

alter table public.orders add column if not exists distance_km numeric(5,1);
alter table public.orders add column if not exists driver_pay int;

-- ---------------------------------------------------------------------
-- 3) place_order: same as 002, with the new delivery fee and driver pay.
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

  -- A note smaller than the total is no help to the driver.
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
    -- Customers the shop brought in through its own code cost it half the commission.
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

-- ---------------------------------------------------------------------
-- 4) Statements, for us only (read them in the Supabase dashboard).
-- ---------------------------------------------------------------------

-- What each shop sold, our commission, and what we transfer to it, per week.
create or replace view public.store_week_statement
with (security_invoker = true) as
select
  os.store_id,
  s.name as store_name,
  date_trunc('week', o.placed_at at time zone 'Africa/Cairo')::date as week_start,
  count(*) as orders,
  sum(os.subtotal) as sales,
  sum(os.commission) as commission,
  sum(os.subtotal - os.commission) as transfer_to_shop
from public.order_stores os
join public.orders o on o.id = os.order_id
join public.stores s on s.id = os.store_id
where o.status = 'delivered'
group by os.store_id, s.name, date_trunc('week', o.placed_at at time zone 'Africa/Cairo')::date;

-- What every order earned us: commission + (delivery fee − driver pay).
create or replace view public.order_economics
with (security_invoker = true) as
select
  o.id as order_id,
  o.number,
  o.status,
  o.placed_at,
  o.subtotal,
  o.delivery_fee,
  o.driver_pay,
  coalesce(c.commission, 0) as commission,
  coalesce(c.commission, 0) + o.delivery_fee - coalesce(o.driver_pay, 0) as our_earning
from public.orders o
left join (
  select order_id, sum(commission)::int as commission from public.order_stores group by order_id
) c on c.order_id = o.id;

revoke all on public.store_week_statement from public, anon, authenticated;
revoke all on public.order_economics from public, anon, authenticated;
