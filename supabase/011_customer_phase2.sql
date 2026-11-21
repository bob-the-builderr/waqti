-- =====================================================================
-- 011 — customer app, phase 2 (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once. Running it again is harmless.
--
--  1. Areas get a centre point, so a pin on the map picks its area by itself.
--  2. Saved addresses («البيت»، «الشغل») fill in the signed-in user by themselves.
--  3. Favourite shops.
--  4. Stars after delivery, for the shop and the driver; the shop's rating moves with them.
--  5. Customers can send a photo for a product that has none; we approve it first.
--     Approve from the SQL editor:  select public.approve_product_photo('<submission id>');
--     (see the list in the view product_photos_to_review)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Area centres (taken from the shops in each area).
-- ---------------------------------------------------------------------
alter table public.zones add column if not exists lat double precision;
alter table public.zones add column if not exists lng double precision;
update public.zones z set lat = v.lat, lng = v.lng
from (values
  ('university', 29.3056, 30.8390),
  ('masalla',    29.3104, 30.8442),
  ('hadaqa',     29.3173, 30.8348),
  ('dalla',      29.2995, 30.8538),
  ('kiman',      29.3201, 30.8489),
  ('sufi',       29.2961, 30.8301)
) as v(id, lat, lng)
where z.id = v.id and z.lat is null;

-- ---------------------------------------------------------------------
-- 2) Saved addresses: the row belongs to whoever saves it.
-- ---------------------------------------------------------------------
alter table public.addresses alter column user_id set default auth.uid();

-- ---------------------------------------------------------------------
-- 3) Favourite shops.
-- ---------------------------------------------------------------------
create table if not exists public.favorite_stores (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);
alter table public.favorite_stores enable row level security;
revoke all on public.favorite_stores from anon;
grant select, insert, delete on public.favorite_stores to authenticated;
drop policy if exists "own favourites" on public.favorite_stores;
create policy "own favourites" on public.favorite_stores for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4) Stars after delivery.
-- ---------------------------------------------------------------------
-- Existing ratings count as 20 reviews, so the first new stars move them gently.
alter table public.stores add column if not exists rating_count int not null default 20;
grant select (rating_count) on public.stores to anon, authenticated;
alter table public.drivers add column if not exists rating numeric(2,1) not null default 5.0;
alter table public.drivers add column if not exists rating_count int not null default 0;

create table if not exists public.order_ratings (
  order_id uuid primary key references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_stars int not null check (store_stars between 1 and 5),
  driver_stars int check (driver_stars between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);
alter table public.order_ratings enable row level security;
revoke all on public.order_ratings from anon, authenticated;
grant select on public.order_ratings to authenticated;
drop policy if exists "own ratings readable" on public.order_ratings;
create policy "own ratings readable" on public.order_ratings for select to authenticated using (user_id = auth.uid());

create or replace function public.rate_order(p_order_id uuid, p_store_stars int, p_driver_stars int, p_comment text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders o where o.id = p_order_id and o.customer_id = v_user;
  if not found or v_order.status <> 'delivered' then
    return jsonb_build_object('error', 'not rateable');
  end if;
  if coalesce(p_store_stars, 0) not between 1 and 5 or (p_driver_stars is not null and p_driver_stars not between 1 and 5) then
    return jsonb_build_object('error', 'bad stars');
  end if;
  insert into public.order_ratings (order_id, user_id, store_stars, driver_stars, comment)
  values (p_order_id, v_user, p_store_stars, p_driver_stars, nullif(left(trim(coalesce(p_comment, '')), 500), ''))
  on conflict (order_id) do nothing;
  if not found then
    return jsonb_build_object('error', 'already rated');
  end if;
  update public.stores s
  set rating = round((s.rating * s.rating_count + p_store_stars)::numeric / (s.rating_count + 1), 1),
      rating_count = s.rating_count + 1
  where s.id in (select os.store_id from public.order_stores os where os.order_id = p_order_id and os.status not in ('rejected', 'rerouted'));
  if p_driver_stars is not null and v_order.driver_id is not null then
    update public.drivers d
    set rating = round((d.rating * d.rating_count + p_driver_stars)::numeric / (d.rating_count + 1), 1),
        rating_count = d.rating_count + 1
    where d.user_id = v_order.driver_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.rate_order(uuid, int, int, text) from public, anon;
grant execute on function public.rate_order(uuid, int, int, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Product photos sent by customers.
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('product_photos_public_base', 'https://wtzxosrsunyqxhzlqosi.supabase.co/storage/v1/object/public/product-photos/')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- A signed-in customer may only upload into submissions/<their id>/.
drop policy if exists "customers upload product photos" on storage.objects;
create policy "customers upload product photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create table if not exists public.product_photo_submissions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists product_photo_submissions_status_idx on public.product_photo_submissions (status, created_at);
alter table public.product_photo_submissions enable row level security;
revoke all on public.product_photo_submissions from anon, authenticated;

-- After the upload: records it for review. At most 20 a day per customer.
create or replace function public.submit_product_photo(p_product_id uuid, p_path text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return jsonb_build_object('error', 'not signed in');
  end if;
  if coalesce(p_path, '') not like 'submissions/' || v_user::text || '/%' then
    return jsonb_build_object('error', 'bad path');
  end if;
  if not exists (select 1 from public.products p where p.id = p_product_id) then
    return jsonb_build_object('error', 'no such product');
  end if;
  if (select count(*) from public.product_photo_submissions s where s.user_id = v_user and s.created_at > now() - interval '1 day') >= 20 then
    return jsonb_build_object('error', 'too many tries');
  end if;
  insert into public.product_photo_submissions (product_id, user_id, path) values (p_product_id, v_user, p_path);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.submit_product_photo(uuid, text) from public, anon;
grant execute on function public.submit_product_photo(uuid, text) to authenticated;

-- For us: approve one photo; it becomes the product's catalog photo.
create or replace function public.approve_product_photo(p_submission uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.product_photo_submissions%rowtype;
  v_url text;
begin
  select * into v_sub from public.product_photo_submissions where id = p_submission and status = 'pending';
  if not found then
    return 'not pending';
  end if;
  v_url := (select value from public.app_settings where key = 'product_photos_public_base') || v_sub.path;
  update public.products set image_url = v_url, image_credit = 'صورة من عميل' where id = v_sub.product_id;
  update public.product_photo_submissions set status = 'approved' where id = p_submission;
  update public.product_photo_submissions set status = 'rejected'
  where product_id = v_sub.product_id and status = 'pending' and id <> p_submission;
  return v_url;
end;
$$;
revoke all on function public.approve_product_photo(uuid) from public, anon, authenticated;

create or replace view public.product_photos_to_review
with (security_invoker = true) as
select s.id, p.name as product, st.name as store,
       (select value from public.app_settings where key = 'product_photos_public_base') || s.path as photo,
       s.created_at
from public.product_photo_submissions s
join public.products p on p.id = s.product_id
join public.stores st on st.id = p.store_id
where s.status = 'pending'
order by s.created_at;
revoke all on public.product_photos_to_review from public, anon, authenticated;
