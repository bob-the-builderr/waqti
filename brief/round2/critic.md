# Round 2: the critic on the merged draft

I read `round2/proposal.md`, the four other round-1 reports and `002_launch_fixes.sql`. All money is in EGP.

## 0. Bottom line

- **The draft's prices are right for platform-driver orders**, at about +6 to +13 EGP per order.
- **The tariff loses the money anyway.** Flat 3 EGP applies to *any* own-delivery order, the 60 days are free for every order, and the fee cap was dropped.
- **As written, the blended contribution is ≈ +2.9 EGP per order, so break-even is about 1,400 orders a day.** If restaurants switch the customers we bring to their own boy (they will), it falls to about +1.8, and break-even rises to about 2,200 a day.
- **With the fixes in section 4, it is ≈ +6.5, so break-even is about 625 orders a day.** That drops to about 510 a day if fixed costs are cut to 100K a month.

---

## 1. Unit economics on the draft's exact numbers

**Assumptions:**
- VAT is 14% inside our fee and commission.
- Payment costs 1.03% of the cash collected (80% cash at 0.6%, 20% through a payment provider at 2.75%).
- Leakage (missing items, wrong items, refusals) is 0.7% of the subtotal on platform-driver orders.
- Insurance costs 1 EGP per platform-driver order.
- The tiered guarantee costs 1.1 EGP per single-shop order and 2.24 per multi-shop order. That is 12% of orders at 10–20 minutes late, 5% at 20+ minutes, 70% of vouchers redeemed, and the shop pays half when it is at fault.
- The peak and after-midnight bonuses add +2.7 per drop on average (55% of orders are at peak).
- **One correction to my round-1 model:** its support line double-counted the 2 agents already in fixed costs. Variable support is now 1.0 EGP per order, plus 0.8 for tech and the automated alert call.
- The baskets are 2.5 km from shop to door, so they fall in the 20 EGP band.

| Order | Revenue (gross → after VAT) | Driver | Other variable costs | **Contribution** |
|---|---|---|---|---|
| **A.** Koshary, 120 EGP, customer we brought, platform driver | 18 + 20 = 38 → 33.33 | 20.2 | 6.18 | **+6.95** |
| **B.** Grocery, 350 EGP, customer we brought, platform driver | 21 + 20 = 41 → 35.96 | 20.2 | 10.16 | **+5.60** |
| **C.** 3 shops, 600 EGP (pharmacy 200, grocery 330, bakery 70) | 38.8 + 34 = 72.8 → 63.86 | 34.2 | 16.37 | **+13.29** |
| **D.** Grocery, 350 EGP, own delivery, flat 3 EGP | 3 → 2.63 | 0 | Provider fee on wallet orders (2.75% × 360 × 20% = 1.98), support 1.0, tech 0.8, half the guarantee 0.55 | **−1.70** (+0.83 if cash only and no guarantee) |
| **E.** «زبونك» koshary, platform driver, flat 3 EGP | 3 + 20 = 23 → 20.18 | 20.2 | 6.18 | **−6.20** (the grocery version is −10.2) |
| **F.** Order A when the restaurant delivers it with its own boy (the leak) | 3 → 2.63 | 0 | about 3.1 | **−0.44**: we lose 7.4 EGP on every switched order |

The 15 EGP band is also too generous. A 1.2 km koshary order earns 4.4 EGP less than the same order at 20 EGP, and in a 2 km launch circle that band holds a large share of orders.

**During the 60 free days**, A becomes −8.8, B −12.8 and C −20.7. At a ramp of about 100 orders a day, that burns about 50–60K EGP in two months before fixed costs. The kill criterion "≥ +5 EGP at day 60" can't be met by construction.

**Blended contribution after the free period, as written:**

| Order type | Share of orders | Contribution |
|---|---|---|
| A | 30% | +6.95 |
| B-type (pharmacy baskets are smaller, so +4.5 on average) | 15% | +4.5 |
| C | 8% | +13.29 |
| All own-delivery orders | 35% | −1.2 |
| «زبونك» on a platform driver | 7% | −8 |
| Errands | 5% | +2 |
| **Blended** | | **+2.94 EGP** |

- **Break-even:** fixed costs of 4,070 a day ÷ 2.94 ≈ **1,385 orders a day**.
- **With the leak** (half of the A orders switch to own delivery): about +1.8, so **about 2,240 a day**.

