# Round 1: the critic's report (devil's advocate)

Reviewer: hard critic. Written on 19 Nov 2026. I didn't read the other reviewers' reports, so this review is independent.
Each claim is marked as either sourced **(S)**, with a link, or an estimate **(E)** that needs a field check in Fayoum.

---

## 1. Verdict in 5 lines

1. **At the current prices, it doesn't work.** On my model every order loses about 1 to 3 EGP before any marketing, and 6 to 15 EGP when the store code applies (section 2). The driver takes the whole 20 EGP fee. The 5 to 10% commission can't also cover 14% VAT, payment costs, guarantee refunds and support.
2. **The most likely cause of death is "phone-call relapse" on top of a negative margin.** People try the app, find that it adds 20 EGP to a 120 EGP koshary order (about +17%), and go back to calling the shop for free. You lose money on every order and keep no customer.
3. **Talabat will come.** It lists 21 Egyptian cities, including Minya, Mit Ghamr, Talkha and Ras El Bar, but not Fayoum ([talabat.com/egypt](https://www.talabat.com/egypt)) (S). Its quick-commerce hub plans to grow from 12 to 17 cities ([Arab Finance](https://arabfinance.com/en/news/newdetails/talabat-egypt-opens-mena-largest-express-commerce-distribution-center)) (S). Fayoum's urban kism has about 532K people ([citypopulation/CAPMAS](https://citypopulation.de/en/egypt/admin/al_fayy%C5%ABm/2301__al_fayy%C5%ABm_1_2/)) (S), so it's an obvious next city. Plan on 12 to 24 months of runway before it arrives.
4. **You aren't first.** Rabbito is a Fayoum-only app that has run since Oct 2025, has about 7K installs and shipped a v3 redesign in Sept 2026 ([App Store](https://apps.apple.com/app/id6756308620), [AppGoblin](https://appgoblin.info/apps/com.nahr.rabbito_user)) (S). Tawsilty by ZTechX has about 60K installs and is the top Play result for «توصيل الفيوم» ([AppGoblin](https://appgoblin.info/apps/com.ztechx.TawsiltyEgypt), [Play search](https://play.google.com/store/search?q=%D8%AA%D9%88%D8%B5%D9%8A%D9%84%20%D8%A7%D9%84%D9%81%D9%8A%D9%88%D9%85&c=apps&hl=ar&gl=EG)) (S; I couldn't confirm Tawsilty's coverage area).
5. **It can be rescued with four moves:**
   - Reprice (restaurants 15%, a distance-based fee).
   - Make **"توصيل المحل" (the shop's own delivery boy, at zero driver cost to us)** the default for single-shop orders.
   - Pay shops in cash at the counter.
   - Fix the store-code leak, which is live in the database today (section 3, pillar 1).

---

## 2. Unit economics per order

### Assumptions

| Item | Value | Basis |
|---|---|---|
| Driver pay, single shop, ≤3 km | **22 EGP** | Cairo riders get about 28 to 30 EGP per order: "no more than 28 EGP" ([ARIJ, Jan 2026](https://arij.net/investigations/delivery-workers-rights-egypt/en/)), and «نحو 30 جنيهًا» plus 5 EGP after 2 km ([Parlmany](https://www.parlmany.com/News/2/612654/)) (S). Fayoum trips are shorter (the seed shops span about 3.2 km). But the private-sector minimum wage becomes **8,500 EGP from Jan 2027** ([Masrawy](https://www.masrawy.com/news/news_egypt/details/2026/11/15/3079249/index)) (S). That's 327 EGP a day over 26 days, so at 18 orders a day a driver needs about 18 EGP net plus about 4.6 EGP vehicle cost (E). |
| Vehicle cost inside the driver's pay | about 2.6 EGP fuel plus about 2 EGP maintenance per order | About 5 km per order × 2.5 L/100 km (Bajaj Boxer, [Shift-EG](https://www.shift-eg.com/news/local-news/details/18816/)) × **benzine 80 at 20.75 EGP/L** (92 is 22.25 EGP), with prices held on 15 Oct 2026 ([Al Khaleej](https://www.alkhaleej.ae/2026-10-16/اقتصاد/أسواق-عربية-وعالمية/أسعار-البنزين-والسولار-اليوم-في-مصر-قرار-رسمي-يحسم-مصير-الوقود)) (S) |
| Extra pay | +2 EGP for a heavy grocery order, +7 EGP per extra shop | About 8 to 10 extra minutes and 1 km per extra shop (E) |
| VAT | 14% inside our fee and commission | Registration is required from 500K EGP turnover ([Quaderno](https://quaderno.io/guides/egypt/vat/)) (S). That's roughly the first 15K orders. |
| Payment cost | Cash 0.6% (remittance and shortages). Wallet 2.75% through a payment provider ([Paymob headline rate](https://dodopayments.com/blogs/paymob-alternatives)) | With an 80/20 cash/wallet split, the blended cost is **1.03%** of what's collected. Cash on delivery is 70 to 85% of Egyptian e-commerce ([eGrow](https://www.egrow.com/en/blog/egypt-cod-ecommerce-2026)) (S). |
| Leakage | 0.7% of the subtotal | Missing or wrong items and refused orders (E) |
| Guarantee | Late on 15% of single-shop orders and 30% of multi-shop orders; 70% of vouchers redeemed; each costs 17.5 EGP net | Launch-period estimate (E) |
| Support and tech | 2.5, 3.5 or 5 EGP support, plus 0.5 EGP for SMS, maps and push | (E) |

### Contribution per order at the founder's current prices (20 EGP plus 5 per extra shop, 5 to 10% commission)

| | A: Koshary, 120 EGP, 1 shop | B: Grocery, 350 EGP, 1 shop | C: 3 shops, 600 EGP (pharmacy 200, grocery 330, bakery 70) |
|---|---|---|---|
| Commission | 12.0 (10%) | 17.5 (5%) | 10 + 16.5 + 5.6 = 32.1 |
| Delivery fee | 20 | 20 | 30 |
| **Revenue net of VAT** | **28.07** | **32.89** | **54.47** |
| Driver | −22 | −24 | −36 |
| Payment | −1.44 | −3.81 | −6.49 |
| Leakage | −0.84 | −2.45 | −4.20 |
| Guarantee | −1.84 | −1.84 | −3.68 |
| Support and tech | −3.0 | −4.0 | −5.5 |
| **Contribution** | **−1.05** | **−3.21** | **−1.40** |
| Same order with the store code (half commission) | **−6.31** | **−10.88** | **−15.48** |

**Answer: no.** A 20 EGP fee with +5 per extra shop and 5 to 10% commission can't work. The fee only pays the driver, and the 5% grocery and pharmacy commission is smaller than its own VAT, payment and leakage costs. The +5 for an extra shop doesn't even cover the driver's extra 8 to 10 minutes.

### Fixed costs of a minimal team in Fayoum (monthly, fully loaded; employer social insurance is 18.75%)

| Role or item | EGP |
|---|---|
| City and operations manager | 18,000 |
| 2 dispatch and support agents (2 shifts) | 20,200 |
| 2 field sales and onboarding staff | 24,000 |
| 1 catalog and daily-prices operator | 10,100 |
| Infrastructure (Supabase Pro, OTP SMS, maps, store accounts) | 8,000 |
| Accounting, legal, company | 6,000 |
| Office, phones, data | 6,000 |
| Baseline marketing (stickers, flyers, Facebook) | 30,000 |
| **Total** | **≈122,000 a month ≈ 4,070 a day** (founder unpaid) |

**Break-even orders per day = 4,070 ÷ contribution per order.** At today's prices the contribution is negative, so there's no break-even at any volume. At **+8.5 EGP → about 480 orders a day**. At +12 EGP, which needs density, **about 340 a day**.

For scale: 480 a day is about 14.4K orders a month. That's roughly 3,600 households ordering 4 times a month, or about 3% of a city of around 120K households (E). That's reachable in 9 to 15 months. Rabbito reached about 7K installs in 13 months.

### Prices that would work

| Lever | Proposal |
|---|---|
| Delivery fee | **15 EGP up to 1.5 km, 20 EGP for 1.5 to 3 km, 25 EGP over 3 km. +7 per extra shop** (this goes to the driver). **+5 small-basket fee under 100 EGP** (bread-only orders otherwise lose money). |
| Commission | Restaurants **15%** (Talabat charges 15 to 25% ([Menuviel](https://blog.menuviel.com/talabat-fees-and-commissions-for-restaurants/)) (S), and restaurant margins are 30 to 60%). Bakery and sweets 12%. Vegetables and meat 8%. Grocery 6%. Pharmacy 6%: the pharmacist's legal margin is 22 to 27% ([Official Gazette, 23 Sept 2026, via Masrawy](https://www.masrawy.com/news/news_egypt/details/2026/9/24/3052992)) (S), so 6% is about a quarter of his gross margin. Don't go higher. |
| «توصيل المحل» (own boy) | Commission 12% for restaurants and 6% for everything else. **We pay no driver.** The customer pays the shop's usual fee (0 to 10 EGP). |
| Batching | A second drop on the same trip pays the driver 9 EGP instead of 22. |

**Contribution at these prices:**

| Order | Contribution |
|---|---|
| A, koshary (platform driver) | **+4.2 EGP** |
| A, koshary (own boy) | **+8.5 EGP** |
| B, grocery (own boy) | **+10.6 EGP** (send heavy grocery orders to the shop's boy, not our fleet) |
| C, 3 shops within a 1.2 km cluster | **+9.2 EGP** |

**Blended:** 40% own-boy orders, 45% platform-driver orders, 10% multi-shop, 5% errands, and batching on 30% of platform-driver orders. That gives **about +8.5 EGP per order**.

---

## 3. The 5 pillars

### Pillar 1: Store code and half commission → **CHANGE**

**How it breaks:**
- **It's exploitable today.** `001_catalog_and_orders.sql` grants `select on public.stores to anon`. That table includes `referral_code`, so anyone with the public key can list every code. Anonymous sign-in plus `link_store` in a loop links every shop, and `place_order` then charges half commission on everything, permanently. There's no expiry, no first-touch rule and no "new customer" check.
- The codes are guessable words (`SAYED`, `NOUR`).
- Shops will post their codes in Fayoum Facebook groups, so they'll "bring" customers who were already on the platform.
- **The customer has no reason to link.** They never pay commission anyway, so "pays nothing extra" isn't an incentive.

**Damage:** if 50 to 60% of GMV goes through codes, commission revenue falls by 25 to 30%.

**Fix:**
- Revoke the column from `anon`.
- Make the sticker a **QR with a signed, rotating token**, never a word to type.
- Attribution counts only if the customer is **new to the platform** and places a first order at that shop within 7 days of scanning.
- The shop gets half commission on that customer **for 90 days**, or a flat **25 EGP bounty** after the customer's second order. The bounty is simpler and easier to cap.
- Give the customer a reason to scan: «امسح كود المحل — أول توصيل ببلاش».

### Pillar 2: The shop's own boy on our driver app → **CHANGE (make it "توصيل المحل" first, cross-shop jobs second)**

**How it breaks:**
- The boy is busiest exactly when the shop is busiest (iftar, 8 to 11 pm).
- The owner pays his salary and won't let him carry a rival's orders.
- If he does carry them, he learns the rival's customers.
- Many shop boys are under 18 and ride unlicensed motorbikes. One crash on our app is a legal and reputational disaster in a city where everyone knows everyone. Motorbike accidents killed 970 people in Egypt in 2023 ([Asharq Al-Awsat](https://aawsat.com/node/5105096)) (S).

**Fraud:**
- The boy gives the customer his own number: «المرة الجاية كلمني على طول».
- The shop and the boy create fake orders to farm launch bonuses.
- The boy delays a rival's order.

**Fix:**
- Use **own-delivery mode**: the boy carries only his shop's orders, and the shop keeps its delivery fee.
- Mask both phone numbers.
- Drivers must be 18 or older, with an ID check by OCR plus a selfie. A motorbike requires a licence and plate; bicycles are fine.
- Cross-shop platform jobs need the owner's opt-in and a radius of 500 m or less, and we pay per job.

### Pillar 3: Auto-reroute after 2 minutes → **CHANGE**

**How it breaks:**
- A one-man shop serving walk-in customers won't see the tablet within 2 minutes.
- Rerouting a restaurant order swaps the brand the customer chose. Saqia koshary isn't the koshary next door.
- Rerouting a grocery order assumes the second shop has the same items at the same prices, and it won't.
- Merchants who lose orders to rivals will quit.
- Shops will "miss" small orders on purpose to cherry-pick.

**Fix:**

| Time | What happens |
|---|---|
| 0 to 60 s | The app rings. |
| 60 to 120 s | An **automatic IVR call**: «اضغط 1 لقبول الطلب». |
| At 3 min | The customer gets a one-tap choice: «المحل مردّش — نحوّل لـ[X] بنفس السعر؟ (+٣ ج)». |

- Rerouting without asking is allowed only for pharmacy OTC items and grocery staples that share a master-catalog SKU. **Never for restaurants.**
- Shops below 85% acceptance are hidden during peak hours.

### Pillar 4: One trip for up to 3 shops → **KEEP, but restrict it**

**How it breaks:**
- The flat 20+5+5 fee ignores the distance between shops. The seed shops span about 3.2 km from Sufi to Kiman Fares.
- The driver has to pay three shops up front (about 560 EGP of float).
- The hot food waits while he queues at the pharmacy.
- If one shop rejects, it becomes a partial order and the shops blame each other.
- The promise formula (`max(eta_max)+5+5·(n−1)`) ignores travel between shops.
- **Abuse:** a 30 EGP cross-city errand service.

**Fix:**
- The 2nd and 3rd shops must be within **1.2 km** of the first.
- +7 per extra shop, paid to the driver.
- Hot food is always the last pickup.
- A cash multi-shop order goes only to a driver whose float covers it.
- Offer curated clusters, for example «مشوار الشارع»: a pharmacy, bakery and grocery on the same street.

### Pillar 5: Guaranteed time («لو اتأخرنا، التوصيل الجاي ببلاش») → **CHANGE**

**How it breaks:**
- The formula leaves out driver assignment and travel, and `eta_max` is a static number each shop types in. A pharmacy promises 30 minutes all-in. At launch, 20 to 30% of orders will be late.
- The promise appears on the home and checkout screens with no terms. Under Consumer Protection Law 181/2018, advertised claims bind the supplier. Article 66 fines are reported at 50K to 2M EGP ([Parlmany](https://www.parlmany.com/News/7/593498/)) (S).

**Abuse:**
- The customer is "unreachable" or drops a wrong map pin, so the order is late and the next one is free.
- The driver and customer collude: he dawdles, and they split the vouchers.
- One person runs multiple accounts.

**Fix:**
- Compute a live window from the shop's real prep time (80th percentile), the driver's ETA to the shop and the route. Show it as «بين ٣٥ و٤٥ دقيقة».
- The guarantee applies only to single-shop and cluster orders in active zones.
- Compensation is tiered:
  - 10 EGP credit if 10 minutes late.
  - A free next delivery if 20 minutes late.
- Limits: at most 2 a month, and each expires in 14 days.
- It's void if the customer was unreachable or the pin is more than 150 m off.
- If the shop exceeded its own prep promise, it pays half.
- Put one terms screen in Arabic in the app.

---

## 4. Top 10 risks, ranked by probability × damage (1 to 5 each)

| # | Risk | P×D | Fix (within the fixed decisions) |
|---|---|---|---|
| 1 | Negative unit economics, plus a VAT surprise once turnover passes 500K | 5×5=25 | Reprice (section 2), own-delivery default, batching, small-basket fee. Register an LLC early and consider the simplified tax regime (0.4 to 1.5% of turnover up to 20M EGP, [Law 6/2025](https://hapijournal.com/2025/02/14/قانون-جديد-يحدد-ضريبة-المشروعات-الصغي/)) (S). |
| 2 | Phone-call relapse and disintermediation | 5×4=20 | Own-delivery mode, so the app is never dearer than the phone call. Masked numbers. One-tap «اطلب تاني». Credit tab (idea 1). |
| 3 | Talabat, Breadfast Food ([expanding to more governorates](https://www.wamda.com/2026/09/breadfast-expands-restaurant-delivery-breadfast-food)) or Rabbito with funding enters with subsidies | 4×4=16 | Win on what they won't do: pay at the counter, own-delivery mode, credit tab, hotline. Don't rely on exclusivity: the Competition Authority already struck down Talabat's exclusivity-type clauses ([Mondaq](https://mondaq.com/antitrust-eu-competition/1229268/)) (S). |
| 4 | Fake or prank cash orders (today, anonymous sign-in can place unlimited cash orders) | 4×4=16 | Phone OTP **before** launch. First cash order capped at 250 EGP. After one refusal, wallet-only. Bind the account to the device. |
| 5 | Driver float and cash failure (can't pre-pay shops, or runs off with the cash) | 4×4=16 | Settlement design in section 5. No «إيصال أمانة»: Parlmany reports 20,000 EGP trust receipts as a source of abuse (S). |
| 6 | Pharmacy legal exposure (controlled drugs through a prescription photo, a syndicate complaint) | 3×5=15 | Only licensed pharmacies dispense, and we only transport. The syndicate's line is that only a pharmacy may dispense ([Enterprise](https://enterpriseam.com/egypt/2020/11/22/pharmacists-syndicate-boycotts-ibnsina-pharma-alleging-misuse-of-3elagi-app/)) (S). A draft law would require prior approval from the drug authority (5,000 EGP for 5 years) for any app selling medicines ([Egypt Telegraph](https://www.egypttelegraph.com/article/162765/)) (S). Block scheduled or controlled drugs completely. Run no discounts on medicines (their prices are fixed). |
| 7 | Driver accident, a minor driving, or an unlicensed bike | 3×5=15 | 18 or older, licence and plate, helmet, group accident insurance. Watch Labour Law 14/2025 on platform work ([Al-Ain](https://al-ain.com/article/most-important-provisions-new-labor-law-2025)), the Labour Ministry's 5 Nov 2026 protocol to register delivery workers ([Masrawy](https://www.masrawy.com/news/news_egypt/details/2026/11/5/3074092)) and a parliamentary call for compulsory accident insurance ([Parlmany](https://www.parlmany.com/News/2/608416/)) (S). |
| 8 | Stale prices causing disputes (vegetables, meat) | 5×3=15 | The price is locked when the order is placed. The shop honours it or pays the difference. A daily «أكّد أسعارك» tap before 10 am; shops that don't tap are hidden from daily-price categories. |
| 9 | The store-code leak halves commission | 4×3=12 | Pillar 1 fix: revoke the column, signed QR. |
| 10 | Empty-feeling marketplace (night, morning, edge zones) | 4×3=12 | 2 to 3 zones only, limited hours, hide category tiles with fewer than 6 open shops (section 6). |

---

## 5. Cash and trust flow: the exact settlement design

**Principle:** the shop gets its money before the goods leave, the driver's cash debt to us stays small, and **we never hold customers' money in our own wallet.** Under Law 194/2020 and the CBE's June 2025 payment-provider rules, collecting money on behalf of merchants needs a licence ([Chambers Fintech 2026](https://chambers.com/practice-guides/guides/fintech-2026/egypt/law-and-practice)) (S).

| Flow | Design |
|---|---|
| **Cash order, platform driver** | At pickup the driver pays the shop **subtotal minus commission** in cash. The shop app shows «استلم ١٠٢ ج (١٢٠ − ١٨ عمولة)». The customer pays the driver the total, 140 EGP. The driver keeps his 22 EGP and **owes us 16 EGP**. That's the commission collected with no shop invoicing at all. |
| **Driver float** | Dispatch offers a cash order only if the shop payout is within the driver's float limit. New drivers get 300 EGP; the limit rises to 600 or 1,000 after 50 and 200 clean orders. Larger orders need a wallet payment first. |
| **Driver remittance** | Daily, through InstaPay ([24M users](https://english.ahram.org.eg/News/581997.aspx)) (S), a Vodafone Cash transfer or a Fawry or Aman reference code, to the **company** account. Cash orders stop when the amount owed passes 400 EGP or 24 hours. A 1,000 EGP security deposit is built up from the first two weeks' earnings, and nothing is signed in blank. |
| **Wallet order** | The customer pays a licensed payment provider's link (Paymob, Kashier or Fawry) into the company merchant account. At 23:00 the shop gets an InstaPay payout of its net amount. The driver is paid weekly, with on-demand cash-out. |
| **Own-delivery order** | The shop collects everything. Commission comes out of a **prepaid commission balance** the shop tops up (for example 500 EGP) and is deducted per order. At zero the shop's own-delivery orders pause, so **we carry no receivables.** |

### Fraud cases

| Fraud | Control |
|---|---|
| Fake order or refusal at the door | Phone OTP. First cash order capped at 250 EGP. A 0.5% GMV refusal reserve pays the driver back (never charge the driver). Refusers are wallet-only after that. |
| Driver runs with the cash | His worst case is only the commission owed, at most 400 EGP, because the shop was paid at the counter. He also has the deposit and an ID on file. |
| Driver pays the shop short | The shop confirms «استلمت المبلغ» in its app before handover. Disputes are settled from the photo of the counter receipt. |
| Shop raises app prices above in-store | Packaged goods can't be sold above the printed price (Consumer Protection Law 181/2018). Medicine prices are fixed by the state. For restaurants: a «نفس سعر المحل» parity badge, checked by 2 mystery-shopper orders per shop per month. The customer gets **twice the difference** as credit, and the shop loses its badge and ranking. |
| "Unavailable" item, then a pricier substitute | A substitute may cost at most 10% more than the item without the customer's approval in the app. |
| Multi-account promos, guarantee collusion | Phone, device and address fingerprinting. Guarantee caps from pillar 5. |
| Forged prescription | The pharmacist sees the original at the door for anything beyond OTC. Controlled drugs are blocked. |

---

## 6. Attacking the launch plan

**Don't launch 6 zones.** The seed has university, Masalla, Hadaqa, Dalla, Kiman Fares and Sufi. Launch a **2 km circle covering 2 or 3 adjacent zones**: on the seed coordinates, المسلة + حي الجامعة + الحادقة are about 1 km apart. Confirm with a field count of shops per street. Fayoum University has about 48K students ([Statbase/THE](https://statbase.ru/data/fayoum-university-egypt-number-of-students-by-university/)) (S): they're the early adopters, with smartphones, InstaPay and late nights.

**Supply needed on day 1 (inside the circle), at least 90 live shops:**

| Category | Shops |
|---|---|
| Restaurants | 30 (koshary 4, foul and ta'meya 5, grills and chicken 5, pizza and fiteer 5, shawarma and sandwiches 6, crepe and desserts 5) |
| Pharmacies | 15, of which 2 are open until 2 am |
| Groceries | 20 (from the template) |
| Bakeries and sweets | 10 |
| Vegetables and fruit | 8 |
| Meat and poultry | 7 |

**Rule:** a category tile appears only when 6 or more of its shops are open right now.

**Drivers:**
- 30 signed up, with at least 12 online from 19:00 to 23:00 and at least 6 from 13:00 to 16:00.
- For the first 6 weeks, guarantee **35 EGP per online peak hour**. That's at most 12 × 4 h × 35 = 1,680 EGP a day, less what they earn from orders.

**Hours:**
- Weeks 1 to 4: 12:00 to 16:00 and 18:00 to 01:00.
- Pharmacy late night only once 2 night pharmacies have signed.
- No 24/7 until on-time delivery reaches 85% or better.

**Category order:**

| Phase | When | What |
|---|---|---|
| 1 | Week 0 | Restaurants, pharmacies, bakeries and sweets: small catalogs, high frequency, urgent needs |
| 2 | Weeks 4 to 6 | Groceries from the template, plus multi-shop clusters |
| 3 | Week 8 onward | Vegetables, fruit and meat with daily prices, plus «هاتلي أي حاجة» |

**Breaking the chicken-and-egg problem:** sign up shops first by giving them value **with zero platform customers**. In own-delivery mode the shop gets:
- a digital menu,
- an order inbox,
- tracking for its existing phone customers.

The shop then pushes its own WhatsApp customers onto the app because it saves calls. That seeds demand, and campus ambassadors add 2,000 pre-registered students.

**Decide at day 60 whether to continue. Targets:**
- 150 or more orders a day
- 35% or more week-4 retention
- 90% or more shop acceptance
- 85% or more on time
- +5 EGP or more contribution per order

If you miss two of these, stop scaling and fix them first.

---

## 7. Five bold ideas that are specific to Fayoum

| # | Idea | Why a competitor can't easily copy it |
|---|---|---|
| 1 | **«دفتر الشُكك»: a digital credit tab.** The shop approves a known family for credit up to a limit it sets. Orders go «على الحساب», the app keeps the ledger and sends a monthly statement, and the customer pays by InstaPay or cash. We carry no credit risk; the shop does, as it does today. | This is the phone call's real moat: the shop owner trusts the family. Talabat's model is anonymous and centrally collected, so it can't offer shop-level credit. Once a family's tab lives in our app, they stop calling. |
| 2 | **«اطلب لأهلك في الفيوم»: ordering from the diaspora.** Children in Cairo, the Gulf or Italy pay by card through a payment provider for groceries and medicine delivered to their parents. Fayoum's Tatoun is called "Little Italy" because about a quarter of its working-age people work there ([Al-Monitor](https://www.al-monitor.com/originals/2019/02/why-farmers-sons-do-not-want-to-end-in-the-field-in-egypt.html)) (S). Add a monthly «سلة البيت» basket, and send the payer a WhatsApp photo as proof of delivery. Cards only on this flow. | It's prepaid, the baskets are large, and there's no cash risk. It needs elderly-friendly delivery (the driver calls the parent and carries the bags upstairs) and local trust. National apps have no "pay for someone in another city or country" flow. |
| 3 | **«رقم واحد للفيوم»: a hotline with agent-assisted ordering.** Older customers call or WhatsApp a local number, and the agent builds a **structured** cart from the catalog. That's not free text to the shop, so it fits the founder's rule. The agent then sets up «اطلب تاني» on the customer's phone or a family member's. | It turns the phone-call habit into app orders instead of fighting it. It needs agents who know Fayoum's landmarks and shops; Cairo apps' support is centralized. It costs about 1 agent per 120 assisted orders a day (E). |
| 4 | **«الروشتة الشهرية»: chronic-medicine refills.** With the patient's consent, the patient's own pharmacist keeps the prescription on file. The app reminds them 3 days before they run out, and delivery is scheduled. It can be combined with idea 2's payer. | Chefaa does national refills with free delivery in 48 hours ([App Store](https://apps.apple.com/app/id1438961456)) (S). This is same-day, from the pharmacist the patient already knows. Scheduled routes cost a fraction of on-demand. |
| 5 | **«مشوار الصبح»: a scheduled morning route.** Order by 11 pm and it arrives between 7 and 9 am: free-market bread, foul, milk, chronic medicines. It runs on fixed routes per neighbourhood for **10 EGP**, with 8 to 12 drops per run, so the driver earns about 100 EGP an hour. (Subsidised bread is ration-card only at 20 piasters ([Maspero](https://www.maspero.eg/economy/2026/03/10/935334/)) (S), so it must never be listed.) | Density and the morning habit can only be built neighbourhood by neighbourhood with local bakeries and foul shops. A late entrant can't buy the routes, and they make our cheapest delivery cheaper than the phone call. |

---

## Other things in the code to fix before the merchant app

- **`place_order`:**
  - No minimum order.
  - No opening-hours check.
  - No distance check between the stores in one order or to the customer's zone.
  - Takes any `lat`/`lng`.
  - Has no rate limit.
  - Under anonymous sign-in, it accepts unlimited cash orders.
- **The `stores` table is fully readable by `anon`.** Restrict it with column grants or a view: remove `referral_code` and future fields such as the owner's phone.
- **The promise formula needs live inputs.** `guaranteed_minutes` should be computed by dispatch from live data, not frozen when the order is placed.
- **The UI promise has no terms.** «لو اتأخرنا، التوصيل الجاي ببلاش» appears in `checkout.tsx:110` and `(tabs)/index.tsx:163` with nothing behind it. Add a terms link before any public test.

## Research gaps (check in the field in week 1)

- Rabbito's and Tawsilty's real coverage, fees and shop count. Order from both.
- Facebook and WhatsApp «دليفري/مشاوير الفيوم» services: Facebook isn't indexed, so ask in local groups.
- What Fayoum shop boys actually earn per day.
- The current tuk-tuk fare in the city.
- Whether InstaPay is used at local groceries.
- My per-order estimates (E) should be replaced with the numbers from 50 real orders as soon as the pilot starts.
