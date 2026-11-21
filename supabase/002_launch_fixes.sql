-- =====================================================================
-- 002 — fixes from the review team (19 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 001.
-- Running it again is harmless.
--
--  1. Store codes were readable by anyone holding the public key, so anyone
--     could link every store and get half commission on all of them.
--     Codes are now hidden, guessing is limited to 10 tries an hour, and
--     each store gets a 4-digit code and a counter phone column.
--  2. Orders now keep the customer's phone and the note they will pay with
--     (so the shop and the driver can call, and the driver brings change).
--  3. Customers can cancel an order until the first store accepts it.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Store codes stay on the sticker, never in the API.
--    Everyone may read the store columns the app shows, but not the codes.
--    Stores also get a counter phone («اتصل بالمحل») and a 4-digit code
--    that older customers can type on an Arabic keyboard.
-- ---------------------------------------------------------------------
alter table public.stores add column if not exists phone text;
alter table public.stores add column if not exists pin_code text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_pin_code_key') then
    alter table public.stores add constraint stores_pin_code_key unique (pin_code);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stores_pin_code_format') then
    alter table public.stores add constraint stores_pin_code_format check (pin_code is null or pin_code ~ '^[0-9]{4}$');
  end if;
end;
$$;

-- 4-digit codes for the 13 sample stores (real stores get theirs at sign-up).
update public.stores s set pin_code = v.pin
from (values
  ('SAQIA', '3172'), ('QAROUN', '5806'), ('WAHA', '2649'), ('OMDA', '7315'), ('NAKHIL', '6094'),
  ('SAYED', '4821'), ('HADAQA', '9157'), ('NOUR', '1738'), ('BOSTAN', '8462'), ('AMANA', '5290'),
  ('RIF', '3967'), ('BALADY', '7543'), ('SULTAN', '2186')
) as v(code, pin)
where s.referral_code = v.code and s.pin_code is null;

revoke select on public.stores from anon, authenticated;
grant select (
  id, name, mark, category_id, area, zone_id, lat, lng, rating,
  eta_min, eta_max, tint, is_pharmacy, daily_prices, phone, is_active, created_at
) on public.stores to anon, authenticated;

-- link_store: accepts the sticker word or the 4-digit number, and stops
-- guessing (at most 10 tries an hour per customer).
create table if not exists public.link_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists link_attempts_user_idx on public.link_attempts (user_id, at desc);
alter table public.link_attempts enable row level security;
revoke all on public.link_attempts from anon, authenticated;

create or replace function public.link_store(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_code, '')));
  v_store public.stores%rowtype;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if (select count(*) from public.link_attempts a where a.user_id = v_user and a.at > now() - interval '1 hour') >= 10 then
    raise exception 'too many tries';
  end if;
  insert into public.link_attempts (user_id) values (v_user);

  select * into v_store from public.stores s
  where (s.referral_code = v_code or s.pin_code = v_code) and s.is_active;
  if not found then
    raise exception 'unknown store code';
  end if;
  insert into public.customer_stores (user_id, store_id) values (v_user, v_store.id) on conflict do nothing;
  return jsonb_build_object('store_id', v_store.id, 'name', v_store.name);
end;
$$;

revoke all on function public.link_store(text) from public, anon;
grant execute on function public.link_store(text) to authenticated;

-- ---------------------------------------------------------------------
-- 2) Phone and "pays with" on the order.
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists pay_with int;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_customer_phone_format') then
    alter table public.orders add constraint orders_customer_phone_format
      check (customer_phone is null or customer_phone ~ '^01[0125][0-9]{8}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_pay_with_range') then
    alter table public.orders add constraint orders_pay_with_range
      check (pay_with is null or pay_with between 1 and 100000);
  end if;
end;
$$;

-- place_order: same as 001, plus p_address->>'phone' and p_address->>'pay_with'.
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
  v_phone text := nullif(trim(coalesce(p_address->>'phone', '')), '');
  v_pay_with int;
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

  -- A note smaller than the total is no help to the driver.
  if v_pay_with is not null and v_pay_with < v_total then
    v_pay_with := null;
  end if;

  insert into public.orders (
    customer_id, payment_method, missing_policy, zone_id, address_text, landmark, lat, lng,
    store_count, subtotal, delivery_fee, total, guaranteed_minutes, customer_phone, pay_with
  ) values (
    v_user, p_payment, p_missing, v_zone.id,
    coalesce(p_address->>'details', ''), coalesce(p_address->>'landmark', ''),
    (p_address->>'lat')::double precision, (p_address->>'lng')::double precision,
    v_store_count, v_subtotal, v_fee, v_total, v_minutes, v_phone, v_pay_with
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

-- ---------------------------------------------------------------------
-- 3) cancel_order: free while every store is still deciding.
-- ---------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select o.status into v_status
  from public.orders o
  where o.id = p_order_id and o.customer_id = v_user
  for update;
  if not found then
    raise exception 'order not found';
  end if;

  if v_status <> 'placed'
     or exists (select 1 from public.order_stores os where os.order_id = p_order_id and os.status <> 'pending') then
    raise exception 'store already accepted the order';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
