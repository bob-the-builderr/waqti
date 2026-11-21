# Round 2: the merged plan (draft for cross-critique)

This draft merges the round-1 reports: critic, grocer (عم سيد), driver (محمود), elderly customer (الحاجة فاطمة) and product designer.
Your job in round 2 is to **attack it from your own side**. Find what still breaks, which numbers are wrong, and which conflict was decided badly. Each section marks **[CONFLICT]** where the reviewers disagreed and how this draft settles it.

The founder's fixed decisions still hold:
- pure platform, no dark store;
- no free-text orders for shops (only prescription photo and «هاتلي أي حاجة»);
- shops never photograph products;
- open driver sign-up with a choice of bicycle, scooter or motorbike.

## New facts from round 1

- **Fayoum already has local apps.**
  - **Rabbito** is Fayoum-only, has run since Oct 2025, has about 7K installs and shipped v3 in Sept 2026.
  - **Tawsilty** has about 60K installs and is the top Play result for «توصيل الفيوم»; its coverage is unconfirmed.
  - Talabat isn't in Fayoum yet (about 532K urban people); expect it within 12–24 months.
- **At the current prices every order loses 1–3 EGP**, and 6–15 EGP when the half commission from a store code applies. The 20 EGP fee only pays the driver.
- **The store codes were readable through the public API**, so anyone could link every shop and get half commission everywhere. Fixed in `002_launch_fixes.sql` (column grants).
- **Benzine 80 is 20.75 EGP/L.** The private-sector minimum wage becomes 8,500 EGP in Jan 2027. A driver needs about 23–29 EGP per order to beat a shop job.

## 1. Customer prices

| Item | Draft |
|---|---|
| Delivery fee, platform driver | **15 EGP ≤ 1.5 km · 20 EGP 1.5–3 km · 25 EGP > 3 km** (distance from shop to door) |
| Each extra shop in the same trip | **+7 EGP** (all of it goes to the driver) |
| Small basket | **+5 EGP under 100 EGP** |
| Shop's own delivery boy («توصيل المحل») | **The shop sets the fee (0–15 EGP) and keeps it.** We pay no driver. |
| Service fee / packaging | none |

**[CONFLICT] Fee clarity versus fee accuracy.** The elderly customer wants one simple number («أقصى حاجة 30 جنيه»). Driver and critic want distance pricing.
- **Draft:** distance pricing, but the customer sees **one final number on the store card** before adding anything («التوصيل لحد بابك 20 جنيه»), and the trip bar states the exact new fee whenever a shop is added. The maximum is no longer 30: a 3-shop trip far away is 25 + 7 + 7 = 39.

## 2. Commission (what the shop pays)

**[CONFLICT] The founder wants "a fixed percentage". The grocer says 5% is half his margin and wants 1% or a flat 3 EGP on his own customers. The critic says grocery and pharmacy must be at least 6%, restaurants 15%.**

**Draft:** two clear tiers that a shop owner can repeat from memory.

| Who brought the customer | What the shop pays |
|---|---|
| **«زبونك»**: a customer who scanned the shop's QR and is new to the platform (attribution lasts 90 days), or any order delivered by the shop's own boy | **flat 3 EGP per order** (a software fee, not a percentage) |
| **«زبون التطبيق»**: new demand we bring | **restaurants 15% · bakery and sweets 10% · vegetables and meat 8% · grocery 6% · pharmacy 6%**, with a **cap of 25 EGP per shop per order** for grocery and pharmacy |
| Cigarettes, phone credit, infant formula, fixed-price medicines with tiny margins | 0% (or not listed) |

Every new shop starts with **60 days free**.

- **Sticker abuse fix:** the code is a **signed QR plus a 4-digit number** (for typing on an Arabic keyboard).
  - Attribution happens only if the customer is new to the platform and orders from that shop within 7 days.
  - The customer's reason to scan is **«أول توصيل ببلاش»**.

## 3. Driver pay (platform drivers)

| Part | EGP |
|---|---|
| Base (pickup + first 2 km) | 16 |
| Each km after 2 km | +3 |
| Each extra pickup | +7 |
| Waiting at a shop past its promised ready time, after 7 free minutes | +1/min, capped at 20 — **charged to the shop** |
| Peak (2–4 pm, 8–11 pm) / after midnight | +4 / +6 |
| Customer not home after an 8-minute GPS-verified wait | +50% |
| Tips | 100% his |
| Launch guarantee (first 6–8 weeks) | 35 EGP per online peak hour, or 200 EGP per booked evening shift |

**Rules:**
- No fines.
- No acceptance-rate punishment.
- Pay, destination and cash-to-collect are shown before he accepts.
- Payout daily at 10 am to Vodafone Cash or InstaPay, free.
- 18+ only.
- A motorbike needs a licence; we run monthly licence days and lend the fee.
- Accident insurance from the first order (about 1 EGP per order).

## 4. Cash: who pays whom

**[CONFLICT]**
- The **critic** wants the driver to pay the shop *subtotal minus commission* in cash at pickup. The shop gets its money instantly and the commission is collected automatically.
- The **driver** says he never wants to front money for shops: «مش هدفع للمحل من جيبي».
- The **grocer** wants his money **next morning at the latest**.

