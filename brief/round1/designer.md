# Designer review, round 1: customer app

Reviewer: senior mobile product designer. Scope: customer app UI, `apps/customer/src`.

**Screenshots** are in `brief/round1/designer-shots/` (`*-s.png` is 390x844, `*-t.png` is 390x2400). Headless Chrome on this machine clamps window width to 500px, so I captured through CDP device emulation (`Emulation.setDeviceMetricsOverride`, width 390, mobile true) and verified `innerWidth = 390` with no horizontal overflow. These shots show the real 390px layout without clipping.

---

## 1. Verdict

The app is **clean, honest and readable, but it looks like a well-built form, not a delivery app.**

**First impression.** Talabat opens on a bold brand color, a large search bar ("search restaurants, groceries…") and a photographic grid of verticals. Its store listings promote reorder, Mart, deals and live tracking. Breadfast opens on photos of real products, a delivery-time chip and rails of items with a "+" button. Our app opens on a mustard card for an errand service that isn't built yet, then a dashed empty box, then six identical pale-teal line icons. There is no photo anywhere in the app.

**Hierarchy.** The most valuable area of the screen goes to «هاتلي أي حاجة», the hardest flow to fulfill. The three differentiators appear as two low-contrast banners that read like terms and conditions.

**Density.** About 2.5 useful blocks fit per viewport, against 5–6 on Talabat. Item rows on store pages are 94px tall for text-only content, so you see six items per screen; a grocery with 300 items is unusable.

**Polish.** Every surface is a white box with a 1px beige border on a sand background, with no elevation. Shops are single letters in pastel squares. Body text sizes drift between 12, 12.5, 13, 13.5 and 14.5px, with no scale behind them.

| Screen | Score | Main reason |
|---|---|---|
| Home `/` | 5 | Calm and legible, but the hierarchy is inverted (errand hero first), the category tiles are generic, the differentiators sit in disclaimer banners, and «محلاتك» wastes 150px when empty |
| All stores `/stores` | 6 | Works and scans well, but has letter avatars, no open/closed state, no guaranteed time on the rows, and the category chips pop in late |
| Category `/category/*` | 5 | Same row component, no sub-filters (koshary, grills, pizza), header counts like «4 محل» and «2 محل» are ungrammatical, and the category name repeats on every row |
| Store page `/store/*` | 4 | No cover, no sections, no sticky tabs, no in-store search, weak outlined "+" buttons, and an ETA range (25–35) that contradicts the "guaranteed time" promise. It won't scale past about 15 items |
| Checkout `/checkout` (from source) | 6 | The logic is the strongest in the app (groups per shop, guarantee, missing-item choice, honest fees), but lines can't be edited, the second shop is never upsold, the CTA «اطلب» is weak, and the empty state is a dead end |
| Order placed | 3 | Developer copy is leaking («اتسجّل في قاعدة البيانات… لما نبني تطبيقاتهم»), there's no tracking, and it ends on two equal-weight buttons |
| Orders `/orders` | 4 | No live order pinned at the top, no reorder, cards can't be tapped, and the empty state has no call to action |
| Link store `/link-store` | 4 | Placeholder bidi bug (`مثال: SAYED` renders as ":مثال SAYED"), no customer benefit is stated, dev copy («في نسخة الموبايل…»), and no scanner UI |
| Account | 2 | A placeholder with dev copy |

---

## 2. Screen-by-screen audit

