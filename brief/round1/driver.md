# Round 1: the driver's view (محمود, 23, koshary-shop rider, Fayoum city)

**Benchmarks:**
- **Fuel, November 2026:** benzine 80 costs 20.75 EGP/L and 92 costs 22.25.
- **Talabat Cairo, August 2026:** "up to 36" EGP per order, 50 over 5 km.
- **Damietta restaurant, 2026:** 5,500 EGP fixed per month plus 22 per order.
- **Talabat 2022 strike:** riders struck over 14 EGP per order.

Sources are at the end.

---

## 1. Would he sign up?

> «أسجّل؟ آه، التسجيل ببلاش. بس أسيب المعلم عشان أبلكيشن لسه فاتح؟ لأ. هجرّبه في وقت فضايا، ولو أول أسبوعين لقيت فلوس بجد وبتتحوّلي في ميعادها، نتكلم. صحابي في القاهرة دخلوا طلبات وبعد كام شهر سعر الأوردر نزل والخصومات كترت. اللي يقولي "سجّل وخلاص" من غير ما يقولي الأوردر بكام، بيضحك عليّا.»

> «و"عجلة ولا سكوتر ولا موتوسيكل" مش نفس الشغلانة. ابن عمي بالعجلة لو بعتّوله كرتونة مية ومشوار ٥ كيلو هيرجعلكم ميّت.»

**Analysis.** Sign-ups come easily; active riders don't. Shop boys will treat it as a side gig until it proves three things: **a full pay formula on the registration screen** (never "up to"), **payout the next day**, and **no money deductions**. Riders know the Talabat tier drop from 19 to 16. Vehicle type must decide which offers a rider gets (§9).

---

## 2. His math

> «دلوقتي: يومية ٢٥٠، وبقشيش ٧٠–١٠٠، والكشري ببلاش. البنزين عليّا، ٦٠–٧٠ جنيه في اليوم ٨٠. بروّح بحوالي ٢٨٠ صافي، ومضمونين حتى لو اليوم نايم. عشان أسيبهم لازم أروّح بـ٤٠٠ صافي على الأقل.»

| Item | Estimate |
|---|---|
| Orders per hour at peak (2–4 pm, 8–11 pm) / off-peak at launch | 2.0–2.5 / 0.7–1.0 |
| A realistic 10-hour day | **15–18 orders** |
| Km per order (ride to shop, drop-off, repositioning) | **4.5–5 km** |
| Fuel economy, 150cc carburettor bike in city traffic | ~30 km/L (owners report ~40 for a Lifan 150 on mixed roads) |
| Fuel per km (20.75 ÷ 30) / other wear (oil, tyres, chain, brakes) | 0.69 / ~0.6 EGP |
| **Running cost per order** | **~6.5 EGP** (about 3.5 of it fuel) |
| Running cost per day (~90 km) plus mobile data | ~120 EGP |

**What he needs per order** to clear 400 EGP net a day:
- At 16 orders: (400 + 120) ÷ 16 = **32.5 EGP gross**.
- At 20 orders: **26 EGP**.
- Tips average maybe 3 EGP, so **the platform must pay 23–29 EGP per order.**

**Can a 20 EGP fee pay him?** No. The commission must fund part of the driver's pay.

Assuming the driver averages 23 EGP:

| Order | Fee | Commission | Platform revenue | Driver | **Platform keeps** |
|---|---|---|---|---|---|
| Koshary, 150 EGP, 10% | 20 | 15 | 35 | 23 | **12** |
| Grocery, 250 EGP, 5% | 20 | 12.5 | 32.5 | 23 | **9.5** |
| Pharmacy, 100 EGP, 5% | 20 | 5 | 25 | 23 | **2** |
| Grocery through a referral code (2.5%) | 20 | 6.25 | 26.25 | 23 | **3.25** |
| 3 shops (100 + 250 + 40) | 30 | 20.7 | 50.7 | 37 | **13.7** |

Pharmacy and referral-code orders lose money once you add cash handling, insurance and support. The fixes are in §10, item 3.

### Proposed driver pay formula

