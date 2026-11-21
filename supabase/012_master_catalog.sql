-- =====================================================================
-- 012 — the master catalog (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once, after 011.
-- Running it again is harmless (it never overwrites a price a shop has set).
--
-- One shared list of products (catalog_items): 192 items Egyptian shops
-- in Fayoum sell, by aisle, with brand and size. A shop stocks an item by
-- linking to it and setting its own price; the photo lives on the catalog
-- item, so one photo (from the brand, our shoot, or an approved customer
-- photo) shows in every shop at once.
--
-- Photos: fresh produce, meat, poultry, eggs and bread use clean studio
-- photos (TheMealDB, free to use). Branded packs have NO photo yet on purpose:
-- the app shows a clean brand card until the brand's official packshot or our
-- own shoot arrives. Never copy photos from other apps or shop websites.
--
-- Prices here are SAMPLE prices for testing only.
--
-- Add a photo to a catalog item (every shop selling it updates by itself):
--   update public.catalog_items set image_url = '<link>', image_credit = 'جهينة' where id = 'milk-juhayna-1l';
-- =====================================================================

create table if not exists public.catalog_items (
  id text primary key,
  category_id text not null references public.categories(id),
  section text not null,
  brand text not null default '',
  name text not null,
  size text not null default '',
  ref_price int not null check (ref_price > 0),
  image_url text,
  image_credit text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.catalog_items enable row level security;
grant select on public.catalog_items to anon, authenticated;
drop policy if exists "catalog readable" on public.catalog_items;
create policy "catalog readable" on public.catalog_items for select to anon, authenticated using (true);

alter table public.products add column if not exists catalog_item_id text references public.catalog_items(id);
alter table public.products add column if not exists section text;
alter table public.products add column if not exists brand text;
create index if not exists products_catalog_idx on public.products (catalog_item_id);
grant select (catalog_item_id, section, brand) on public.products to anon, authenticated;

-- A catalog photo reaches every shop that sells the item.
create or replace function public.sync_catalog_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products set image_url = new.image_url, image_credit = new.image_credit
  where catalog_item_id = new.id;
  return new;
end;
$$;
drop trigger if exists catalog_photo_sync on public.catalog_items;
create trigger catalog_photo_sync after update of image_url on public.catalog_items
  for each row when (new.image_url is distinct from old.image_url)
  execute function public.sync_catalog_photo();

insert into public.catalog_items (id, category_id, section, brand, name, size, ref_price, image_url, image_credit, sort) values
  ('milk-juhayna-1l', 'market', 'ألبان وبيض', 'جهينة', 'لبن جهينة كامل الدسم', '1 لتر', 55, null, null, 1),
  ('milk-juhayna-lf-1l', 'market', 'ألبان وبيض', 'جهينة', 'لبن جهينة خالي الدسم', '1 لتر', 55, null, null, 2),
  ('milk-juhayna-250', 'market', 'ألبان وبيض', 'جهينة', 'لبن جهينة كامل الدسم', '250 مل', 16, null, null, 3),
  ('milk-almarai-1l', 'market', 'ألبان وبيض', 'المراعي', 'لبن المراعي كامل الدسم', '1 لتر', 57, null, null, 4),
  ('milk-lamar-1l', 'market', 'ألبان وبيض', 'لمار', 'لبن لمار كامل الدسم', '1 لتر', 52, null, null, 5),
  ('milk-loose', 'market', 'ألبان وبيض', '', 'لبن جاموسي فلاحي', '1 لتر', 45, 'https://www.themealdb.com/images/ingredients/Milk.png', 'TheMealDB', 6),
  ('zabadi-juhayna', 'market', 'ألبان وبيض', 'جهينة', 'زبادي جهينة', '105 جم', 9, null, null, 7),
  ('zabadi-almarai', 'market', 'ألبان وبيض', 'المراعي', 'زبادي المراعي', '100 جم', 9, null, null, 8),
  ('zabadi-greek', 'market', 'ألبان وبيض', 'جهينة', 'زبادي يوناني جهينة', '150 جم', 22, null, null, 9),
  ('rayeb-juhayna', 'market', 'ألبان وبيض', 'جهينة', 'رايب جهينة', '1 لتر', 48, null, null, 10),
  ('feta-domty-500', 'market', 'ألبان وبيض', 'دومتي', 'جبنة فيتا دومتي', '500 جم', 52, null, null, 11),
  ('feta-domty-250', 'market', 'ألبان وبيض', 'دومتي', 'جبنة فيتا دومتي', '250 جم', 28, null, null, 12),
  ('cheese-domiati', 'market', 'ألبان وبيض', '', 'جبنة دمياطي', 'نص كيلو', 85, null, null, 13),
  ('cheese-qareish', 'market', 'ألبان وبيض', '', 'جبنة قريش', 'نص كيلو', 45, null, null, 14),
  ('cheese-romy', 'market', 'ألبان وبيض', '', 'جبنة رومي', 'ربع كيلو', 95, null, null, 15),
  ('cheese-cheddar', 'market', 'ألبان وبيض', '', 'جبنة شيدر', 'ربع كيلو', 90, null, null, 16),
  ('cheese-mozzarella', 'market', 'ألبان وبيض', '', 'جبنة موتزاريلا', 'ربع كيلو', 85, null, null, 17),
  ('cheese-kiri-8', 'market', 'ألبان وبيض', 'البقرة الضاحكة', 'جبنة البقرة الضاحكة', '8 قطع', 48, null, null, 18),
  ('cheese-kiri-12', 'market', 'ألبان وبيض', 'كيري', 'جبنة كيري مربعات', '12 قطعة', 95, null, null, 19),
  ('cream-juhayna', 'market', 'ألبان وبيض', 'جهينة', 'كريمة طبخ جهينة', '200 مل', 35, null, null, 20),
  ('qishta', 'market', 'ألبان وبيض', '', 'قشطة بلدي', 'ربع كيلو', 60, null, null, 21),
  ('butter-baladi', 'market', 'ألبان وبيض', '', 'زبدة بقري بلدي', 'ربع كيلو', 110, null, null, 22),
  ('eggs-white-30', 'market', 'ألبان وبيض', '', 'بيض أبيض', 'طبق 30 بيضة', 195, 'https://www.themealdb.com/images/ingredients/Eggs.png', 'TheMealDB', 23),
  ('eggs-red-10', 'market', 'ألبان وبيض', '', 'بيض أحمر', '10 بيضات', 70, 'https://www.themealdb.com/images/ingredients/Eggs.png', 'TheMealDB', 24),
  ('oil-crystal-1l', 'market', 'زيوت وسمن', 'كريستال', 'زيت كريستال عباد الشمس', '1 لتر', 110, null, null, 25),
  ('oil-crystal-2l', 'market', 'زيوت وسمن', 'كريستال', 'زيت كريستال عباد الشمس', '2.2 لتر', 235, null, null, 26),
  ('oil-afia-corn', 'market', 'زيوت وسمن', 'عافية', 'زيت عافية ذرة', '1.5 لتر', 175, null, null, 27),
  ('oil-hala', 'market', 'زيوت وسمن', 'هلا', 'زيت هلا خليط', '1 لتر', 85, null, null, 28),
  ('oil-olive', 'market', 'زيوت وسمن', '', 'زيت زيتون بكر', 'نص لتر', 250, 'https://www.themealdb.com/images/ingredients/Olive%20Oil.png', 'TheMealDB', 29),
  ('ghee-crystal', 'market', 'زيوت وسمن', 'كريستال', 'سمنة كريستال', '1.5 كجم', 165, null, null, 30),
  ('ghee-baladi', 'market', 'زيوت وسمن', '', 'سمنة بلدي', 'نص كيلو', 220, null, null, 31),
  ('rice-doha', 'market', 'رز ومكرونة وبقوليات', 'الضحى', 'رز الضحى مصري', '1 كجم', 42, null, null, 32),
  ('rice-loose', 'market', 'رز ومكرونة وبقوليات', '', 'رز مصري سايب', '1 كيلو', 36, null, null, 33),
  ('pasta-malika', 'market', 'رز ومكرونة وبقوليات', 'الملكة', 'مكرونة الملكة', '400 جم', 22, null, null, 34),
  ('pasta-regina', 'market', 'رز ومكرونة وبقوليات', 'ريجينا', 'مكرونة ريجينا', '400 جم', 24, null, null, 35),
  ('spaghetti-regina', 'market', 'رز ومكرونة وبقوليات', 'ريجينا', 'اسباجتي ريجينا', '400 جم', 24, null, null, 36),
  ('vermicelli-malika', 'market', 'رز ومكرونة وبقوليات', 'الملكة', 'شعرية الملكة', '350 جم', 18, null, null, 37),
  ('lentils-yellow', 'market', 'رز ومكرونة وبقوليات', '', 'عدس أصفر', '1 كيلو', 75, null, null, 38),
  ('lentils-brown', 'market', 'رز ومكرونة وبقوليات', '', 'عدس بجبة', '1 كيلو', 70, null, null, 39),
  ('chickpeas', 'market', 'رز ومكرونة وبقوليات', '', 'حمص الشام', '1 كيلو', 90, null, null, 40),
  ('fava-dry', 'market', 'رز ومكرونة وبقوليات', '', 'فول بلدي ناشف', '1 كيلو', 70, null, null, 41),
  ('beans-white', 'market', 'رز ومكرونة وبقوليات', '', 'فاصوليا بيضا', '1 كيلو', 95, null, null, 42),
  ('flour-doha', 'market', 'رز ومكرونة وبقوليات', 'الضحى', 'دقيق الضحى فاخر', '1 كجم', 32, null, null, 43),
  ('flour-loose', 'market', 'رز ومكرونة وبقوليات', '', 'دقيق أبيض سايب', '1 كيلو', 28, null, null, 44),
  ('oats', 'market', 'رز ومكرونة وبقوليات', '', 'شوفان', '500 جم', 75, null, null, 45),
  ('sugar-doha', 'market', 'سكر وشاي وقهوة', 'الضحى', 'سكر الضحى', '1 كجم', 38, null, null, 46),
  ('sugar-loose', 'market', 'سكر وشاي وقهوة', '', 'سكر سايب', '1 كيلو', 34, null, null, 47),
  ('tea-arosa-250', 'market', 'سكر وشاي وقهوة', 'العروسة', 'شاي العروسة ناعم', '250 جم', 78, null, null, 48),
  ('tea-arosa-bags', 'market', 'سكر وشاي وقهوة', 'العروسة', 'شاي العروسة فتلة', '25 فتلة', 45, null, null, 49),
  ('tea-lipton-100', 'market', 'سكر وشاي وقهوة', 'ليبتون', 'شاي ليبتون فتلة', '100 فتلة', 140, null, null, 50),
  ('tea-lipton-250', 'market', 'سكر وشاي وقهوة', 'ليبتون', 'شاي ليبتون ناعم', '250 جم', 95, null, null, 51),
  ('coffee-abuauf', 'market', 'سكر وشاي وقهوة', 'أبو عوف', 'بن أبو عوف تركي محوّج', '200 جم', 160, null, null, 52),
  ('coffee-nescafe-3in1', 'market', 'سكر وشاي وقهوة', 'نسكافيه', 'نسكافيه 3 في 1', '24 كيس', 190, null, null, 53),
  ('coffee-nescafe-classic', 'market', 'سكر وشاي وقهوة', 'نسكافيه', 'نسكافيه كلاسيك', '50 جم', 95, null, null, 54),
  ('hibiscus', 'market', 'سكر وشاي وقهوة', '', 'كركديه', 'ربع كيلو', 60, null, null, 55),
  ('cocoa', 'market', 'سكر وشاي وقهوة', '', 'كاكاو بودرة', '100 جم', 45, null, null, 56),
  ('paste-heinz', 'market', 'معلبات وصلصات', 'هاينز', 'صلصة طماطم هاينز', '360 جم', 38, null, null, 57),
  ('tuna-sunshine', 'market', 'معلبات وصلصات', 'صن شاين', 'تونة صن شاين قطع', '140 جم', 70, null, null, 58),
  ('foul-americana', 'market', 'معلبات وصلصات', 'أمريكانا', 'فول مدمس أمريكانا', '400 جم', 25, null, null, 59),
  ('ketchup-heinz', 'market', 'معلبات وصلصات', 'هاينز', 'كاتشب هاينز', '320 جم', 45, null, null, 60),
  ('mayo-heinz', 'market', 'معلبات وصلصات', 'هاينز', 'مايونيز هاينز', '225 مل', 55, null, null, 61),
  ('jam-vitrac', 'market', 'معلبات وصلصات', 'فيتراك', 'مربى فيتراك فراولة', '450 جم', 55, null, null, 62),
  ('halawa-rashidi', 'market', 'معلبات وصلصات', 'الرشيدي الميزان', 'حلاوة طحينية الرشيدي الميزان', '350 جم', 65, null, null, 63),
  ('tahini', 'market', 'معلبات وصلصات', '', 'طحينة', '250 جم', 55, null, null, 64),
  ('molasses', 'market', 'معلبات وصلصات', '', 'عسل أسود', '400 جم', 40, null, null, 65),
  ('honey', 'market', 'معلبات وصلصات', '', 'عسل نحل', 'نص كيلو', 180, null, null, 66),
  ('vinegar', 'market', 'معلبات وصلصات', '', 'خل أبيض', '1 لتر', 18, null, null, 67),
  ('salt', 'market', 'معلبات وصلصات', '', 'ملح طعام', '1 كيلو', 12, null, null, 68),
  ('cumin', 'market', 'معلبات وصلصات', '', 'كمون مطحون', '100 جم', 35, 'https://www.themealdb.com/images/ingredients/Cumin.png', 'TheMealDB', 69),
  ('black-pepper', 'market', 'معلبات وصلصات', '', 'فلفل أسود مطحون', '100 جم', 60, null, null, 70),
  ('cinnamon', 'market', 'معلبات وصلصات', '', 'قرفة', '50 جم', 30, 'https://www.themealdb.com/images/ingredients/Cinnamon.png', 'TheMealDB', 71),
  ('yeast', 'market', 'معلبات وصلصات', '', 'خميرة فورية', '11 جم', 8, null, null, 72),
  ('baking-powder', 'market', 'معلبات وصلصات', '', 'بيكنج باودر', '10 جم', 6, null, null, 73),
  ('chipsy-salt', 'market', 'سناكس وحلويات', 'شيبسي', 'شيبسي ملح', 'كيس عائلي', 25, null, null, 74),
  ('chipsy-tomato', 'market', 'سناكس وحلويات', 'شيبسي', 'شيبسي طماطم', 'كيس عائلي', 25, null, null, 75),
  ('chipsy-cheese', 'market', 'سناكس وحلويات', 'شيبسي', 'شيبسي جبنة', 'كيس عائلي', 25, null, null, 76),
  ('doritos', 'market', 'سناكس وحلويات', 'دوريتوس', 'دوريتوس سويت تشيلي', 'كيس', 20, null, null, 77),
  ('tiger', 'market', 'سناكس وحلويات', 'تايجر', 'تايجر شطة وليمون', 'كيس', 10, null, null, 78),
  ('molto-cheese', 'market', 'سناكس وحلويات', 'مولتو', 'مولتو جبنة', 'قطعة', 15, null, null, 79),
  ('molto-choc', 'market', 'سناكس وحلويات', 'مولتو', 'مولتو شوكولاتة', 'قطعة', 15, null, null, 80),
  ('todo', 'market', 'سناكس وحلويات', 'تودو', 'كيك تودو', 'قطعة', 10, null, null, 81),
  ('bake-rolz', 'market', 'سناكس وحلويات', 'بيك رولز', 'بيك رولز بيتزا', 'كيس', 15, null, null, 82),
  ('twinkies', 'market', 'سناكس وحلويات', 'توينكيز', 'توينكيز', 'قطعة', 10, null, null, 83),
  ('hohos', 'market', 'سناكس وحلويات', 'هوهوز', 'هوهوز', 'قطعة', 10, null, null, 84),
  ('kitkat', 'market', 'سناكس وحلويات', 'كيت كات', 'كيت كات', '4 أصابع', 30, null, null, 85),
  ('galaxy', 'market', 'سناكس وحلويات', 'جالاكسي', 'جالاكسي سادة', '36 جم', 30, null, null, 86),
  ('oreo', 'market', 'سناكس وحلويات', 'أوريو', 'بسكويت أوريو', '6 قطع', 15, null, null, 87),
  ('marie', 'market', 'سناكس وحلويات', 'بسكو مصر', 'بسكويت ماري', 'كيس', 10, null, null, 88),
  ('chocolate-bar', 'market', 'سناكس وحلويات', '', 'شوكولاتة باللبن', '100 جم', 55, 'https://www.themealdb.com/images/ingredients/Chocolate.png', 'TheMealDB', 89),
  ('peanuts', 'market', 'سناكس وحلويات', '', 'سوداني محمص', 'ربع كيلو', 40, 'https://www.themealdb.com/images/ingredients/Peanuts.png', 'TheMealDB', 90),
  ('walnuts', 'market', 'سناكس وحلويات', '', 'عين جمل', 'ربع كيلو', 160, 'https://www.themealdb.com/images/ingredients/Walnuts.png', 'TheMealDB', 91),
  ('raisins', 'market', 'سناكس وحلويات', '', 'زبيب', 'ربع كيلو', 70, 'https://www.themealdb.com/images/ingredients/Raisins.png', 'TheMealDB', 92),
  ('water-nestle', 'market', 'مشروبات', 'نستله', 'مياه نستله', '1.5 لتر', 9, null, null, 93),
  ('water-aquafina', 'market', 'مشروبات', 'أكوافينا', 'مياه أكوافينا', '1.5 لتر', 9, null, null, 94),
  ('water-baraka-6', 'market', 'مشروبات', 'بركة', 'مياه بركة', '6 × 1.5 لتر', 52, null, null, 95),
  ('pepsi-1l', 'market', 'مشروبات', 'بيبسي', 'بيبسي', '1 لتر', 25, null, null, 96),
  ('coke-1l', 'market', 'مشروبات', 'كوكاكولا', 'كوكاكولا', '1 لتر', 25, null, null, 97),
  ('sprite-1l', 'market', 'مشروبات', 'سبرايت', 'سبرايت', '1 لتر', 25, null, null, 98),
  ('pepsi-can', 'market', 'مشروبات', 'بيبسي', 'بيبسي كانز', '330 مل', 18, null, null, 99),
  ('juice-juhayna-guava', 'market', 'مشروبات', 'جهينة', 'عصير جهينة جوافة', '1 لتر', 45, null, null, 100),
  ('juice-juhayna-orange', 'market', 'مشروبات', 'جهينة', 'عصير جهينة برتقال', '1 لتر', 45, null, null, 101),
  ('juice-beyti-mango', 'market', 'مشروبات', 'بيتي', 'عصير بيتي مانجو', '1 لتر', 45, null, null, 102),
  ('juice-fresh-orange', 'market', 'مشروبات', '', 'عصير برتقال فريش', '1 لتر', 60, null, null, 103),
  ('persil-2_5', 'market', 'منظفات', 'برسيل', 'مسحوق برسيل أوتوماتيك', '2.5 كجم', 260, null, null, 104),
  ('ariel-2_5', 'market', 'منظفات', 'أريال', 'مسحوق أريال أوتوماتيك', '2.5 كجم', 270, null, null, 105),
  ('fairy-1l', 'market', 'منظفات', 'فيري', 'فيري سائل أطباق ليمون', '1 لتر', 85, null, null, 106),
  ('clorox-1l', 'market', 'منظفات', 'كلوركس', 'كلوركس', '1 لتر', 30, null, null, 107),
  ('dettol-500', 'market', 'منظفات', 'ديتول', 'ديتول مطهر', '500 مل', 110, null, null, 108),
  ('harpic', 'market', 'منظفات', 'هاربيك', 'هاربيك منظف تواليت', '750 مل', 75, null, null, 109),
  ('tissue-fine', 'market', 'منظفات', 'فاين', 'مناديل فاين', '500 منديل', 45, null, null, 110),
  ('garbage-bags', 'market', 'منظفات', '', 'أكياس زبالة', '20 كيس', 25, null, null, 111),
  ('soap-lux', 'market', 'عناية شخصية', 'لوكس', 'صابون لوكس', '4 قطع', 75, null, null, 112),
  ('soap-dettol', 'market', 'عناية شخصية', 'ديتول', 'صابون ديتول', 'قطعة', 25, null, null, 113),
  ('paste-colgate', 'market', 'عناية شخصية', 'كولجيت', 'معجون كولجيت', '100 مل', 55, null, null, 114),
  ('paste-signal', 'market', 'عناية شخصية', 'سيجنال', 'معجون سيجنال', '100 مل', 45, null, null, 115),
  ('shampoo-hs', 'market', 'عناية شخصية', 'هيد آند شولدرز', 'شامبو هيد آند شولدرز', '400 مل', 190, null, null, 116),
  ('shampoo-pantene', 'market', 'عناية شخصية', 'بانتين', 'شامبو بانتين', '400 مل', 180, null, null, 117),
  ('pampers-4', 'market', 'أطفال', 'بامبرز', 'حفاضات بامبرز مقاس 4', '52 حفاضة', 650, null, null, 118),
  ('molfix-4', 'market', 'أطفال', 'مولفيكس', 'حفاضات مولفيكس مقاس 4', '58 حفاضة', 520, null, null, 119),
  ('cerelac', 'market', 'أطفال', 'سيريلاك', 'سيريلاك قمح باللبن', '125 جم', 85, null, null, 120),
  ('tomatoes', 'veg', 'خضار', '', 'طماطم', 'كيلو', 20, 'https://www.themealdb.com/images/ingredients/Tomatoes.png', 'TheMealDB', 121),
  ('potatoes', 'veg', 'خضار', '', 'بطاطس', 'كيلو', 22, 'https://www.themealdb.com/images/ingredients/Potatoes.png', 'TheMealDB', 122),
  ('onion-red', 'veg', 'خضار', '', 'بصل أحمر', 'كيلو', 18, 'https://www.themealdb.com/images/ingredients/Red%20Onions.png', 'TheMealDB', 123),
  ('onion-white', 'veg', 'خضار', '', 'بصل أبيض', 'كيلو', 20, 'https://www.themealdb.com/images/ingredients/Onion.png', 'TheMealDB', 124),
  ('garlic', 'veg', 'خضار', '', 'ثوم بلدي', 'ربع كيلو', 30, 'https://www.themealdb.com/images/ingredients/Garlic.png', 'TheMealDB', 125),
  ('cucumber', 'veg', 'خضار', '', 'خيار', 'كيلو', 25, 'https://www.themealdb.com/images/ingredients/Cucumber.png', 'TheMealDB', 126),
  ('pepper-green', 'veg', 'خضار', '', 'فلفل رومي أخضر', 'كيلو', 30, 'https://www.themealdb.com/images/ingredients/Green%20Pepper.png', 'TheMealDB', 127),
  ('pepper-red', 'veg', 'خضار', '', 'فلفل ألوان أحمر', 'كيلو', 80, 'https://www.themealdb.com/images/ingredients/Red%20Pepper.png', 'TheMealDB', 128),
  ('pepper-yellow', 'veg', 'خضار', '', 'فلفل ألوان أصفر', 'كيلو', 80, 'https://www.themealdb.com/images/ingredients/Yellow%20Pepper.png', 'TheMealDB', 129),
  ('eggplant', 'veg', 'خضار', '', 'باذنجان رومي', 'كيلو', 25, 'https://www.themealdb.com/images/ingredients/Aubergine.png', 'TheMealDB', 130),
  ('zucchini', 'veg', 'خضار', '', 'كوسة', 'كيلو', 30, 'https://www.themealdb.com/images/ingredients/Courgettes.png', 'TheMealDB', 131),
  ('carrots', 'veg', 'خضار', '', 'جزر', 'كيلو', 20, 'https://www.themealdb.com/images/ingredients/Carrots.png', 'TheMealDB', 132),
  ('sweet-potato', 'veg', 'خضار', '', 'بطاطا', 'كيلو', 25, 'https://www.themealdb.com/images/ingredients/Sweet%20Potatoes.png', 'TheMealDB', 133),
  ('cabbage', 'veg', 'خضار', '', 'كرنب', 'واحدة', 15, 'https://www.themealdb.com/images/ingredients/Cabbage.png', 'TheMealDB', 134),
  ('ginger', 'veg', 'خضار', '', 'جنزبيل', 'ربع كيلو', 40, 'https://www.themealdb.com/images/ingredients/Ginger.png', 'TheMealDB', 135),
  ('lemon', 'veg', 'خضار', '', 'ليمون بلدي', 'كيلو', 40, 'https://www.themealdb.com/images/ingredients/Lemon.png', 'TheMealDB', 136),
  ('lime', 'veg', 'خضار', '', 'ليمون أضاليا', 'كيلو', 50, 'https://www.themealdb.com/images/ingredients/Lime.png', 'TheMealDB', 137),
  ('lettuce', 'veg', 'ورقيات', '', 'خس بلدي', 'واحدة', 10, 'https://www.themealdb.com/images/ingredients/Lettuce.png', 'TheMealDB', 138),
  ('spinach', 'veg', 'ورقيات', '', 'سبانخ', 'كيلو', 20, 'https://www.themealdb.com/images/ingredients/Spinach.png', 'TheMealDB', 139),
  ('parsley', 'veg', 'ورقيات', '', 'بقدونس', 'حزمة', 5, 'https://www.themealdb.com/images/ingredients/Parsley.png', 'TheMealDB', 140),
  ('coriander', 'veg', 'ورقيات', '', 'كزبرة خضرا', 'حزمة', 5, 'https://www.themealdb.com/images/ingredients/Coriander.png', 'TheMealDB', 141),
  ('dill', 'veg', 'ورقيات', '', 'شبت', 'حزمة', 5, 'https://www.themealdb.com/images/ingredients/Dill.png', 'TheMealDB', 142),
  ('mint', 'veg', 'ورقيات', '', 'نعناع', 'حزمة', 5, 'https://www.themealdb.com/images/ingredients/Mint.png', 'TheMealDB', 143),
  ('orange', 'veg', 'فاكهة', '', 'برتقال', 'كيلو', 25, 'https://www.themealdb.com/images/ingredients/Orange.png', 'TheMealDB', 144),
  ('banana', 'veg', 'فاكهة', '', 'موز', 'كيلو', 40, 'https://www.themealdb.com/images/ingredients/Banana.png', 'TheMealDB', 145),
  ('apple', 'veg', 'فاكهة', '', 'تفاح أحمر', 'كيلو', 70, 'https://www.themealdb.com/images/ingredients/Apple.png', 'TheMealDB', 146),
  ('strawberries', 'veg', 'فاكهة', '', 'فراولة', 'كيلو', 60, 'https://www.themealdb.com/images/ingredients/Strawberries.png', 'TheMealDB', 147),
  ('pomegranate', 'veg', 'فاكهة', '', 'رمان', 'كيلو', 35, 'https://www.themealdb.com/images/ingredients/Pomegranate.png', 'TheMealDB', 148),
  ('kiwi', 'veg', 'فاكهة', '', 'كيوي', 'كيلو', 120, 'https://www.themealdb.com/images/ingredients/Kiwi.png', 'TheMealDB', 149),
  ('guava', 'veg', 'فاكهة', '', 'جوافة', 'كيلو', 30, null, null, 150),
  ('mandarin', 'veg', 'فاكهة', '', 'يوسفي', 'كيلو', 25, null, null, 151),
  ('beef-kandouz', 'meat', 'لحوم', '', 'لحم كندوز', 'كيلو', 460, 'https://www.themealdb.com/images/ingredients/Beef.png', 'TheMealDB', 152),
  ('beef-minced', 'meat', 'لحوم', '', 'لحم مفروم', 'كيلو', 440, 'https://www.themealdb.com/images/ingredients/Minced%20Beef.png', 'TheMealDB', 153),
  ('lamb', 'meat', 'لحوم', '', 'لحم ضاني', 'كيلو', 520, 'https://www.themealdb.com/images/ingredients/Lamb.png', 'TheMealDB', 154),
  ('kofta-raw', 'meat', 'لحوم', '', 'كفتة نيّة متبّلة', 'كيلو', 420, 'https://www.themealdb.com/images/ingredients/Lamb%20Mince.png', 'TheMealDB', 155),
  ('sausage', 'meat', 'لحوم', '', 'سجق بلدي', 'كيلو', 380, null, null, 156),
  ('beef-liver', 'meat', 'لحوم', '', 'كبدة بلدي', 'كيلو', 480, null, null, 157),
  ('chicken-white', 'meat', 'فراخ', '', 'فرخة بيضاء كاملة', 'كيلو', 95, null, null, 158),
  ('chicken-baladi', 'meat', 'فراخ', '', 'فرخة بلدي', 'كيلو', 150, null, null, 159),
  ('chicken-breasts', 'meat', 'فراخ', '', 'صدور فراخ', 'كيلو', 190, null, null, 160),
  ('chicken-thighs', 'meat', 'فراخ', '', 'أوراك فراخ', 'كيلو', 120, 'https://www.themealdb.com/images/ingredients/Chicken%20Thighs.png', 'TheMealDB', 161),
  ('chicken-legs', 'meat', 'فراخ', '', 'دبابيس فراخ', 'كيلو', 110, null, null, 162),
  ('chicken-wings', 'meat', 'فراخ', '', 'أجنحة فراخ', 'كيلو', 90, null, null, 163),
  ('chicken-pane', 'meat', 'فراخ', '', 'بانيه متبّل', 'كيلو', 220, null, null, 164),
  ('chicken-liver', 'meat', 'فراخ', '', 'كبد وقوانص', 'كيلو', 90, null, null, 165),
  ('bread-baladi', 'bakery', 'عيش', '', 'عيش بلدي', '10 أرغفة', 20, 'https://www.themealdb.com/images/ingredients/Pita%20Bread.png', 'TheMealDB', 166),
  ('bread-fino', 'bakery', 'عيش', '', 'عيش فينو', '5 أرغفة', 15, 'https://www.themealdb.com/images/ingredients/Baguette.png', 'TheMealDB', 167),
  ('bread-shami', 'bakery', 'عيش', '', 'عيش شامي', '5 أرغفة', 20, 'https://www.themealdb.com/images/ingredients/Pita%20Bread.png', 'TheMealDB', 168),
  ('bread-toast', 'bakery', 'عيش', '', 'عيش توست', 'رغيف', 35, 'https://www.themealdb.com/images/ingredients/Bread.png', 'TheMealDB', 169),
  ('bread-rolls', 'bakery', 'عيش', '', 'عيش برجر', '6 قطع', 30, 'https://www.themealdb.com/images/ingredients/Bread%20Rolls.png', 'TheMealDB', 170),
  ('rusk', 'bakery', 'عيش', '', 'بقسماط', 'نص كيلو', 45, null, null, 171),
  ('basbousa', 'bakery', 'حلويات', '', 'بسبوسة', 'ربع كيلو', 45, null, null, 172),
  ('konafa-cream', 'bakery', 'حلويات', '', 'كنافة بالقشطة', 'ربع كيلو', 60, null, null, 173),
  ('cake-small', 'bakery', 'حلويات', '', 'تورتة صغيرة', '6 أفراد', 280, null, null, 174),
  ('gateau-choc', 'bakery', 'حلويات', '', 'جاتوه شوكولاتة', 'قطعة', 30, null, null, 175),
  ('balah-sham', 'bakery', 'حلويات', '', 'بلح الشام', 'ربع كيلو', 40, null, null, 176),
  ('ghorayeba', 'bakery', 'حلويات', '', 'غريبة', 'ربع كيلو', 70, null, null, 177),
  ('panadol-advance', 'pharm', 'مسكنات وبرد', 'بنادول', 'بنادول أدفانس', '24 قرص', 60, null, null, 178),
  ('panadol-extra', 'pharm', 'مسكنات وبرد', 'بنادول', 'بنادول إكسترا', '24 قرص', 70, null, null, 179),
  ('congestal', 'pharm', 'مسكنات وبرد', 'كونجستال', 'كونجستال', '20 قرص', 45, null, null, 180),
  ('strepsils', 'pharm', 'مسكنات وبرد', 'ستربسلز', 'ستربسلز أقراص استحلاب', '24 قرص', 90, null, null, 181),
  ('vitamin-c', 'pharm', 'فيتامينات', '', 'فيتامين سي فوار', '20 قرص', 60, null, null, 182),
  ('omega-3', 'pharm', 'فيتامينات', '', 'أوميجا 3', '30 كبسولة', 150, null, null, 183),
  ('ors', 'pharm', 'إسعافات أولية', '', 'محلول معالجة الجفاف', '10 أكياس', 30, null, null, 184),
  ('plasters', 'pharm', 'إسعافات أولية', '', 'بلاستر جروح', '20 قطعة', 25, null, null, 185),
  ('gauze', 'pharm', 'إسعافات أولية', '', 'شاش طبي', 'لفة', 15, null, null, 186),
  ('alcohol-70', 'pharm', 'إسعافات أولية', '', 'كحول 70%', '250 مل', 35, null, null, 187),
  ('masks', 'pharm', 'إسعافات أولية', '', 'كمامات طبية', '10 قطع', 25, null, null, 188),
  ('thermometer', 'pharm', 'إسعافات أولية', '', 'ميزان حرارة رقمي', 'قطعة', 120, null, null, 189),
  ('sanitizer', 'pharm', 'عناية', '', 'جل معقم لليدين', '250 مل', 55, null, null, 190),
  ('vaseline', 'pharm', 'عناية', 'فازلين', 'فازلين', '100 مل', 60, null, null, 191),
  ('sunblock', 'pharm', 'عناية', '', 'واقي شمس', '50 مل', 220, null, null, 192)
on conflict (id) do update set
  category_id = excluded.category_id, section = excluded.section, brand = excluded.brand, name = excluded.name,
  size = excluded.size, ref_price = excluded.ref_price, sort = excluded.sort,
  image_url = coalesce(public.catalog_items.image_url, excluded.image_url),
  image_credit = coalesce(public.catalog_items.image_credit, excluded.image_credit);

-- Stock the sample shops from the catalog (a shop's own price is kept on re-runs).
insert into public.products (id, store_id, name, note, price, sort, catalog_item_id, section, brand, image_url, image_credit, is_available)
select md5('product:' || s.key || ':' || c.id)::uuid, md5('store:' || s.key)::uuid, c.name, c.size, c.ref_price, c.sort,
       c.id, c.section, c.brand, c.image_url, c.image_credit, true
from public.catalog_items c
join (values
  ('m1', 'market', null), ('m2', 'market', null), ('v1', 'veg', null),
  ('k1', 'meat', 'لحوم'), ('k2', 'meat', 'فراخ'), ('b1', 'bakery', 'عيش'), ('b2', 'bakery', 'حلويات'),
  ('p1', 'pharm', null), ('p2', 'pharm', null)
) as s(key, cat, section) on c.category_id = s.cat and (s.section is null or c.section = s.section)
on conflict (id) do update set
  name = excluded.name, note = excluded.note, sort = excluded.sort, catalog_item_id = excluded.catalog_item_id,
  section = excluded.section, brand = excluded.brand, image_url = excluded.image_url,
  image_credit = excluded.image_credit, is_available = true;

-- The old hand-made sample items in those shops step aside (orders that had them keep their lines).
update public.products set is_available = false
where catalog_item_id is null
  and store_id in (select md5('store:' || k)::uuid from unnest(array['m1', 'm2', 'v1', 'k1', 'k2', 'b1', 'b2', 'p1', 'p2']) as k);

-- Restaurants: weak stand-in photos out; each restaurant gets its own dishes shot at sign-up.
update public.products set image_url = null, image_credit = null where id in (md5('product:r1c')::uuid, md5('product:r1d')::uuid, md5('product:r4c')::uuid);
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/04axct1763793018.jpg', image_credit = 'TheMealDB'
where id = md5('product:r2c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/9f4z6v1598734293.jpg', image_credit = 'TheMealDB'
where id = md5('product:r4b')::uuid;

-- An approved customer photo now goes on the catalog item, so every shop gets it.
create or replace function public.approve_product_photo(p_submission uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.product_photo_submissions%rowtype;
  v_url text;
  v_catalog text;
begin
  select * into v_sub from public.product_photo_submissions where id = p_submission and status = 'pending';
  if not found then
    return 'not pending';
  end if;
  v_url := (select value from public.app_settings where key = 'product_photos_public_base') || v_sub.path;
  select p.catalog_item_id into v_catalog from public.products p where p.id = v_sub.product_id;
  if v_catalog is not null then
    update public.catalog_items set image_url = v_url, image_credit = 'صورة من عميل' where id = v_catalog;
  else
    update public.products set image_url = v_url, image_credit = 'صورة من عميل' where id = v_sub.product_id;
  end if;
  update public.product_photo_submissions set status = 'approved' where id = p_submission;
  update public.product_photo_submissions s set status = 'rejected'
  where s.status = 'pending' and s.id <> p_submission
    and (s.product_id = v_sub.product_id
         or (v_catalog is not null and s.product_id in (select p.id from public.products p where p.catalog_item_id = v_catalog)));
  return v_url;
end;
$$;
revoke all on function public.approve_product_photo(uuid) from public, anon, authenticated;
