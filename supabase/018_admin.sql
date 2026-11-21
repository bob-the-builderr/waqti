-- =====================================================================
-- 018 — the admin panel «وقتي — الإدارة» (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 017.
-- Running it again is harmless.
--
-- HOW TO GET IN (one time):
--  1. Supabase → Authentication → Users → «Add user» → «Create new user»:
--     your email and a strong password, tick «Auto Confirm User».
--  2. Then run this line here, with your email:
--       insert into public.admins (user_id) select id from auth.users where email = 'you@example.com' on conflict do nothing;
--  3. Open the admin panel and sign in with that email and password.
-- Only people in public.admins can see or change anything through these functions.
-- =====================================================================

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Everything the panel shows, in one call.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Africa/Cairo')::date;
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  return jsonb_build_object(
    'today', (
      select jsonb_build_object(
        'orders', count(*) filter (where o.status <> 'cancelled'),
        'delivered', count(*) filter (where o.status = 'delivered'),
        'cancelled', count(*) filter (where o.status = 'cancelled'),
        'sales', coalesce(sum(o.subtotal) filter (where o.status = 'delivered'), 0),
        'delivery_fees', coalesce(sum(o.delivery_fee) filter (where o.status = 'delivered'), 0),
        'driver_pay', coalesce(sum(o.driver_pay) filter (where o.status = 'delivered'), 0),
        'commission', coalesce((select sum(os.commission) from public.order_stores os join public.orders x on x.id = os.order_id
                                where x.status = 'delivered' and (x.placed_at at time zone 'Africa/Cairo')::date = v_today
                                  and os.status not in ('rejected', 'rerouted')), 0)
      )
      from public.orders o where (o.placed_at at time zone 'Africa/Cairo')::date = v_today
    ),
    'live', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'number', o.number, 'kind', o.kind, 'status', o.status, 'placed_at', o.placed_at,
        'scheduled_for', o.scheduled_for, 'total', o.total, 'payment_method', o.payment_method,
        'area', z.name, 'customer_phone', o.customer_phone,
        'driver', (select d.name from public.drivers d where d.user_id = o.driver_id),
        'driver_phone', (select d.phone from public.drivers d where d.user_id = o.driver_id),
        'stores', (select coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'status', os.status, 'phone', s.phone) order by s.name), '[]'::jsonb)
                   from public.order_stores os join public.stores s on s.id = os.store_id where os.order_id = o.id),
        'late', now() > o.placed_at + make_interval(mins => o.guaranteed_minutes)
      ) order by o.placed_at)
      from public.orders o join public.zones z on z.id = o.zone_id
      where o.status not in ('delivered', 'cancelled')
    ), '[]'::jsonb),
    'drivers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', d.user_id, 'name', d.name, 'phone', d.phone, 'vehicle', d.vehicle, 'status', d.status,
        'is_online', d.is_online, 'app_open', d.is_online and d.last_seen_at > now() - interval '45 seconds',
        'cash_held', public.driver_cash_held(d.user_id), 'cash_limit', d.cash_limit,
        'rating', d.rating, 'rating_count', d.rating_count, 'created_at', d.created_at,
        'trips_today', (select count(*) from public.orders o where o.driver_id = d.user_id and o.status = 'delivered'
                        and (o.delivered_at at time zone 'Africa/Cairo')::date = v_today)
      ) order by (d.status = 'pending') desc, public.driver_cash_held(d.user_id) desc)
      from public.drivers d
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'product', p.name, 'store', st.name, 'created_at', s.created_at,
        'photo', (select value from public.app_settings where key = 'product_photos_public_base') || s.path
      ) order by s.created_at)
      from public.product_photo_submissions s
      join public.products p on p.id = s.product_id
      join public.stores st on st.id = p.store_id
      where s.status = 'pending'
    ), '[]'::jsonb),
    'shop_products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'size', p.note, 'section', p.section, 'price', p.price,
        'photo', p.image_url, 'store', s.name, 'is_available', p.is_available, 'created_at', p.created_at
      ) order by p.created_at desc)
      from public.products p join public.stores s on s.id = p.store_id
      where p.added_by_shop and not p.archived
    ), '[]'::jsonb),
    'settings', coalesce((select jsonb_object_agg(a.key, a.value) from public.app_settings a
                          where a.key in ('auto_approve_drivers', 'errand_fee', 'errand_driver_pay', 'errand_budget_new', 'errand_budget_max', 'offer_seconds')), '{}'::jsonb)
  );
end;
$$;

-- Approve / stop a rider.
create or replace function public.admin_set_driver_status(p_driver uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  if p_status not in ('active', 'suspended', 'pending') then
    return jsonb_build_object('error', 'bad status');
  end if;
  update public.drivers set status = p_status, is_online = case when p_status = 'active' then is_online else false end
  where user_id = p_driver;
  return jsonb_build_object('ok', found);
end;
$$;

-- A rider handed in cash.
create or replace function public.admin_record_deposit(p_driver uuid, p_amount int, p_method text, p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  if coalesce(p_amount, 0) not between 1 and 100000 then
    return jsonb_build_object('error', 'bad amount');
  end if;
  if coalesce(p_method, '') not in ('instapay', 'vodafone_cash', 'fawry', 'office') then
    return jsonb_build_object('error', 'bad method');
  end if;
  insert into public.driver_deposits (driver_id, amount, method, reference)
  values (p_driver, p_amount, p_method, nullif(trim(coalesce(p_reference, '')), ''));
  return jsonb_build_object('ok', true, 'cash_held', public.driver_cash_held(p_driver));
end;
$$;

-- A customer's product photo: yes (it becomes the catalog photo everywhere) or no.
create or replace function public.admin_review_photo(p_submission uuid, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  if coalesce(p_approve, false) then
    return jsonb_build_object('ok', true, 'url', public.approve_product_photo(p_submission));
  end if;
  update public.product_photo_submissions set status = 'rejected' where id = p_submission and status = 'pending';
  return jsonb_build_object('ok', found);
end;
$$;

-- Take a shop-made item off the shelf (wrong, duplicate or not allowed).
create or replace function public.admin_hide_product(p_product uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  update public.products set is_available = false, archived = true where id = p_product and added_by_shop;
  return jsonb_build_object('ok', found);
end;
$$;

-- Cancel a stuck order (support case).
create or replace function public.admin_cancel_order(p_order uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  update public.orders set status = 'cancelled' where id = p_order and status not in ('delivered', 'cancelled');
  update public.trip_offers set status = 'expired', answered_at = now() where order_id = p_order and status = 'offered';
  return jsonb_build_object('ok', found);
end;
$$;

-- Change one of the panel's settings.
create or replace function public.admin_set_setting(p_key text, p_value text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'not admin');
  end if;
  if p_key not in ('auto_approve_drivers', 'errand_fee', 'errand_driver_pay', 'errand_budget_new', 'errand_budget_max', 'offer_seconds') then
    return jsonb_build_object('error', 'bad setting');
  end if;
  if p_key = 'auto_approve_drivers' and p_value not in ('true', 'false') then
    return jsonb_build_object('error', 'bad value');
  end if;
  if p_key <> 'auto_approve_drivers' and (p_value !~ '^[0-9]{1,6}$' or p_value::int < 1) then
    return jsonb_build_object('error', 'bad value');
  end if;
  insert into public.app_settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'admin_overview()', 'admin_set_driver_status(uuid, text)', 'admin_record_deposit(uuid, integer, text, text)',
    'admin_review_photo(uuid, boolean)', 'admin_hide_product(uuid)', 'admin_cancel_order(uuid)', 'admin_set_setting(text, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;