| Component | Amount |
|---|---|
| **Base** (pickup plus the first 2 km of the drop) | **16 EGP** |
| Each drop km after 2 km (road distance measured by the app) | **+3 EGP/km** |
| Ride to the first shop beyond 2 km (stops dispatch sending him across town for free) | +2 EGP/km |
| **Each extra pickup** | **+7 EGP** |
| Waiting at a shop, after 7 free minutes past its promised ready time. **Charged to the shop.** | +1 EGP/min, capped at 20 min |
| Waiting at the door, after 5 minutes | +1 EGP/min, capped at 10 |
| Peak (2–4 pm, 8–11 pm) / after midnight or Ramadan iftar | **+4 / +6** |
| Customer not home (he makes the return trip) | +50% |
| Tips | 100% his |
| **Launch guarantee, first 8 weeks** | A booked 6–11 pm shift pays at least **200 EGP** if he is online at least 95% of it and accepts at least 70% of offers. The 70% rule only decides whether he qualifies for the guarantee; it is never a punishment. |

Worked examples:
- A single 2.8 km order: **18.5** off-peak, **22.5** at peak.
- 4 km at peak: **26**.
- A 3-shop trip (shops 0.7 km apart, drop 3.5 km): **~37**.

Driver pay averages **~23–24 EGP per order**. The platform keeps **9–12 EGP** on normal orders, which is **25–30% of fee plus commission.**

**The real lever is density:** cap the riders online per shift so each one gets about 2 orders per hour. Sixty idle riders means nobody stays.

---

## 3. The 3-shop trip

> «صيدلية وبقالة وفرن في مشوار؟ ماشي، بس السخن آخر حاجة. مش هشيل كشري جنب كيس بيض وزجاجة زيت وأستنى البقال يلم ٢٠ صنف وهو بيكلّم زباين تانيين، ده ربع ساعة. وكل محل بركن وأقفل الموتوسيكل وأدخل، يعني ٧–١٠ دقايق للمحل مش ٥.»

**Rules:**
1. **Sequence:** pharmacy, then grocery, then bakery, then restaurant (hot food last). The restaurant gets the "start cooking" signal only when the driver is about 5 minutes away.
2. **Cluster limit:** every shop must be within **1 km** of the first one, and the detour is capped at **+1.5 km** compared with a single-shop trip. Otherwise, split it into two orders.
3. **Readiness gate:** no dispatch until the grocery and pharmacy have tapped «جاهز» (ready). The driver never stands inside while someone picks his items.
4. **His patience:** 10 minutes per shop, 35–40 minutes total. After **20 minutes at one shop** he gets «ألغي واتعوّض» (cancel and get compensated): +10 EGP, the order is re-dispatched, and the shop is charged.
5. **Weight:** motorbike 15 kg maximum, bicycle 7 kg. Water packs, oil bottles over 3 L and sacks over 5 kg mark the order «تقيل» (heavy), and heavy orders never go to bicycles.
6. **Sealed bags:** the shop seals the bag and staples the receipt to it, and the driver takes one photo at pickup. **If the seal is intact, the driver is not responsible for the contents.** Eggs travel in a boxed tray; breakage from bad packing is the shop's cost.
7. **Missing items are settled between the shop and the customer before the driver arrives.** The cash total updates automatically.
8. **Gear:** a two-compartment bag (insulated hot side plus a grocery side), handed out at onboarding.

---

## 4. The shop's own delivery boy on the platform app

> «الساعة ٨ بالليل المحل مولّع، والمعلم عايزني، والأبلكيشن بيرن بأوردر بـ٢٥. لو مشيت المعلم هيطردني. ولو المنصة بتدفع أكتر؟ بصراحة هسيب المعلم. والمعلم عارف، فهيحاول ياخد من فلوس المنصة "عشان ده وقتي". وأي زبون جديد هقوله "خد رقمي، اطلب مني على طول". كلنا بنعمل كده.»

**The contradiction in pillar 2:**
- Good platform pay poaches the shop's boy, and the shop becomes an enemy.
- Bad pay means he ignores the app.
- Either way, customer phone numbers leak.

**Rules:**
1. **Two modes, set in the merchant app.**
   - **«شغال عندي»** (working for me): during the shop's scheduled hours he receives only that shop's orders, phone and platform. The platform sends him **zero outside offers.**
   - **«متاح للمنصة»** (free for the platform): outside those hours, or when the owner taps "release 1 hour", he is a normal driver.
