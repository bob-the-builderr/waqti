-- =====================================================================
-- 015 — put the old sample items away for good (20 Nov 2026).
-- Paste once, after 014. Running it again is harmless.
--
-- 012 switched off the hand-made sample items in the shops it stocked from
-- the catalog, but the shop app still listed them as «خلصان» (with the old
-- foreign-brand photos). They are archived now: gone from the shop's list,
-- and past orders that had them keep their lines.
-- =====================================================================

alter table public.products add column if not exists archived boolean not null default false;

update public.products
set archived = true, image_url = null, image_credit = null
where catalog_item_id is null
  and not added_by_shop
  and not is_available
  and store_id in (select md5('store:' || k)::uuid from unnest(array['m1', 'm2', 'v1', 'k1', 'k2', 'b1', 'b2', 'p1', 'p2']) as k);

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
  from public.products p where p.store_id = public.my_store_id() and not p.archived
$$;
revoke all on function public.merchant_products() from public, anon;
grant execute on function public.merchant_products() to authenticated;