**Does the flat 3 EGP kill the model?**
- **As written, yes.** Three things go wrong:
  - It covers orders from customers *we* brought whenever the shop's boy delivers. Every koshary shop with a boy will switch, costing 7.4 EGP per order.
  - On platform-driver orders it loses 6–10 EGP each.
  - On wallet orders the 2.75% provider fee is three times the revenue.
- **Narrowed, it's acceptable:** flat 3 only for «زبونك» delivered by the shop's own boy, paid in cash or by InstaPay straight to the shop, with no platform guarantee. Then it is +0.8 per order: neutral, and software-style lock-in.
- **Cost per acquired customer:** «زبونك» on a platform driver at half the commission rate costs about −2 per order. Over about 3 orders, plus the free first delivery (17.5 after VAT), that's **about 24 EGP per customer**, which is a cheap acquisition cost.

---

## 2. The [CONFLICT] resolutions

### 2.1 Fee clarity and the maximum of 39 → **REJECT the 39. Cap what the customer pays at 30.**

- The elderly persona's whole hook is «٣ محلات بتلاتين جنيه».
- Multi-shop trips are about 8% of orders. Capping the customer at 30 while the driver keeps his full formula costs us 4 EGP on a 3-shop trip in the 20 band and 9 in the 25 band. Averaged over all orders, that is **≈0.3 EGP**.
- C stays at **+6.3** even with the cap.
- Print «أقصى حاجة 30 جنيه لأي مشوار» once on the trip bar.
- **Move the band edges** to **15 up to 1 km, 20 for 1–2.5 km, 25 over 2.5 km**. This brings back the 4.4 EGP the 1–1.5 km orders were losing.

### 2.2 Commission tiers and 60 days free → **MODIFY**