2. **Money in shop mode:** the 20 EGP fee on his own shop's platform orders goes **to the shop**, which already pays his wage. The platform takes only commission and pays the boy **+3 EGP directly** so he keeps updating the order status.
3. **Money in released mode:** **100% of the pay goes to the boy's own wallet.** The shop gets **2 EGP per order from the platform** (never from the boy), so the owner releases him instead of fighting.
4. **A no-cut clause in the shop agreement:** the shop may not take any share of the boy's platform earnings. Breaking it twice costs the shop its referral half-commission.
5. **Two colour-coded cash pockets:** «كاش المحل» (the shop's cash) and «كاش المنصة» (the platform's cash). If they get mixed up, a fight follows.
6. **Number leakage:** the customer's phone number is visible only from pickup until 30 minutes after delivery. Some leakage will happen anyway, so win on price and features.

---

## 5. Cash

> «الكاش أنا اللي شايله. لو هتخليني أروح مكتب كل يوم أورّد، ضيّعت ساعة. ولو هتقفلوا الحساب فجأة عشان "مديونية"، خلاص. خليني آخد فلوسي من الكاش اللي معايا وأورّد الباقي فودافون كاش أو انستاباي. ومش همضي إيصالات أمانة.»

**Exact rules:**
1. **The driver never pays a shop at pickup.** The platform settles shops daily. The one exception is the «هاتلي أي حاجة» errand: the driver fronts up to **300 EGP** (500 after 100 orders), and anything above that the customer prepays from the wallet.
2. **Net settlement on one line:** «معاك ١٬٢٤٠ كاش — منهم ٣١٠ بتوعك — المطلوب توريده ٩٣٠» (you hold 1,240 in cash, 310 is yours, deposit 930).
3. **A cash limit that grows with trust:** 600 EGP at the start, 1,500 after 100 clean orders, 2,500 after 300.
   - At 80% of the limit he gets a warning.
   - At 100% he gets only wallet-paid offers until he deposits. **He is never fully blocked and never fined.**
4. **Deposits, with every fee paid by the platform:** InstaPay or Vodafone Cash (InstaPay charges 0.1%, minimum 0.5 EGP, maximum 20), a Fawry or Aman code, or one collection point in the city centre open until 1 am.
   - The deadline is 48 hours.
   - At 72 hours: freeze, plus a call from a human.
   - At 7 days: ban and recovery.
   - **No إيصالات أمانة** (signed trust receipts).
5. **Payout:** whatever the platform owes him is paid **daily at 10 am to Vodafone Cash or InstaPay, free**, with a 50 EGP minimum.
6. **Change («فكة»):**
   - At checkout the customer answers «هتدفع بفئة كام؟» (which note will you pay with?), and the driver sees «معاه ٢٠٠».
   - Totals round to the whole pound.
   - A **«حط الباقي في محفظته»** button (put the rest in his wallet) credits up to 100 EGP to the customer's wallet and takes it off what the driver owes.
7. **Refused item:**
   - Wrong or damaged: photo, then «شيل الصنف» (remove the item). The total recalculates, the shop bears the cost, and the driver gets +5 if returning it adds more than 1 km.
   - Changed mind: cooked food can't be refused. Sealed groceries can, and the customer is flagged after the third time.
8. **Customer not home:**
   - Two calls plus one WhatsApp, then an **8-minute GPS-verified timer**.
   - The driver gets **100% plus 50%**. Groceries and medicine go back to the shop; hot food is written off.
   - After 2 no-shows the customer loses cash payment.
   - **New customers are capped at 300 EGP in cash**, and phone OTP is required before any cash order.

---

## 6. Guaranteed time («late = next delivery free»)

> «المحل اتأخر ١٥ دقيقة في الكشري، مين هيتخصم منه؟ أنا. دايماً الطيار. ولو حطيتولي عدّاد أحمر وأنا سايق على بحر يوسف، هسوق زي المجنون وهتقلب بيّا.»

**Make it fair:**
1. **Blame by timestamps.** The app logs: accepted, arrived at shop (geofence), handed over (shop taps), arrived at customer, delivered.
   - **Shop late:** handover more than 3 minutes after its promised ready time.
   - **Dispatch late:** no driver within 4 minutes.
   - **Driver late:** only if his riding legs take more than 1.4× the app estimate plus 5 minutes.
   - **Customer at fault:** wrong pin or not answering. This voids the guarantee.
