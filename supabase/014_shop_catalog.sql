-- =====================================================================
-- 014 — shops build their own shelf (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 013.
-- Running it again is harmless.
--
--  • «من الكتالوج»: a shop picks items from the master catalog for its kind
--    of shop and sets its own price. Photo, name and size come with them.
--  • «منتج جديد»: a shop adds something the catalog doesn't have, with its
--    own photo if it likes. It shows in the shop at once.
--    We see every shop-made item in the view shop_products_to_review, so good
--    ones can join the master catalog for everyone.
-- =====================================================================

-- Photos taken by shop staff go under product-photos/shops/<their id>/.
drop policy if exists "shops upload product photos" on storage.objects;
create policy "shops upload product photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = 'shops'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

alter table public.products add column if not exists added_by_shop boolean not null default false;

-- The shop's items, now with photo, brand, aisle and where they came from.
create or replace function public.merchant_products()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'name', p.name, 'note', p.note, 'price', p.price, 'is_available', p.is_available,
    'image_url', p.image_url, 'brand', p.brand, 'section', p.section, 'catalog_item_id', p.catalog_item_id
  ) order by p.sort, p.name), '[]'::jsonb)
  from public.products p where p.store_id = public.my_store_id()
$$;

-- The catalog for this kind of shop, marking what the shop already sells.
create or replace function public.merchant_catalog()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'name', c.name, 'brand', c.brand, 'size', c.size, 'section', c.section,
    'ref_price', c.ref_price, 'image_url', c.image_url,
    'stocked', exists (select 1 from public.products p where p.store_id = st.id and p.catalog_item_id = c.id and p.is_available)
  ) order by c.sort), '[]'::jsonb)
  from public.stores st
  join public.catalog_items c on c.category_id = st.category_id
  where st.id = public.my_store_id()
$$;

-- «ضيف»: put a catalog item on the shelf at the shop's own price.
create or replace function public.merchant_stock(p_catalog_item_id text, p_price int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid := public.my_store_id();
  v_item public.catalog_items%rowtype;
  v_id uuid;
begin
  if v_store is null then
    return jsonb_build_object('error', 'not shop staff');
  end if;
  if coalesce(p_price, 0) not between 1 and 100000 then
    return jsonb_build_object('error', 'bad price');
  end if;
  select c.* into v_item from public.catalog_items c
  join public.stores st on st.category_id = c.category_id and st.id = v_store
  where c.id = p_catalog_item_id;
  if not found then
    return jsonb_build_object('error', 'not in catalog');
  end if;
  update public.products set price = p_price, is_available = true
  where store_id = v_store and catalog_item_id = v_item.id
  returning id into v_id;
  if v_id is null then
    insert into public.products (store_id, name, note, price, sort, catalog_item_id, section, brand, image_url, image_credit, is_available)
    values (v_store, v_item.name, v_item.size, p_price, v_item.sort, v_item.id, v_item.section, v_item.brand, v_item.image_url, v_item.image_credit, true)
    returning id into v_id;
  end if;
  return jsonb_build_object('ok', true, 'product_id', v_id);
end;
$$;

-- «منتج جديد»: something the catalog doesn't have, with the shop's own photo if any.
create or replace function public.merchant_add_product(p_name text, p_size text, p_section text, p_price int, p_image_path text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid := public.my_store_id();
  v_url text;
  v_id uuid;
begin
  if v_store is null then
    return jsonb_build_object('error', 'not shop staff');
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 80 then
    return jsonb_build_object('error', 'bad name');
  end if;
  if coalesce(p_price, 0) not between 1 and 100000 then
    return jsonb_build_object('error', 'bad price');
  end if;
  if p_image_path is not null then
    if p_image_path not like 'shops/' || auth.uid()::text || '/%' then
      return jsonb_build_object('error', 'bad path');
    end if;
    v_url := (select value from public.app_settings where key = 'product_photos_public_base') || p_image_path;
  end if;
  insert into public.products (store_id, name, note, price, sort, section, image_url, image_credit, is_available, added_by_shop)
  values (
    v_store, trim(p_name), left(trim(coalesce(p_size, '')), 40), p_price,
    coalesce((select max(p.sort) from public.products p where p.store_id = v_store), 0) + 1,
    nullif(left(trim(coalesce(p_section, '')), 40), ''), v_url,
    case when v_url is null then null else 'صورة من المحل' end, true, true
  )
  returning id into v_id;
  return jsonb_build_object('ok', true, 'product_id', v_id);
end;
$$;

-- A photo for one of the shop's own items (catalog items get theirs from the catalog).
create or replace function public.merchant_set_photo(p_product_id uuid, p_image_path text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  if coalesce(p_image_path, '') not like 'shops/' || auth.uid()::text || '/%' then
    return jsonb_build_object('error', 'bad path');
  end if;
  v_url := (select value from public.app_settings where key = 'product_photos_public_base') || p_image_path;
  update public.products set image_url = v_url, image_credit = 'صورة من المحل'
  where id = p_product_id and store_id = public.my_store_id() and catalog_item_id is null;
  if not found then
    return jsonb_build_object('error', 'not your item');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'merchant_products()', 'merchant_catalog()', 'merchant_stock(text, integer)',
    'merchant_add_product(text, text, text, integer, text)', 'merchant_set_photo(uuid, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- For us: what shops added themselves (candidates for the master catalog).
create or replace view public.shop_products_to_review
with (security_invoker = true) as
select p.id, s.name as store, p.name, p.note as size, p.section, p.price, p.image_url as photo, p.created_at
from public.products p
join public.stores s on s.id = p.store_id
where p.added_by_shop
order by p.created_at desc;
revoke all on public.shop_products_to_review from public, anon, authenticated;
