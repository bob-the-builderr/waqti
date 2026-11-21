-- =====================================================================
-- 013 — take down catalog photos that don't fit (20 Nov 2026).
-- Paste once, after 012. Running it again is harmless.
--
-- Every stand-in photo was checked by eye. 29 of them showed a foreign
-- brand's pack (cheese, butter, flour, spices, sauces), a cooked dish instead
-- of raw chicken, or (for «سجق بلدي») a pork sausage pack. They come down;
-- those items show their clean name card until the real photo arrives.
-- Every shop selling them updates by itself.
-- =====================================================================

update public.catalog_items set image_url = null, image_credit = null
where id in ('cheese-domiati', 'cheese-qareish', 'cheese-romy', 'cheese-cheddar', 'cheese-mozzarella', 'qishta', 'butter-baladi', 'ghee-baladi', 'lentils-yellow', 'lentils-brown', 'chickpeas', 'flour-loose', 'oats', 'cocoa', 'tahini', 'molasses', 'honey', 'vinegar', 'salt', 'black-pepper', 'yeast', 'baking-powder', 'juice-fresh-orange', 'chicken-white', 'chicken-baladi', 'chicken-breasts', 'chicken-legs', 'chicken-wings', 'sausage')
  and image_credit = 'TheMealDB';
