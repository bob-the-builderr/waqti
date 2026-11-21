-- =====================================================================
-- 010 — photos for the catalog (20 Nov 2026).
-- Paste the whole file into the Supabase SQL Editor once. Running it again is harmless.
--
-- Shops never photograph their products: every product points at one shared
-- catalog photo (products.image_url). Restaurants and sweet shops also get a
-- cover photo (stores.cover_url); other shops show a cover made of their own
-- products. The sample photos are free placeholders from TheMealDB and
-- Wikimedia Commons (credits kept next to each one) until our team shoots
-- the real catalog. A product with no photo yet shows a clean placeholder.
-- =====================================================================

alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists image_credit text;
alter table public.stores add column if not exists cover_url text;
alter table public.stores add column if not exists cover_credit text;

-- Readable by the apps like the other public columns.
grant select (image_url, image_credit) on public.products to anon, authenticated;
grant select (cover_url, cover_credit) on public.stores to anon, authenticated;

update public.products set image_url = 'https://www.themealdb.com/images/media/meals/4er7mj1598733193.jpg', image_credit = 'TheMealDB' where id = md5('product:r1a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/4er7mj1598733193.jpg', image_credit = 'TheMealDB' where id = md5('product:r1b')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Pastitsio_homemade.jpg/500px-Pastitsio_homemade.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Pastitsio homemade.jpg (CC BY-SA 4.0)' where id = md5('product:r1c')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Colourful_bowl_rice_cakes_%28Put_chai_ko%29.jpg/500px-Colourful_bowl_rice_cakes_%28Put_chai_ko%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Colourful bowl rice cakes (Put chai ko).jpg (CC0)' where id = md5('product:r1d')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/nlxald1764112200.jpg', image_credit = 'TheMealDB' where id = md5('product:r2a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/nlxald1764112200.jpg', image_credit = 'TheMealDB' where id = md5('product:r2b')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/K%C3%B6fte_kebabs.jpg/500px-K%C3%B6fte_kebabs.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Köfte kebabs.jpg (CC BY 2.0)' where id = md5('product:r2c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/dlmh401760524897.jpg', image_credit = 'TheMealDB' where id = md5('product:r2d')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg', image_credit = 'TheMealDB' where id = md5('product:r3a')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Vegetable_pizza_food.jpg/500px-Vegetable_pizza_food.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Vegetable pizza food.jpg (CC BY 4.0)' where id = md5('product:r3b')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/B.B.Q._Chicken_Pizza_%2826679384893%29.jpg/500px-B.B.Q._Chicken_Pizza_%2826679384893%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: B.B.Q. Chicken Pizza (26679384893).jpg (CC BY 2.0)' where id = md5('product:r3c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/9f4z6v1598734293.jpg', image_credit = 'TheMealDB' where id = md5('product:r4a')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Fatir_023%2C_Lion_Village.JPG/500px-Fatir_023%2C_Lion_Village.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Fatir 023, Lion Village.JPG (CC BY-SA 4.0)' where id = md5('product:r4b')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Banana_%2B_Chocolate_cr%C3%AApe_%40_Breakfast_%40_Le_Resto_du_Village_%40_Montr%C3%A9al_%2830461563936%29.jpg/500px-Banana_%2B_Chocolate_cr%C3%AApe_%40_Breakfast_%40_Le_Resto_du_Village_%40_Montr%C3%A9al_%2830461563936%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Banana + Chocolate crêpe @ Breakfast @ Le Resto du Village @ Montréal (30461563936).jpg (CC BY 2.0)' where id = md5('product:r4c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Milk.png', image_credit = 'TheMealDB' where id = md5('product:m1a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Sunflower%20Oil.png', image_credit = 'TheMealDB' where id = md5('product:m1b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Sugar.png', image_credit = 'TheMealDB' where id = md5('product:m1c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Rice.png', image_credit = 'TheMealDB' where id = md5('product:m1d')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Feta.png', image_credit = 'TheMealDB' where id = md5('product:m1e')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Sugar.png', image_credit = 'TheMealDB' where id = md5('product:m2a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Sunflower%20Oil.png', image_credit = 'TheMealDB' where id = md5('product:m2b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Macaroni.png', image_credit = 'TheMealDB' where id = md5('product:m2c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Tea.png', image_credit = 'TheMealDB' where id = md5('product:m2d')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Eggs.png', image_credit = 'TheMealDB' where id = md5('product:m2e')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Doreta_75-650_mg_tbl.jpg/500px-Doreta_75-650_mg_tbl.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Doreta 75-650 mg tbl.jpg (CC BY-SA 4.0)' where id = md5('product:p1a')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/A_surgical_mask_%282017%29.jpg/500px-A_surgical_mask_%282017%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: A surgical mask (2017).jpg (CC0)' where id = md5('product:p1c')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Digital_Thermometer.jpg/500px-Digital_Thermometer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Digital Thermometer.jpg (CC BY-SA 4.0)' where id = md5('product:p1d')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Doreta_75-650_mg_tbl.jpg/500px-Doreta_75-650_mg_tbl.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Doreta 75-650 mg tbl.jpg (CC BY-SA 4.0)' where id = md5('product:p2a')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/A_surgical_mask_%282017%29.jpg/500px-A_surgical_mask_%282017%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: A surgical mask (2017).jpg (CC0)' where id = md5('product:p2c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Tomatoes.png', image_credit = 'TheMealDB' where id = md5('product:v1a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Potatoes.png', image_credit = 'TheMealDB' where id = md5('product:v1b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Cucumber.png', image_credit = 'TheMealDB' where id = md5('product:v1c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Orange.png', image_credit = 'TheMealDB' where id = md5('product:v1d')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Banana.png', image_credit = 'TheMealDB' where id = md5('product:v1e')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Beef.png', image_credit = 'TheMealDB' where id = md5('product:k1a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Minced%20Beef.png', image_credit = 'TheMealDB' where id = md5('product:k1b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Chicken.png', image_credit = 'TheMealDB' where id = md5('product:k2a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Chicken%20Breasts.png', image_credit = 'TheMealDB' where id = md5('product:k2b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Chicken%20Thighs.png', image_credit = 'TheMealDB' where id = md5('product:k2c')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Pita%20Bread.png', image_credit = 'TheMealDB' where id = md5('product:b1a')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/Bread%20Rolls.png', image_credit = 'TheMealDB' where id = md5('product:b1b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/ingredients/White%20Bread.png', image_credit = 'TheMealDB' where id = md5('product:b1c')::uuid;
update public.products set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Basboosa.jpg/500px-Basboosa.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', image_credit = 'Wikimedia Commons: Basboosa.jpg (CC BY-SA 2.0)' where id = md5('product:b2a')::uuid;
update public.products set image_url = 'https://upload.wikimedia.org/wikipedia/commons/4/42/Knafeh_in_Nazareth%2C_Israel.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', image_credit = 'Wikimedia Commons: Knafeh in Nazareth, Israel.png (CC0)' where id = md5('product:b2b')::uuid;
update public.products set image_url = 'https://www.themealdb.com/images/media/meals/tqtywx1468317395.jpg', image_credit = 'TheMealDB' where id = md5('product:b2c')::uuid;

update public.stores set cover_url = 'https://www.themealdb.com/images/media/meals/4er7mj1598733193.jpg', cover_credit = 'TheMealDB' where id = md5('store:r1')::uuid;
update public.stores set cover_url = 'https://www.themealdb.com/images/media/meals/nlxald1764112200.jpg', cover_credit = 'TheMealDB' where id = md5('store:r2')::uuid;
update public.stores set cover_url = 'https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg', cover_credit = 'TheMealDB' where id = md5('store:r3')::uuid;
update public.stores set cover_url = 'https://www.themealdb.com/images/media/meals/9f4z6v1598734293.jpg', cover_credit = 'TheMealDB' where id = md5('store:r4')::uuid;
update public.stores set cover_url = 'https://upload.wikimedia.org/wikipedia/commons/4/42/Knafeh_in_Nazareth%2C_Israel.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', cover_credit = 'Wikimedia Commons: Knafeh in Nazareth, Israel.png (CC0)' where id = md5('store:b2')::uuid;