### Home: `src/app/(tabs)/index.tsx`
1. **Inverted hierarchy.** The saffron errand hero is about 190px tall and holds the first thing every user sees. *Fix:* reorder the screen as: header (address + search) → **verticals bento** → «محلاتك» → «اطلب تاني» → a promise strip → «قريب منك» list. «هاتلي أي حاجة» becomes a full-width tile at the bottom of the bento ("مش لاقي محلك؟ هاتلي أي حاجة"). It stays visible but isn't the headline.
2. **Category tiles are identical** (a 48px pale square with a 26px stroke icon). The meat icon reads as an eye, and the bread icon as a basket. *Fix:* a bento grid where مطاعم and سوبرماركت are large tiles (2 columns, 120px tall) and the other four are small tiles (2 rows of 2, or 4 across at 96px). Each tile gets a **catalog photo cut-out** (a koshary plate, a basket, a tomato and cucumber, a loaf), a category tint background, and a label at 15/600. This one change does more for perceived quality than everything else on this list.
3. **The search only searches shop names** («ابحث عن محل بالاسم») and silently opens the Stores tab. *Fix:* the placeholder «ابحث عن صنف أو محل… عيش، بنادول، كشري», which opens a real search screen (see §3).
4. **The «محلاتك» empty state** is a 110x120 dashed box plus a 12.5px grey hint, aligned to the opposite edge. *Fix:* when empty, a single 72px horizontal card (copy in §4.3). When there are linked shops, show 64px round avatars with a «محلك» ribbon.
5. **Two stacked promise banners** (moto and shield) at 13.5px. *Fix:* one **promise strip** of 3 equal columns, each with an icon and 2 lines of 13/600: «مشوار واحد لـ3 محلات» · «وقت مضمون» · «نفس سعر المحل». Tapping it opens a "how it works" bottom sheet.
6. **«قريب منك»** is a horizontal rail of 150px cards with letter avatars, and the page ends at 1,000px. *Fix:* make it a **vertical list** of full-width store cards (§5 card pattern). Every top app ends home on an infinite store list; rails are for curated subsets.
7. **The address header** wraps the pin in a 40px tinted square. *Fix:* a single 48px row: «التوصيل إلى» at 13 grey, then «البيت · حي الجامعة ▾» at 16/600. Make the header sticky and collapse it to the search bar alone on scroll.

### All stores: `src/app/(tabs)/stores.tsx`
1. On the first frame the chip row showed only «الكل» because categories were still loading, and the rest popped in later. *Fix:* render 6 skeleton chips while `categories.isPending`.
2. **The row omits** open/closed status, the guaranteed time, and the linked badge. *Fix:* the store card adds «مضمون خلال 40 د» (one number, §4.2), a «مقفول · بيفتح 9 ص» state with a 50% dimmed thumbnail, and a «محلك» badge.
3. **The «روشتة» badge** floats on the far edge, detached from its row. *Fix:* move it inline into the meta line.
4. **Count grammar:** use a plural helper («محل واحد / محلين / 3–10 محلات / 11+ محل»).

### Category: `src/app/category/[id].tsx`
1. «4 محل» and «2 محل» in the header are grammatical errors. *Fix:* use `storesWord()`, which already exists in `lib/pricing.ts`.
2. The rows repeat «مطاعم ·» on every row. *Fix:* inside a category, show the area only.
3. *Fix:* add a **sub-filter rail** with round thumbnails for restaurants (كشري، فول وطعمية، مشويات، بيتزا، فطاطري) and for markets (بقالة، سوبرماركت), placed above the sort chips. Sort becomes a single «ترتيب: الأقرب ▾» chip that opens a sheet, which saves a row.

### Store page: `src/app/store/[id].tsx` (the most important screen, and currently the weakest)
1. **No hero.** The screen starts with a bordered card that repeats the name already shown in the header. *Fix:* a 160px **cover** (a storefront photo the field onboarding team shoots on the visit; one photo, not product photos), then a 64px logo/mark overlapping the cover edge, the name at 22/700, then one meta line: «★ 4.7 (120) · مضمون خلال 40 د · توصيل 20 ج». The header becomes transparent over the cover and turns solid after 120px of scroll.
2. **The ETA range "25–35 دقيقة"** has two problems. In RTL it renders as "35–25", which older users misread. It also contradicts the guarantee. *Fix:* show **one number everywhere**, «خلال 40 د», computed with `guaranteeMinutes([store])` (etaMax + 5).
3. **No sections, no sticky tabs, no search.** *Fix:* use `SectionList` with a **sticky horizontal tab bar** (scroll-spy: tapping a tab scrolls to its section, and scrolling updates the active tab), plus a search icon in the header that filters within the shop. The data needs a `section` text column on `products`, filled from the category templates.
4. **Item rows:** the price is teal (the same color as actions), the "+" is a 44px *outlined* beige box with the lowest emphasis on the screen, and descriptions are 12.5 grey. *Fix:* two layouts by shop type:
   - **Restaurants and pharmacies → list rows.** Name at 16/600, description at 14/400 grey (2 lines max), price at 16/600 **ink**, and a 72px catalog thumbnail at the end when one exists, with a **filled** "+" (36px visual, 44px hit area) overlapping the thumbnail's bottom corner. With no thumbnail, the "+" sits alone at the end.
   - **Grocery, vegetables, meat and bakery → a 3-column grid of product tiles** (photo 1:1 from the shared catalog, price 16/600, name 14 on 2 lines, unit «1 كيلو» at 13 grey, "+" top-corner overlay that expands into a stepper). This matches the talabat mart and Breadfast product-card pattern and fits because those photos come from the master catalog, not the shop.