**Draft:** a hybrid.
- **Single-shop cash orders ≤ the driver's float:** he pays the shop at pickup (the critic's design). The float limit starts at 300 EGP and grows to 600, then 1,000, with clean orders. **The platform pre-funds new drivers' float** with a 300 EGP advance, repaid from the first week's earnings.
- **Multi-shop or larger orders:** the driver pays nothing at pickup. The shop is paid by InstaPay that night (at 23:00) by the platform.
- **The driver remits** what he owes daily, by InstaPay, Vodafone Cash or a Fawry code. There is no trust receipt («إيصال أمانة»). Cash orders pause above 400 EGP owed or after 24 hours.
- **Wallet orders** go through a licensed payment provider (Paymob, Kashier or Fawry) into the company account. We never run our own wallet; the CBE licence issue makes that off-limits.
- **Own-delivery shops** pay their 3 EGP per order from a prepaid balance.

## 5. The pillars after round 1

| Pillar | Now |
|---|---|
| 1. Store code | Signed QR plus a 4-digit code. New-customer attribution for 90 days. Flat 3 EGP instead of half commission. «أول توصيل ببلاش» for the customer. The linked shop is always shown first, and its page has no competitors. |
| 2. Shop's own boy | **«توصيل المحل» first.** The boy carries only his shop's orders, and the shop sets and keeps the fee. Outside jobs only when the owner flips «متاح للمنصة»; the shop then gets 2 EGP per outside job from the platform, and a no-cut clause applies. 18+ and a licence. |
| 3. Auto-reroute | 0–60 s the app rings; 60–120 s an automatic phone call («اضغط 1»); at 3 min **the customer chooses** («المحل مردّش — نحوّلك لـX بنفس السعر؟»). **Never silent** for restaurants or for a customer linked to that shop. The «مشغول 20 دقيقة» button pauses the shop with no penalty. Grocery and pharmacy get 4 minutes. |
| 4. Multi-shop trip | Kept. Extra shops must be within 1–1.2 km of the first. Hot food is picked up last, and the restaurant starts cooking when the driver is about 5 minutes away. No dispatch until grocery and pharmacy have tapped «جاهز». Sealed bags with a photo. Limits: 15 kg by motorbike, 7 kg by bicycle. |
| 5. Guaranteed time | The promise becomes a **clock time from live inputs**: the shop's 80th-percentile prep time + driver ETA + route + 8 minutes per extra shop. Compensation: 10 EGP credit at 10 minutes late, a free next delivery at 20 minutes late. At most 2 a month, each expiring in 14 days. Void if the customer can't be reached or the pin is wrong. **Blame is assigned from timestamps.** A shop late on its own prep promise pays half; **the driver never pays.** Terms appear on one screen in the app. |

## 6. Launch

**Area:** a 2 km circle covering المسلة + حي الجامعة + الحادقة.

**Shops needed on day 1:** at least 90.

| Category | Shops |
|---|---|
| Restaurants | 30 |
| Pharmacies | 15 (2 open late) |
| Groceries | 20 |
| Bakeries | 10 |
| Vegetables | 8 |
| Meat | 7 |

A category tile shows only when **6 or more** of its shops are open right now.

**Drivers:** 30 signed up. At least 12 online 7–11 pm and 6 online 1–4 pm.

**Hours:** 12–4 pm and 6 pm–1 am at first.

**[CONFLICT] Category order.**
- The **critic** says restaurants, pharmacies and bakeries first, groceries in weeks 4–6.
- The **grocer** is the persona with the strongest phone-call habit to break.

**Draft:** restaurants, pharmacies and bakeries on day 1. Groceries join through **own-delivery mode from day 1** as a free digital-order inbox for their existing customers, with no platform drivers needed. Platform drivers carry grocery orders from week 4.

**Kill criteria at day 60** (miss two and stop scaling):
- ≥150 orders a day
- ≥35% week-4 retention
- ≥90% shop acceptance
- ≥85% on time
- ≥ +5 EGP contribution per order

## 7. Product bets (Fayoum-specific)

1. **«دفتر الشُكك» (digital credit tab).** The shop approves known families and carries the risk, as today; the app keeps the ledger. Both the grocer and the critic ranked it top.
2. **«اطلب لأهلك»:** sons and daughters in Cairo, the Gulf or Italy pay by card for deliveries to parents in Fayoum, with a WhatsApp photo as proof. Tatoun is "Little Italy".
3. **«اطلب نفس الطلب تاني» + «طلبيتي المعتادة»** (a weekly standing basket). This beats the phone's "the usual order, please".
4. **«رقم واحد للفيوم»:** a hotline or WhatsApp line where an agent builds a structured cart from the catalog for older people. It isn't free text to the shop.
5. **«الروشتة الشهرية»:** chronic-medicine refills from the patient's own pharmacist, with reminders.
6. **«مشوار الصبح»:** order by 11 pm, delivered 7–9 am on fixed routes for 10 EGP (bread, foul, milk, medicines).
7. **Selling by weight:** ربع / نص / كيلو, with ±10% weight adjustment. The data model needs a unit and fractional quantities.

## 8. Already done in the app tonight

- The add button no longer moves under the finger, and removing an item offers «رجّعه» (undo).
- A confirm sheet appears before sending an order.
- The phone number is asked for at checkout, and Arabic digits are accepted.
- The delivery fee shows inside the cart total and is split out at checkout. The arrival promise is a clock time.
- Developer text is removed; unfinished features open a «قريب» sheet.
- Search across items and shops, with Arabic spelling normalisation.
- Order details screen with «اطلب نفس الطلب تاني» and cancel.
- Minimum text 13 px (body 15–16 px), darker grey text, and a «خط كبير» switch.
- The cart survives the app closing.
- The linked shop always shows first.

None of the pricing changes above are in the database yet.