| Draft | Problem | Fix |
|---|---|---|
| Flat 3 for every own-delivery order | It's the 7.4 EGP leak per switched order | **The tariff follows who brought the customer, not who delivers.** For a customer we brought, delivered by the shop's boy: restaurants 10%, bakery 6%, vegetables and meat 5%, grocery and pharmacy 4%, capped at 20. That's +8.7 to +10.5 per order, still cheaper for the shop than our driver, and the shop keeps its own fee. |
| «زبونك» at flat 3 even on a platform driver | Loses 6–10 per order | **Half the normal rate on a platform driver** (restaurants 7.5%, grocery 3%, capped at 15). The grocer himself asked for 2.5% here. |
| «زبونك» attribution lasts 90 days | On day 91 عم سيد's twenty-year customer starts paying 6%. That's his first "betrayal" moment. | **Make it permanent while his own boy delivers** (it's +0.8 for us, so expiry earns nothing). Attribution counts only for a first platform order after a QR scan **inside the shop**: GPS within 150 m, a new phone and a new device. |
| 25 EGP cap per shop per order (grocery and pharmacy) | It only binds above 417 EGP | **Accept.** It turns Om Mohamed's 1,500 EGP monthly basket from 90 EGP of commission into 25. |
| 60 days free on everything | About 55K EGP of extra burn, and the day-60 kill test can't be passed | **For 60 days, «زبونك» and own-delivery orders are free. Customers we bring on platform drivers pay from day 1.** Report the kill-test contribution on paying orders only. |

### 2.3 Hybrid cash design → **MODIFY. It has an internal contradiction.**

- **The contradiction:** for path-2 orders the driver holds the *full* basket, which can be 600 EGP. The draft pauses cash orders at "more than 400 EGP owed", so one multi-shop order freezes him. Use two separate limits:
  1. **Float** for paying at the counter: starts at 300 EGP (advanced by us), then 600, then 1,000.
  2. **Cash held**: 600 at the start, 1,500 after 100 clean orders, 2,500 after 300 (the driver persona's ladder). Warn at 80%. At 100%, offer only wallet-paid orders. Never fully block him.
- **Remit within 36 hours, not 24.** He works evenings, and a 24-hour deadline lands mid-shift. Freeze after 72 hours.
- **Working capital:** path 2 pays shops at 23:00, before the driver remits. At 300 orders a day, with 40% on path 2 at about 400 EGP each, that's **about 48K EGP fronted every night**. Keep **75K EGP** of cash in the bank for this and budget it.
- **"Wallet" at the door should mean a transfer to the driver's wallet, treated exactly like cash in his account.** That's how the elderly persona's checkout text («تحويل من الموبايل للمندوب») reads it. It costs us 0% instead of the provider's 2.75%, which lifts B by about 1.6. Keep the payment provider only for prepaid flows (ordering for family abroad, monthly refills).
- On own-delivery orders the customer pays the **shop** directly. We never touch that money.

### 2.4 Category order → **ACCEPT, with three conditions**

Groceries on own delivery from day 1 is right: it's free software for the shop, and no drivers are needed. The conditions:
1. Own-delivery orders carry **no platform guarantee** unless the shop opts in and pays for it.
2. The first support line is **«كلّم المحل»**. Otherwise they double our support load for 3 EGP.
3. The grocery template has to exist on day 1.

---

## 3. Still missing or wrong, ranked

### Legal

1. **Agent or seller.** Contracts must make us a commission agent (وسيط بالعمولة), never the seller. Otherwise VAT turnover is the whole basket, and we pass the 500K registration threshold within days.
   - Even as an agent, fees plus commission pass 500K by about month 2 at 300 orders a day.
   - Register the company before launch and set up e-invoicing for shops.
2. **Pharmacy.**
   - We transport only; the pharmacy's own invoice goes in a sealed bag.
   - The draft pharmacy law would require prior approval from the drug authority for app sales.
   - Block controlled (جدول) drugs. No «بديل» (substitutes) on medicines. Never discount medicine prices.
   - **Prescription photos are health data**, which the Personal Data Protection Law 151/2020 treats as sensitive. That needs explicit consent and a retention limit.
3. **Drivers.**
   - Use a service contract, not employment, and watch Labour Law 14/2025's platform-work rules.
   - Write licence-fee loans as an **advance against earnings** (5 EGP per order, no interest), not a loan.
4. **«دفتر الشكك» must stay the shop's own credit.** If we ever fund or guarantee it, it becomes regulated consumer finance (FRA).
5. **The claims «نفس سعر الرف» and the guarantee are advertising.** Under Consumer Protection Law 181/2018, art. 66 fines are 50K–2M EGP. We need parity audits (2 mystery orders per shop per month) and the terms screen before any public test.

### Fraud

1. **The own-delivery leak** in 1.2: the largest money risk.
2. **Codes can still be guessed.** `002` hid the codes from the API, but `link_store` still accepts typed words (`SAYED`) with **no rate limit**. A global 4-digit code across 150 shops is a 1.5% hit rate per random guess. Needed:
   - a code per shop that rotates monthly,
   - 5 attempts per account per day,
   - the GPS-within-150 m rule.
3. **Cash orders still need no verification.** Anonymous sign-in still allows unlimited cash orders, and the typed phone number is not checked by OTP. New-customer orders also need:
   - a first-order IVR confirmation («اضغط 1») **before the restaurant cooks**;
   - a cap of 300 EGP until 3 completed orders;
   - wallet-only after one no-show.
4. **"Hot food is written off" on a no-show isn't costed anywhere.** At 2% no-shows on path 1, it's ≈2 EGP per order, paid by us. That's why the controls in item 3 matter.
5. **Wait-time charges:** a driver who taps "arrived" early can charge the shop. Use a geofence plus the shop's confirmation, and cap charges at 100 EGP per shop per month. The grocer lists "any penalty" as a reason to quit.
6. **«أول توصيل ببلاش»:** one per phone and device, on baskets of 80 EGP or more. A new SIM costs about 10 EGP.

### Operations

1. **No batching rule:** a second drop on the same trip should pay 9 EGP. This is worth +2.8 per platform-driver order now and +4.5 at density. Pay the peak bonus per trip, not per drop. Without these, the platform-driver numbers above are the ceiling.
2. **Launch guarantee:** at 200 EGP per evening shift for 12 drivers plus afternoon top-ups, it costs ≈1,200 EGP a day, about 68K over 8 weeks. It isn't in the budget.
3. **Payouts:** about 30 drivers and 90 shops a day means about 120 InstaPay transfers. That needs bulk payouts through a provider or bank API, not 3 hours of manual work. The fees are about 0.3 EGP per order.
4. **Missing data model:**
   - `delivered_by` and `own_delivery_fee`;
   - attribution fields (`first_store_id`, `attributed_at`);
   - driver and shop ledgers with path 1 and path 2;
   - unit and fractional quantities;
   - `paused_until`;
   - missing-item policy per store;
   - driver float and cash-held limits.
5. **Weight adjustment of ±10%:** the driver's «حصّل» figure must update before he reaches the door.

---

## 4. Final recommended numbers (adopt as-is)

| Item | Final |
|---|---|
| Delivery fee, platform driver (road distance, shop to door) | **15 up to 1 km · 20 for 1–2.5 km · 25 over 2.5 km** |
| Extra shop | **+7** each, at most 2, all within 1.2 km of the first |
| Most the customer pays for any trip | **30** («أقصى حاجة 30 جنيه»). The driver is still paid in full. |
| Small basket | **+5** under a 100 EGP subtotal |
| Own-delivery fee | Set by the shop (0–15) and kept by the shop |
| Commission: customer we brought, platform driver | **Restaurants 15% · bakery and sweets 10% · vegetables and meat 8% · grocery 6% · pharmacy 6%**; grocery and pharmacy capped at **25** per shop per order |
| Commission: customer we brought, shop's own boy | **Restaurants 10% · bakery 6% · vegetables and meat 5% · grocery and pharmacy 4%**; capped at **20** |
| «زبونك» (QR scanned in the shop, new phone and device), shop's own boy | **Flat 3 per order, permanent** |
| «زبونك», platform driver | **Half the rate for customers we bring**, capped at **15** |
| 0% items | Cigarettes, phone credit, infant formula |
| New-shop trial | 60 days free on «زبونك» and own-delivery orders. Customers we bring on platform drivers pay from day 1. |
| First delivery free | Once per phone and device, basket ≥ 80, paid by us as acquisition cost |
| Driver pay | **16** base (pickup and first 2 km) · **+3/km** after 2 km · **+2/km** riding to the shop beyond 2 km · **+7** per extra pickup · **9** for a batched second drop · peak **+4 per trip** · after midnight **+6** · wait **+1/min** after 7 minutes (charged to the shop, capped at 20 per order and 100 per shop per month) · no-show **+50%** · tips **100%** his |
| Insurance | about **1** EGP per order from the first order |
| Launch guarantee | **200** per booked 6–11 pm shift, at most 14 shifts a night, weeks 1–8 |
| Cash path 1 | Single-shop cash orders where the shop's payout is within the float: the driver pays the shop the subtotal minus commission. Float **300** (advanced by us), then **600**, then **1,000**. |
| Cash path 2 | Everything else: the shop is paid by InstaPay at **23:00**. Cash-held limit **600 → 1,500 → 2,500**. Remit within **36 h**, freeze at **72 h**, no trust receipts. |
| Wallet at the door | Transfer to the driver's wallet, counted as cash. The payment provider only for prepaid flows. On own-delivery orders, the customer pays the shop. |
| New customers | OTP required, IVR confirmation on the first order, **300** cash cap until 3 orders, wallet-only after one no-show |
| Guarantee | **10** credit at 10+ minutes late, **free next delivery (up to 20)** at 20+ minutes late. At most 2 a month, each expiring in 14 days. Single-shop and cluster orders only. The shop pays half when it is late. None on own-delivery orders unless the shop pays for it. |
| Payouts | Shops nightly at 23:00, drivers daily at 10:00, free |
| Working capital to keep | **75K** EGP for path-2 nights, plus **68K** for the launch guarantee |
| Kill test at day 60 (miss two and stop scaling) | ≥150 orders a day · ≥35% week-4 retention · ≥90% shop acceptance · ≥85% on time · **≥ +4 EGP contribution on paying orders** |

**What these numbers produce:**

| Order type | Contribution |
|---|---|
| A, with batching | +9.8 |
| B | +8.4 |
| C (under the 30 cap) | +6.3 |
| Customer we brought, shop's own boy | +9.5 |
| «زبونك» on own delivery | +0.8 |
| «زبونك» on a platform driver | −2 |
| **Blended** | **≈ +6.5** (≈ +7.3 at density) |

**Break-even is 560–625 orders a day at 122K a month of fixed costs, or 455–510 at 100K.** That's roughly 4% of Fayoum city's households ordering once a week. The model doesn't need a dark store, a service fee or higher customer prices. It does need the tariff to follow who brought the customer.