2. **Whoever caused it pays for the free delivery:** a late shop pays through its settlement; dispatch delays are paid by the platform.
3. **The driver is never charged money for lateness and always gets full pay.** Driver-caused lateness adds only a score mark: 3 in a week brings coaching, 10 in a month lowers his offer priority.
4. **No red countdown and no pop-ups while he's moving.** He sees a calm «في الميعاد» (on time).
5. **Fix the formula.** "Slowest shop ETA + 5 + 5 per extra shop" **leaves out riding time**, and each extra shop really takes 7–10 minutes. Use: **latest shop ready time + all riding legs + 8 minutes per extra shop + 5 minutes buffer.**

---

## 7. Addresses and navigation

> «محدش في الفيوم يعرف رقم شارع. الزبون بيقولك "الحادقة، ورا البنك الأهلي، العمارة اللي تحتها صيدلية، الدور التالت". ونص الناس بتحط الدبوس غلط أو من الشغل وتطلب للبيت. أهم حاجة زرار أكلّمه، وواتساب، ورسالة صوت أسمعها وأنا واقف.»

**The address form, in this order:**
1. **«حدد مكان البيت على الخريطة»** (mark your home on the map), required, with **«أنا في البيت دلوقتي، استخدم موقعي»** (I'm home now, use my location). Warn when the pin is more than 300 m from the phone's GPS.
2. **«المنطقة»** (area), required: الحادقة، كيمان فارس، دار الرماد، المسلة، الصوفي، لطف الله، الجامعة… plus «تاني».
3. **«أقرب علامة مميزة»** (nearest landmark), required. Placeholder: «جنب جامع…، ورا البنك الأهلي، قدام مدرسة…».
4. «الشارع أو الحارة» (street or alley), optional.
5. **«العمارة أو البيت»** (building or house), required: «عمارة الحاج محمد، بوابة حديد خضرا، تحتها صيدلية».
6. «الدور» (floor) chips from أرضي to ٨, «الشقة» (flat), «فيه أسانسير؟» (lift?).
7. **«سجّل وصف الطريق بصوتك»** (record the directions in your voice): 30 seconds, saved and reused on every order. This is critical for older customers.
8. «رقم تاني لو الأول مقفول» (backup number) and «المندوب يكلمك واتساب؟» (WhatsApp OK?), on by default.
9. **«بتطلب لحد تاني؟»** (ordering for someone else?) with the recipient's name and phone, for sons in Cairo ordering for parents in Fayoum.

**The driver side:**
- **Call** and **WhatsApp** buttons. WhatsApp opens a template: «أنا محمود من [التطبيق]، معايا طلبك، أنا عند…».
- **Play voice note**, **open in Google Maps** (no in-app map tiles, which saves data), and **«أنا تحت البيت»** (I'm downstairs), which pushes a notification to the customer.
- After delivery: **«صحّح الدبوس»** (correct the pin) when the drop point is more than 50 m off, and **«ملاحظة للعنوان»** (an address note for the next driver). Every address improves with each delivery, which a phone call can never do.

---

## 8. The driver app

> «قبل ما أقبل لازم أعرف: رايح فين، هاخد كام، وهحصّل كام كاش. لو خبّيتوا المكان لحد ما أقبل، هقفله. ولو الموبايل فصل شحن الساعة ٦، خلاص.»

**The offer card** (40-second timer; rejecting is free):

```
٢٤ جنيه   (أساسي ١٦ + مسافة ٤ + ذروة ٤)
٢ محلات:  صيدلية الشفاء، المسلة  ← ٠٫٨ كم منك  [جاهز]
          بقالة النور، المسلة    ← ٠٫٣ كم بينهم [جاهز خلال ٦ د]
تسليم:    الحادقة، ورا البنك الأهلي — ٣٫١ كم — ~١٨ دقيقة
حصّل كاش: ١٨٧ جنيه   |  تدفع للمحل: ٠
الشنطة:   متوسطة، مفيهاش سخن    |  زبون: أول طلب
[ اقبل ]   [ ارفض ]
```

**Screens:**
1. **Home:** a big online switch, today's earnings, cash held versus owed, and busy areas as text.
2. **Offer card** (above).
3. **Pickup, per shop:** call the shop, order code, «الطلب مش جاهز» (not ready, starts the wait clock), photo of the sealed bag, «استلمت» (picked up).
4. **Drop-off:** the address card, voice note, call and WhatsApp, **large «حصّل ١٨٧»** (collect 187), a change helper, «سلّمت» (delivered).
5. **Problems:** customer not answering, wrong address, refused item, accident, robbery. Each one reaches **a human by phone within 2 minutes.**
6. **Earnings:** each order's breakdown, cash owed, «اسحب فلوسي» (cash out).
7. **Shift booking.**

**What makes him quit:** deductions, acceptance-rate punishments, hidden destination or pay, rate cuts after launch, payout slower than 24 hours, surprise cash-debt blocks, automatic rating bans, and battery or data drain.

**Technical targets:**
- Android 8+, 2 GB of RAM.
- APK under 30 MB.
- GPS every 15–20 seconds on a trip and every 3–5 minutes idle.
- **Under 300 MB of data per month**, and under 10% battery per hour.
- Status updates queue offline on a weak 3G signal.

---

## 9. Onboarding and safety

> «رخصة؟ نص اللي أعرفهم مش معاهم، والموتوسيكلات نصها من غير لوحات. لو طلبتوا رخصة من أول يوم مش هتلاقوا طيارين. بس لو واحد من غير رخصة عمل حادثة بأوردر منكم، المصيبة عليكم.»

**Documents:**
- **Everyone:** national ID (front and back), a selfie liveness check, and a phone number in the rider's own name.
- **Motorcycle and scooter:** a driving license and a vehicle license are required. In Egypt a motorcycle license is 18+ only and costs about 1,160 EGP; riding without one is a ~1,000 EGP fine. Talabat requires it too.
  - Don't lower the bar; remove the barrier. Run a monthly license day with the Fayoum traffic unit, **lend the fee** and recover it at 5 EGP per order, and allow a 30-day "pending" status while the paperwork is processed.
  - The founder needs a lawyer's view on the platform's liability for crashes.
- **«فيش جنائي»** (criminal record certificate) within 30 days.
- **The shop's own boys get a fast track,** because the owner vouches for them.

**Age:** **18+, no exceptions**, checked from the birth date inside the national ID number. Many shop boys are 15–17.

**Bicycles:** drops within 2.5 km, 7 kg maximum, no heavy orders, multi-shop only when the shops are within 300 m, and no offers from 12–4 pm in July and August unless he opts in.

**Insurance:** Talabat insures only 800 riders, through Fawry since January 2026, and its ads start accident cover only after 3 months. **Beat that:** accident cover **from the first order**, about 1 EGP per order into a microinsurance policy priced with a broker. Give a free helmet and bag at onboarding.

**Bad drivers:**
- **Never ban on ratings alone;** a human reviews complaints with evidence.
- **Immediate ban:** cash not deposited within 7 days, proven theft, harassment.
- **Hide the customer's number after delivery** (this protects women customers), and add a safety report button.

---

## 10. Ranked changes for the founder

1. **Pay drivers from fee plus commission.** Adopt the formula: 16 base, +3 per km after 2 km, +7 per extra shop, wait time charged to the shop, +4 at peak. Publish it at sign-up and don't cut it in year one.
2. **Pay out daily to Vodafone Cash or InstaPay,** with net cash settlement and a cash limit that grows with trust. No fines, no signed trust receipts, no full blocks.
3. **Change the customer fee:** **15 / 20 / 25 EGP by distance** (≤2 km / 2–4 km / 4–6 km), **+7 per extra shop** (not +5), and +7 on baskets under 100 EGP.
4. **Cap the riders online with booked shifts,** and guarantee 200 EGP per evening shift for the first 8 weeks.
5. **Assign lateness by timestamps,** so the shop or the platform pays for the free delivery, never the driver. Add riding time and 8 minutes per extra shop to the promise.
6. **Use the full offer card:** pay, shops, drop area, km, cash to collect, bag size, first-order flag. Rejecting is free.
7. **3-shop rules:** shops within 1 km, a readiness gate, hot food last, sealed bags with a photo, missing items settled before arrival.
8. **Shop-boy modes:** «شغال عندي» and «متاح للمنصة», with the fee going to the shop in shop mode, a 2 EGP release fee, a no-cut clause, and colour-coded cash pockets.
9. **A landmark address form with a voice note,** plus pin corrections and address notes from drivers.
10. **Licenses with help,** 18+ only, accident insurance from day one, and separate bicycle rules.
11. **A light app:** under 30 MB, under 300 MB of data a month, Google Maps handoff, and a human on the phone within 2 minutes.

---

## Sources

- Fuel prices, November 18, 2026 (92 at 22.25): [banker.news/161435](https://www.banker.news/161435); benzine 80 at 20.75: [banker.news/152716](https://banker.news/152716)
- Talabat ad, Cairo, August 2026 (36 per order, 50 over 5 km, license required, insurance after 3 months): [jobs-arab 762743](https://www.jobs-arab.com/eg/jobs/762743/)
- Talabat ad, Giza, October 2026 (10,400 or 13,000 per month): [jobs-arab 778321](https://www.jobs-arab.com/eg/jobs/778321/)
- Speedo, a staffing company that supplies Talabat riders (up to 46–48 per order; Breadfast 42; license required): [speedo.com.eg](https://speedo.com.eg/)
- Damietta restaurant (5,500 plus 22 per order): [jobs-arab 761788](https://www.jobs-arab.com/eg/jobs/761788/)
- Talabat tier ad (19 to 16 per order, 1.5–2.5 orders per hour): [dubizzle 191656143](https://www.dubizzle.com.eg/en/ad/%D9%85%D9%86%D8%AF%D9%88%D8%A8-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%B7%D9%84%D8%A8%D8%A7%D8%AA-%D8%AF%D9%84%D9%8A%D9%81%D8%B1%D9%8A-ID191656143.html)
- 2022 strike (14 EGP per order): [cairo24](https://www.cairo24.com/1548490), [elwatannews](https://www.elwatannews.com/news/details/6031192)
- Egyptian delivery workers: 77% paid per order, 80% without contracts. These come from search excerpts; the full pages would not load: [Zawia3](https://zawia3.com/en/delivery-workers-rights-egypt/), [ARIJ](https://arij.net/investigations/delivery-workers-rights-egypt/en/)
- Talabat riders work through third-party logistics providers: [talabat vendor terms (Egypt)](https://www.talabat.com/page/vendor/terms/restaurants/egypt)
- Fawry and talabat insurance for 800 riders, January 2026: [ME Insurance Review](https://meinsurancereview.com/News/ViewNewsLetterArticle/id/94114/Type/MiddleEast/Egypt-Fawry-partners-with-talabat-to-offer-medical-insurance-to-delivery-riders), [Arab Finance](https://arabfinance.com/en/news/newdetails/fawry-and-talabat-partner-to-provide-health-insurance-for-over-800-delivery-drivers)
- Minimum wage (8,500 from January 2027): [Al Khaleej](https://www.alkhaleej.ae/2026-11-15/منوعات/محطات/زيادة-الحد-الأدنى-لأجور-القطاع-الخاص-في-مصر-ل8500-جنيهما-موعد-التطبيق)
- Motorcycle license (18+, about 1,160 EGP, 1,000 EGP fine): [Sada El Balad](https://www.elbalad.news/6517699)
- InstaPay fees: [Youm7](https://www.youm7.com/story/2026/2/25/لو-هتحول-70-ألف-جنيه-هتدفع-كام-تعرف-على-رسوم/7317959)
- 150cc fuel economy (Lifan 150, ~40 km/L): [MotorcycleValley](https://www.motorcyclevalley.com/news/best-mileage-150cc-bikes-in-bangladesh)
- Fayoum job ads without wages: [jobs-arab, Fayoum](https://www.jobs-arab.com/eg/job-profession/%D8%B3%D8%A7%D8%A6%D9%82-%D8%AA%D9%88%D8%B5%D9%8A%D9%84/job-location/%D8%A7%D9%84%D9%81%D9%8A%D9%88%D9%85/)

**Persona assumptions, not sourced:** a 250 EGP daily wage plus 70–100 in tips for a koshary rider, 30 km/L in city riding, ~0.6 EGP per km of wear, and Fayoum order volumes at launch.