5. **Daily prices** are flagged only by a 12px grey note. *Fix:* a chip under the meta line: «أسعار النهارده · اتحدّثت 8:30 ص», using the success container color.
6. **The prescription card** uses a pharmacy-cross icon that reads as "add". *Fix:* a camera icon and an explicit button «صوّر الروشتة». Pin it as a sticky secondary action under the tabs on pharmacy pages.
7. **Missing:** the closed state, and the feedback after adding an item to a *second* shop (today it's only a toast, §4.1).

### Checkout: `src/app/checkout.tsx`
1. **Lines are read-only.** *Fix:* add a stepper on every line, with swipe or "–" to zero to remove it. Each group header gets the shop mark, «+ ضيف أصناف» (back to the shop) and a subtotal.
2. **The single best upsell is missing.** With 1 shop, insert «ضيف محل تاني لنفس المشوار بـ5 ج بس» with 3 nearby shops from *other* categories (pharmacy, bakery, vegetables). That is pillar 4 turned into revenue (§4.1).
3. **The guarantee says only "40 دقيقة".** *Fix:* add a clock time: «هيوصلك قبل 8:40 م», because older users act on the clock, not on a duration.
4. **Missing-item choice:** the chips are fine, but the label «لو صنف مش موجود:» has a dangling colon. *Fix:* the section title «لو صنف خلص» with 3 radio rows, each with one line of explanation («هنتصل بيك قبل ما نكمّل»).
5. **Payment:** «إنستاباي أو محفظة للمندوب عند الباب» is too long. *Fix:* «محفظة أو إنستاباي» with a 13px subline «تحوّل للمندوب وهو عندك».
6. **The CTA «اطلب»** is too weak. *Fix:* «أكّد الطلب · 185 ج» on a 56px button, with the fee breakdown one tap away.
7. **Empty cart** has no illustration and no action. *Fix:* §3 #7.

### Order placed: `src/app/order-placed.tsx`
Delete the dev note. *Fix:* go straight to `/order/[id]` (tracking) after a 1.2-second success transition (a check mark plus «طلبك وصل للمحل»). Never strand the user on a static page.

### Orders: `src/app/(tabs)/orders.tsx`
1. *Fix:* pin a **live order card** at the top (progress bar, «باقي 18 د», tap to track).
2. *Fix:* give past orders a **«اطلب تاني»** button on the card (it fills the cart with the same items, at today's prices) and make the whole card open the order details.
3. *Fix:* use a status color per state (success for delivered, danger for cancelled), not teal for everything.
4. *Fix:* the empty state gets a primary button «ابدأ أول طلب» that goes to home.

### Link store: `src/app/link-store.tsx`
1. **Bidi bug:** the Arabic and Latin placeholder combined with `letterSpacing: 2` renders the colon on the wrong side and can break Arabic letter joining. *Fix:* a Latin-only placeholder `SAYED`, an Arabic label above the field, and `letterSpacing` applied only when `value` is non-empty.
2. **No customer benefit is stated.** *Fix:* copy in §4.3.
3. *Fix:* **camera-first**: a full-bleed scanner frame with «امسح الستيكر», and «اكتب الكود بدل كده» as a text button underneath. On web, keep typing, but use 6 segmented boxes.
4. *Fix:* remove «في نسخة الموبايل…».

### Global
- **Dev copy is leaking into the customer UI** in 6 places (the toasts on home and stores, account, link-store, order-placed). Replace it with a neutral «قريباً» bottom sheet: «الخدمة دي جاية قريب. نبلّغك أول ما تشتغل؟» with a primary button «بلّغني».
- **Loading:** a centered spinner on every screen. *Fix:* skeletons shaped like the final cards.
- **RTL:** the back chevron points correctly to the right (good). The things to watch are ranges (above), mixed-script strings, and any future arrows: flip directional icons only, never the clock or check icons.

---

## 3. Missing screens and patterns (prioritized)

**P0: needed before any real customer.**
1. **Order tracking `/order/[id]`.** A status hero, a guarantee countdown, a 5-step timeline, a rider card with a call button, the per-shop status in multi-shop orders, and «مساعدة». Wireframe in §4.
2. **Phone login with OTP.** One field «رقم موبايلك» with a fixed +20 prefix, then 6 boxes for the code, auto-read on Android, «ابعت الكود على واتساب» as the fallback, and a resend timer. Ask for it **at checkout**, not on launch. Let people browse anonymously, as Rabbit advertises.
3. **Address picker.** A map pin («حرّك الخريطة على باب البيت»), then a form: المنطقة (picker), الشارع, العمارة/الدور/الشقة, and **علامة مميزة (إجباري)** with suggestion chips «جنب جامع…»، «قصاد صيدلية…». Fayoum addresses work by landmark. Save the address as «البيت / الشغل / بيت العيلة».
4. **Unified search `/search`.** Results grouped as «أصناف» (item rows showing the shop name, price and "+") and «محلات». Recent searches plus popular chips («عيش بلدي، بنادول، كشري، طماطم»). The empty result falls back to «هاتلي أي حاجة».
5. **Item sheet.** For restaurant items with options (size, extras) and for any item with a long name: photo, name, price, option radios, stepper, and «ضيف · 60 ج».
6. **Reorder.** On the order card, in a home rail «اطلب تاني», and on the order-details screen.
7. **Empty cart.** «سلتك فاضية» with the line «ضيف من لحد 3 محلات وهيجيلك كله في مشوار واحد», a «تصفّح المحلات» button, and the linked shops shown as shortcuts.
8. **Offline and error.** A persistent top banner «مفيش نت · بنحاول تاني» (in warning colors). On the cart, keep the items and disable the CTA with «مستنيين النت».
9. **Shop busy or closed, and auto-reroute.** In tracking: «صيدلية النور مردّتش في دقيقتين، حوّلنا طلبك لصيدلية الحادقة، نفس الأصناف» with a «موافق / الغي» choice when the price differs.

**P1: first month.**
10. A rating sheet after delivery: one tap on 5 faces for the shop and a thumbs up/down for the rider, then done.
11. The prescription capture flow (camera, crop, send, the pharmacy's quote, accept).
12. The errand flow «هاتلي أي حاجة» (pick-up place, photo or voice note, budget cap).
13. Order details and receipt, plus cancellation with a reason.
14. Help, with a WhatsApp support deep link (that's where Fayoum users already are).
15. A notification permission primer: «نبلّغك لما المندوب يقرب؟».

**P2:** favorites, scheduled orders, promotions, and a free-delivery voucher wallet.

---

## 4. The differentiators made visible

### 4.1 «مشوار واحد لحد 3 محلات»: the Trip Bar (replaces `CartPill`)

```
┌────────────────────────────────────────────┐
│  [ك] [ص] [ + ]   مشوارك: محلين             │  ← 3 slots, right side (RTL start)
│                  التوصيل 25 ج · ضيف محل بـ5ج│
│  ┌──────────────────────────────────────┐  │
│  │  السلة                       185 ج   │  │  ← primary 52px
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```
- Slots fill with shop marks as shops are added. The empty slot shows a dashed "+", and tapping it opens the sheet «ضيف على نفس المشوار» (nearby shops from other categories).
- When the 2nd shop is added, the new slot pops in (a scale animation from 0.6 to 1, 180ms) and a toast says: «ضفنا صيدلية النور لنفس المشوار · +5 ج بس».
- When full: «المشوار كامل · 3 محلات · التوصيل 30 ج». Tapping a 4th shop's "+" opens a sheet, not a toast: «المشوار الواحد لحد 3 محلات» with the options «بدّل محل» and «كمّل ده الأول».
- When the cart has items, other shops' store cards show the chip **«+5 ج مع مشوارك»**.
- Checkout fee ladder:
```
 التوصيل            ● محل واحد 20 ج ── ● محلين 25 ج ── ○ 3 محلات 30 ج
                    (أقصى حاجة 30 ج، مهما طلبت)
```

### 4.2 «وقت مضمون» and «لو اتأخرنا، التوصيل الجاي ببلاش»
- A **guarantee chip**, the same everywhere (store card, store hero, search results): shield icon + «مضمون خلال 40 د», 13/600 on the success container.
- **Checkout card:**
```
┌────────────────────────────────────────────┐
│ [درع]  هيوصلك قبل 8:40 م                   │  title-m
│     مضمون. لو اتأخرنا، التوصيل الجاي ببلاش. │  body 14
└────────────────────────────────────────────┘
```
- **Tracking hero:** a countdown ring around the minutes («18 د») with the subline «الوعد: 8:40 م». At 0, the ring turns to warning colors and the copy changes to «اتأخرنا عليك. التوصيل الجاي ببلاش واتسجّل في حسابك». It never says "sorry" on its own; it says what the customer gets.
- **Home**, when a voucher exists, shows a strip above the verticals: «عندك توصيلة ببلاش · هتتخصم أوتوماتيك من طلبك الجاي».
- **Checkout**, when the voucher is applied: «التوصيل 20 ج → ببلاش (عشان اتأخرنا المرة اللي فاتت)». This closes the loop and builds trust faster than any banner.

### 4.3 «كود محلك»
Home, empty state (a 72px card):
```
┌────────────────────────────────────────────┐
│ [QR]  عندك محل بتتعامل معاه؟      [امسح الكود]│
│       امسح الستيكر اللي عنده، ويظهرلك هنا.   │
└────────────────────────────────────────────┘
```
Home, linked: 64px round marks with a «محلك» ribbon, plus the label «محلاتك» and «+ ضيف».
Link screen: a camera frame with the title «امسح الستيكر اللي على باب المحل», plus an illustration of the sticker itself so people recognize it. On success, a bottom sheet:
> **بقالة الحاج سيد بقت من محلاتك**
> نفس أسعاره ونفس معاملته — وطلبك بيروحله هو على طول.
> [ابدأ الطلب منه]

### 4.4 «مندوب المحل نفسه»
- Store hero chip, when the shop's boy is on the platform: «بيوصّل بمندوبه».
- Tracking rider card, when the assigned rider is the shop's own boy:
```
┌────────────────────────────────────────────┐
│ (صورة) محمود هيوصلك                [اتصل] │
│        [مندوب بقالة الحاج سيد]  · موتوسيكل │
│        نفس المندوب اللي بيجيلك من المحل     │
└────────────────────────────────────────────┘
```
With a platform rider, the same card shows «كابتن أحمد · موتوسيكل · ★ 4.9». A familiar face is the one thing that makes a Fayoum customer stop calling the shop directly.

### Tracking screen (the combined showcase)
```
┌────────────────────────────────────────────┐
│ ←  طلب رقم 1042                     مساعدة │
│  ╭──────╮   المندوب في الطريق ليك           │
│  │ 18 د │   الوعد: 8:40 م · مضمون          │
│  ╰──────╯                                   │
│ ● اتأكد  ● بيتجهّز  ● اتلم  ◐ في الطريق  ○ وصل│
│ ─ مشوار واحد من 3 محلات ─────────────────── │
│  ✓ بقالة الحاج سيد     اتلم                 │
│  ✓ صيدلية النور        اتلم                 │
│  ◐ مخبز الفيوم         بيتجهّز              │
│ [ rider card — §4.4 ]                       │
│ الدفع: كاش 185 ج عند الاستلام               │
└────────────────────────────────────────────┘
```

---

## 5. Design system spec (brand-agnostic)

**Type.** Alexandria is for display only (≥18px). Readex Pro is for everything else. No text below 13px, and **body text is 15–16px**. Prices use `fontVariant: ['tabular-nums']`. Numbers use Western digits (they match shop receipts and Talabat Egypt).

| Token | Font | Size / line height | Use |
|---|---|---|---|
| display | Alexandria 700 | 28/38 | success and tracking hero |
| title-l | Alexandria 700 | 22/30 | tab titles, store name |
| title-m | Alexandria 600 | 18/26 | section headers |
| title-s | Readex 600 | 16/24 | card titles, item names |
| body-l | Readex 400 | 16/26 | primary paragraphs |
| body | Readex 400 | 15/24 | default |
| body-s | Readex 400 | 14/22 | descriptions, secondary lines |
| label-l | Readex 600 | 16/22 | buttons |
| label | Readex 500 | 14/20 | chips, tabs |
| price | Readex 600 | 16/22 | all prices, ink color |
| caption | Readex 500 | 13/20 | meta (rating, distance), the floor |
| badge | Readex 600 | 12/16 | only inside pills with ≥7:1 contrast |

The current `Txt` uses a line height of `size*1.55` for everything, which is too loose for titles. Move to the token values above.

**Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40. Screen gutter 16. Card padding 16. Gap between home sections 28. Gap between list rows 12. Inline icon-to-text gap 8.

**Radii** (4 steps instead of today's 12/14/16/18): `sm 8` (badges, thumbnails), `md 14` (buttons, inputs, product tiles), `lg 20` (cards, banners), `sheet 28` (bottom sheet top corners), `pill 999`.

**Elevation.** Drop the 1px borders on cards.
- `e0`: flat on the background, used for list rows inside a card.
- `e1` (card): shadowColor #000, opacity 0.06, radius 10, offset y 2, Android elevation 2.
- `e2` (sticky tabs once stuck, Trip Bar): opacity 0.12, radius 16, y 6, elevation 8.
- `e3` (sheet): opacity 0.18, radius 24, y −4, elevation 16. Scrim `rgba(0,0,0,0.45)`.

**Color roles.** `--brand` is a variable.
| Role | Value | Rule |
|---|---|---|
| primary | `--brand` | CTAs, the active tab, the "+" button, the progress bar. **Never** used for prices or body text |
| on-primary | #FFFFFF or #111111 | whichever gives ≥4.5:1 against the brand (yellow brand → #111) |
| primary-container | brand at 12% over white | selected chips, the linked ribbon |
| background | #F5F5F3 | screen background (a neutral, so photos carry the color) |
| surface | #FFFFFF | cards, sheets, bars |
| ink | #141414 | titles, prices |
| text-2 | #5A5A57 | secondary text (≥6.5:1) |
| text-3 | #75756F | captions (≥4.5:1) |
| outline / divider | #E4E4E0 / #EEEEEA | inputs / row separators |
| success / container | #127A55 / #E3F3EC | guarantee chip, delivered, daily prices |
| warning / container | #A85A00 / #FFF0D9 | late, offline, closed soon |
| danger / container | #C4271F / #FDE8E7 | cancel, errors, discounts |

**Icons.** One family with a 1.75 stroke on a 24 grid and round caps. `lucide-react-native` replaces the hand-drawn set. Category art uses photos or cut-outs, not icons. Directional icons flip in RTL.

**Buttons.**
- Primary: 56px tall, radius md, label-l, with an optional trailing price.
- Secondary (tonal): 48px, primary-container.
- Text button: at least 44px tall.
- Icon button: 44x44.
- "+" add button: 36px visual, 44px hit area, a filled primary circle with an on-primary "+". It expands into a stepper `[– 2 +]` of 36x108 with the qty at title-s.
- Pressed state: scale 0.97 plus opacity 0.9, not opacity 0.7.

**Chips:** 36px visual / 44px hit, horizontal padding 14, pill, label token. Selected: ink background with white text. Unselected: surface with an outline.

**Cards.**
- *Store card*: 16:7 cover, a 48px mark overlapping the cover edge, title-s name, a caption meta line, the guarantee chip, and «محلك» or «مقفول» states.
- *Product tile*: a 1:1 image with radius md and the "+" overlay, then price, then 2-line name, then unit.
- *Product row*: a 72px thumbnail at the end.
- *Order card*: status pill, shop marks, total, «اطلب تاني».

**Bottom sheet:** top radius 28, a 36x4 grabber 8px from the top, padding 20, max height 90%, primary action pinned at the bottom, closes on swipe or scrim tap. Use it for: the 4th-shop limit, item options, «قريباً», sort, and the "how it works" promise.

**Toast:** sits 12px above the Trip Bar or tab bar. Ink at 94% opacity, radius md, padding 14/16, leading icon, body text in white, 2 lines max, 2.5s. It can carry one action («تراجع») in the brand color.

---

## 6. Top 15 changes (ordered by impact over effort)

1. **Remove dev copy**: `order-placed.tsx`, `account.tsx`, `link-store.tsx`, and the toasts in `(tabs)/index.tsx` and `(tabs)/stores.tsx`. Replace them with a shared `<ComingSoonSheet>` in `components/ui.tsx`. *30 minutes.*
2. **Type and token foundation**: add `type`, `space`, `radius` (4 steps), `elevation` and color roles to `theme.ts`. Give `Txt` a `variant` prop and remove raw `size` values below 13.
3. **One guaranteed number**: in `store-tiles.tsx` `Meta` and the store `Stat`, replace `etaMin–etaMax` with `<GuaranteeChip minutes={guaranteeMinutes([store])}/>`. This fixes the bidi range and sells pillar 5 on every row.
4. **Plural grammar**: in `category/[id].tsx` and `stores.tsx`, use `storesWord()` and add an 11+ form.
5. **Trip Bar**: replace `components/cart-pill.tsx` with `trip-bar.tsx` (3 slots, fee line, CTA) and the 4th-shop sheet. Use it in `store/[id].tsx` `onAdd`.
6. **Store page rebuild**: in `store/[id].tsx`, add the cover hero, a `SectionList` with a sticky scroll-spy tab bar, and in-store search. Add a `section` column to `products` and `cover_url` to `stores`.
7. **Product components**: new `components/product-row.tsx` (rest/pharm) and `product-tile.tsx` (3-column grid for market/veg/meat/bakery). Restyle `qty-control.tsx` to the filled "+" and stepper. Prices in ink.
8. **Home re-hierarchy and bento**: in `(tabs)/index.tsx`, make header + search sticky, use the bento verticals with catalog images (`categories.image_url`, `tint`), add the compact «محلاتك», a single promise strip, the vertical store list, and move the errand into the bento.
9. **Tracking screen**: new `src/app/order/[id].tsx` (hero countdown, timeline, per-shop status, rider card). `order-placed.tsx` redirects into it. Use a Supabase realtime subscription on `orders`.
10. **Checkout upgrades**: in `checkout.tsx`, add line steppers, the «ضيف محل تاني بـ5 ج» rail, the fee ladder, clock-time guarantee, radio rows for missing items, the CTA «أكّد الطلب · {total}», and the illustrated empty state.
11. **Unified search**: new `src/app/search.tsx` with an `ilike` query on `products.name` joined to stores. Point the home search bar to it.
12. **Orders**: in `(tabs)/orders.tsx`, add the live order card on top, «اطلب تاني» (a `useCart` bulk add), status colors, tappable cards, and an empty-state CTA.
13. **Link store**: in `link-store.tsx`, add the scanner frame (`expo-camera`) on native, segmented input on web, the bidi and letterSpacing fix, the benefit copy, and the success sheet.
14. **Store card upgrade**: in `store-tiles.tsx`, add the cover/mark and the chips «محلك», «مقفول», «+5 ج مع مشوارك» and «بيوصّل بمندوبه». Remove borders and use `e1`.
15. **Skeletons, offline banner, error states**: in `components/ui.tsx`, add `<Skeleton>` variants for the store card and product row, and an `<OfflineBanner>` driven by `@react-native-community/netinfo`.

---

## Sources used
- talabat App Store listing summary (screens: home with search and category icons, talabat mart product cards, Reorder button, live-map tracking with countdown): https://mwm.ai/apps/talabat-food-grocery-more/451001072
- talabat Egypt web home (6 vertical tiles: food, groceries, flowers, medicine, donations, tMart "within 20 minutes"; 21 Egyptian cities listed, Fayoum not among them): https://www.talabat.com/egypt
- Breadfast App Store listing summary (home with a "Delivery in 60 minutes" indicator, category listings with quantity controls, instant vs slot choice, "Preparing your order" status): https://mwm.ai/apps/breadfast-groceries-and-more/1288436997
- Rabbit App Store listing (time promise in the app name, live tracking upgraded to real-time progress, more accurate ETAs): https://apps.apple.com/us/app/id1588565838
- Instashop App Store listing (marketplace of local shops like ours; "Order Again", favourites per shop, redesigned order status screen, cancellation reasons): https://apps.apple.com/app/id989276051
- Sticky category bar and scroll-spy pattern for long menus: https://www.gitnexa.com/blogs/mobile-app-ui-ux-design-principles and https://lbblog.netlify.app/blog/svelte-uber-eats
- Older-adult legibility and touch targets (≥16px body text, ≥44x44 targets, 8dp spacing): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9376262/ and https://www.nngroup.com/alertbox/seniors.html
- Mobbin lists talabat in its library, but I couldn't reach its screens. Screen layouts for Talabat and Breadfast not covered by the listings above come from my working knowledge of those apps and should be checked against the live apps.
