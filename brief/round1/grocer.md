# Round 1: the shop owner's view (عم سيد، بقالة السيد، حي الجامعة)

Persona: عم سيد, 52. A mid-size بقالة with about 1,500 items, no barcodes, a paper شكك notebook, one delivery boy on a Chinese motorbike, open 9am to 1am. He takes orders by phone and WhatsApp, and his 19-year-old son handles anything technical.

Screenshots are in `grocer-shots/`. On this machine, headless Chrome renders a 390 px window at about 500 px and crops the right side, so `grocery-store.png`, `stores.png` and `home.png` look cut off. That is a capture artifact, not an app bug. Use the `*-wide.png` files (600 px) to read the screens.

What he sees in the app today:
- His shop is listed as «بقالة الحاج سيد» with a letter avatar «س», «التوصيل 20 ج», «15–25 دقيقة» and «نفس سعر المحل بالظبط، ووقت مضمون».
- The shop page has 5 items in one flat list, with no sections and no search.
- On «سوبرماركت وبقالة» and «كل المحلات», his direct competitor «سوبرماركت النخيل» sits **above him**, also at 0.1 km.

The schema matches this: `products.price int`, `order_items.qty int` from 1 to 50, no weight unit, and no hours, pause, phone or own-delivery-fee fields on `stores`.

---

## 1. First reaction (the first 30 seconds)

> «أهلاً يا ابني اتفضل… تطبيق؟ زي طلبات يعني؟ لا يا حبيبي، المطاعم اللي في القاهرة بيقولوا طلبات بتاخد ربع الأكلة. أنا مكسبي في كيس السكر جنيه ونص، هتاخد منه إيه؟»

He hears "app" and thinks "Talabat taking a quarter". Secondary sources put Talabat Egypt's restaurant commission at about 15–25%, and restaurants say so loudly. The salesman has 30 seconds to say **"مش طلبات، ومش بناخد من زبونك القديم زي الجديد"**.

> «وبعدين زبايني عارفيني بالاسم. الست أم محمد بتكلمني تقولي "الطلبية بتاعة كل أسبوع يا عم سيد" وخلاص. هي هتقعد تدوّر في تطبيق على 40 صنف؟»

His real moat is the **standing order**: the same basket every week, said in one sentence on the phone. The app has no "reorder last basket" and no saved lists, so it is slower than the phone for his best customers.

> «وأنا شايف في الموبايل بتاعك التوصيل 20 جنيه. أنا الواد بتاعي بيوصّل ببلاش في الحتة. يعني زبوني يدفع 20 جنيه زيادة عشان يطلب مني أنا؟ يبقى بكرة يكلمني على التليفون.»

**This is the instant no.** His store card shows «التوصيل 20 ج». Today his boy delivers free for most orders in حي الجامعة, or charges 5 ج for tiny ones. If the sticker sends his customer to an app that costs 20 ج more than calling him, the sticker works against him.

> «آخر حاجة: إنتو زي بريدفاست وطلبات مارت؟ تشوفوا إيه اللي بيتباع عندي وبعدين تفتحوا مخزن جنبي؟»

He has heard how quick-commerce dark stores took the student and young-family trade from بقالات in Cairo. The founder already ruled out a dark store, so **put that promise in writing in the contract.** It is the strongest trust line available, and it costs the platform nothing.

---

## 2. Each pillar from his side

### 2.1 Store code sticker + half commission. Verdict: likes the idea, hates the current numbers

> «الستيكر ماشي، أنا أعلّقه على التلاجة. بس اللي جايبه أنا تاخد عليه نسبة ليه أصلاً؟ ده زبون أبويا من عشرين سنة.»

> «ولما الزبون يفتح التطبيق من الستيكر بتاعي يلاقي النخيل فوقي في الليستة؟ ده أنا كده بعلّق إعلان لجاري.»

Analysis:
- **Love:** the shop becomes visible to students who don't have his number. حي الجامعة is full of Fayoum University students in rented flats, the most app-ready customers in the city.
- **Hate:** paying anything at all on customers he already owns. He also hates that his competitor ranks above him. Today «سوبرماركت النخيل» is listed first at the same 0.1 km.
- **Conditions:**
  - Linked customers see his shop pinned first everywhere: home, category, search.
  - His store page shows no "similar stores".
  - On orders from his own code delivered by his own boy, commission is near zero (see section 3).

### 2.2 Putting his delivery boy on the platform's driver app. Verdict: afraid, with conditions

> «الواد بتاعي واخد 200 في اليوم غير البقشيش، والموتوسيكل بتاعي والبنزين عليّا. لو ركّبتوه على التطبيق وبقى يطلع طلبات لغيري، الساعة 8 بالليل وأنا زحمة ألاقيه في الحادقة شايل كشري؟ لا.»

> «وبعد شهر يلاقي إنكم بتدفعوله أكتر مني، يسيبني. أو ياخد أرقام زبايني ويروح يشتغل عند النخيل.»

Analysis: he fears three things, in this order:
1. Losing the boy at rush hour.
2. Losing the boy for good once the boy sees platform pay.
3. Paying for fuel and wear on a bike that earns money for someone else.

The tracking and "fewer phone calls" pitch doesn't register with him.

**Conditions:**
- A **"ولدي ليّا الأول"** switch that only the shop controls. The boy can take outside orders only when the shop turns it on, and only when he is inside a radius the shop sets.
- An outside order is cancelled for the boy if a shop order arrives before pickup.
- If the bike belongs to the shop, **the shop gets 3–5 ج from every outside delivery its boy makes.**
- Customer phone numbers are hidden from drivers on outside orders.

Framed this way, the boy becomes a **profit centre for the shop** instead of a flight risk.

### 2.3 Auto-reroute after 2 minutes. Verdict: hates it, strongly

> «دقيقتين؟! أنا الساعة 9 بالليل قدامي 5 زباين على الكاونتر وواحد بيحاسب، والموبايل في جيبي. دقيقتين ويروح الطلب للنخيل؟ يعني زبوني أنا أنا اللي جبته بستيكري يروح لجاري؟ ده أقفل المحل أحسن.»

> «وبعدين بقالة مش زي كشري. النخيل عنده جبنة رومي غير بتاعتي وزيت غير بتاعي. الزبون يستلم حاجة غير اللي طلبها ويزعل مني أنا.»

Analysis: this pillar is written from the customer's side, and for a grocery shop it reads as "we will give your customer to your competitor".

**Conditions he would accept:**
- **Never reroute a customer who is linked to his shop** without asking the customer: «الحاج سيد مشغول دلوقتي، تستنى 10 دقايق ولا نحوّلك؟». The customer chooses.
- For grocery, **4 minutes**, not 2. The alert repeats loudly, and at minute 2 an **automated phone call** rings his normal line so he can press 1 to accept.
- A **«مشغول 20 دقيقة»** button that stops orders coming to him, so no order is lost against his record.
- Rerouted orders go to the other shop only for items both shops carry from the master catalog. Anything else is removed or confirmed with the customer.

He would **love receiving** rerouted orders. Tell him that too.

### 2.4 The 3-shop trip. Verdict: likes it, with conditions

> «لو الزبون طالب من الفرن والصيدلية ومني وأنا داخل في الطلبية، ده رزق. بس ولدي أنا مش هيلف على الصيدلية والفرن على حسابي.»

> «وحاجتي ما تستناش ساعة. اللبن والجبنة لو استنوا على الموتوسيكل في الشمس، الزبون يرجعهم وأنا اللي اتشتمت.»

Analysis:
- **Love:** extra baskets he would never get by phone, since nobody calls three shops.
- **Conditions:**
  - Platform drivers only, never his own boy unless paid.
  - The cold items shop (dairy) is picked up last.
  - The shop gets a "pickup in X minutes" time, so he doesn't pack early.
  - Eggs and loose items get a "fragile" flag on the driver's screen.

### 2.5 Guaranteed time. Verdict: neutral, but no penalties on him

> «اضمنوا اللي تضمنوه، بس متخصموش مني. أنا المحل على بعد 100 متر. لو اتأخر يبقى الطيار بتاعكم، مش أنا.»

Analysis: he accepts the promise only if the clock starts when **he presses accept**, and he sets his own prep time (5, 10 or 15 minutes) for each order. The free next delivery comes **from the platform's pocket, never his.** If he goes over his declared prep time, he gets a warning, not a deduction.

He also wants separate ratings for the shop and the delivery. Today the single «4.8» under his name takes the blame for driver mistakes.

---

## 3. Money

> «مكسبي في البقالة؟ السكر جنيه ونص في الكيلو، الزيت 3–4 جنيه في الإزازة، السجاير جنيه لاتنين في العلبة. المكسب الحلو في الجبنة واللانشون والمنظفات، 15–20%. على بعضه كده يطلعلي 10% في المتوسط.»

> «يعني طلبية بـ 200 جنيه مكسبي فيها 20. تاخد 10 (خمسة في المية)؟ نص مكسبي؟ وطلبية الشهر بتاعة أم محمد بـ 1500 تاخد منها 75؟ ده ولا الضرايب.»

Analysis: these margins are his own estimates, but they fit Egyptian grocery reality. Staples, cigarettes and phone-credit cards have very thin margins. **5% of the subtotal is about half his profit** on a typical basket, and more than his whole profit on a staples-heavy basket.

**What he would accept:**

| Order type | His number |
|---|---|
| Customer from **his code**, delivered by **his boy** | «ولا مليم»; he settles at **1% or a flat 3 ج per order** |
| Customer from his code, platform driver | 2.5% (the current half rate) is OK |
| **New customer** the app brought him, or a rerouted order | 5% is OK. «ده رزق ماكانش جايلي» |
| Any order | **Cap of 20 ج commission per order** |
| Cigarettes, phone-credit cards, infant formula (لبن أطفال) | **0% commission**, or keep them out of the app |

**Delivery fee:**

> «لما ولدي اللي يوصّل، أنا اللي أحدد التوصيل وأنا اللي آخده. صفر، خمسة، عشرة، أنا عارف زبايني.»

The 20 ج zone fee should apply only when a platform driver delivers.

**How and when he wants to be paid:**

> «أنا بدفع للتاجر كاش كل يوم الصبح. فلوسي متباتش عندكم أسبوع.»

- **Cash orders delivered by his boy:** the cash stays with him. The commission he owes is netted against what the platform owes him.
- **Wallet orders and platform-driver cash orders:** paid the **next morning** by InstaPay or Vodafone Cash. Weekly payout is a reason to leave.
- **Every night at 1am**, one WhatsApp message: «النهارده: 18 طلب، 3,420 ج، عمولة 61 ج، ليك عندنا 1,150 ج، هتنزل بكرة 10 الصبح».

**What would make him cheat or leave:**

> «لو النسبة تقيلة هزوّد على الزيت والسكر في التطبيق جنيهين، ومحدش هياخد باله.»

> «وأحط الكارت بتاعي في الشنطة: المرة الجاية كلّمني على طول ووفّر العشرين جنيه.»

The two leaks are **price inflation** and **taking customers off the app**. Policing won't stop either. Pricing will: low commission on his own customers, and a delivery fee he controls.

He leaves outright if:
- his own customer is rerouted to the competitor,
- money is held for more than 2 days,
- the order alert fails to ring,
- penalties appear, or
- the platform ever sells groceries itself.

---

## 4. Catalog and prices

> «ألف وخمسمية صنف؟ مين هيكتبهم؟ أنا؟ أنا مش فاضي أشرب الشاي.»

> «لو جبتولي ليستة فيها 300 صنف جاهزين، جهينة لتر وزيت كريستال وسكر الأسرة ومكرونة الملكة، بالأسعار، والواد ابني يعلّم صح على اللي عندي ويعدّل السعر لو مختلف… ده ممكن. ساعة بالليل مرة واحدة.»

Analysis:
- **Yes to the 300-item template**, on three conditions: real Egyptian brands with exact sizes, **prices pre-filled** from distributor price lists, and his son only ticks items and fixes prices.
- **Entering items one by one is a hard no.**
- The field team does the first session, about 2 hours with the son.
- The remaining ~1,200 items are added over time, mainly when customers ask for something that isn't listed.

**Daily price changes:**

> «الزيت والبيض بيتغيروا كل أسبوع. خلي ابني يقدر يقول "كل الزيوت +5 جنيه" بدوسة واحدة. أو أبعتلكم فويس على الواتس.»

- Bulk edit by section or brand: add or subtract X ج.
- The WhatsApp voice-note route the founder plans is right for vegetables, but **the son will use the app.**

**Out of stock:**

> «لما الطلب ييجي وألاقي الصنف خلصان، أدوس عليه "خلصان" وخلاص، وماترجعوش إلا لما أنا أرجعه.»

**Weight-based items:**

> «الجبنة الرومي بالكيلو، الزبون ياخد ربع. الرز السايب بالكيلو. الوزن مش هيطلع مظبوط بالجرام.»

The app can't sell a quarter kilo today, because `qty` is a whole number from 1 to 50 and there is no unit. Needed:
- Each item has a unit: piece or kg.
- Weight items offer ربع / نص / كيلو choices.
- The final weight may vary by ±10% and the price adjusts automatically. Anything beyond ±10% needs the customer's OK.

**Minimum effort he will tolerate:** zero minutes a day for himself, and **about 5 minutes a night for his son**: fix prices, put items back on. Anything heavier won't get done.

**Store page fixes he would demand** after seeing the screenshots:
- Sections: «ألبان، زيوت وسمنة، منظفات، معلبات، سجاير».
- **Search inside the store.**
- His shop-front photo instead of the letter «س»: «الناس عارفة المحل باليافطة».
- Opening hours: «لحد 1 بالليل», which matters to students at midnight.

---

## 5. The merchant app he would actually use

> «4 زراير مش أكتر. وبخط كبير، أنا نضارتي في الدرج.»

**Screen 1, new order.**
- Full screen, ringing **like an incoming phone call**: its own sound, max volume, works on silent, repeats until he taps.
- Shows the total in large text: «طلب جديد – 7 أصناف – 340 ج – كاش».
- Two buttons: **«قبول»** with a prep-time choice (5, 10, 15 minutes) and **«مشغول»**.
- No reject reason form.

**Screen 2, preparing.**
- Items list in big font, each with a checkbox. His boy picks from it.
- Each item has **«خلصان»** and **«بديل»** buttons. «بديل» opens his own list with the price difference shown.
- The weight on weight-based items can be edited.
- Then the **«جاهز»** button.
- Who picks up: "your boy" or a platform driver's **name, photo and plate**, plus a **4-digit handover code** the driver must say before getting the bag.

  > «مش أي حد يقولي أنا من التطبيق أديله شنطة بـ 600 جنيه.»

**Screen 3, «فلوس النهارده».** Number of orders, sales, commission, «ليك / عليك», and when the money arrives. Nothing else: no charts, no "insights".

**Screen 4, «الأصناف».**
- Search box, on/off toggle, price field, bulk ± by section.
- **«قفّل المحل / مشغول 20 دقيقة»** at the top.

**Notification while he's serving at the counter:**
1. The app rings.
2. At 60 seconds, his phone gets an **automated voice call**: «عندك طلب جديد بـ 340 جنيه، اضغط 1 للقبول».
3. At 3 minutes, a WhatsApp message.

He won't look at a screen while handing change, but he answers a ringing phone.

**Phone or tablet:**

> «على موبايلي. تابلت على الكاونتر يتكسر أو ابني ياخده.»

Build for a cheap Android phone (2–3 GB RAM). A tablet is optional and only if the platform gives it free.

**Printed receipt:**

> «مش لازم. الزبون عنده الفاتورة على موبايله.»

A printer is not needed. One optional extra:

> «لو تبعتوا الطلب على الواتس بتاعي كمان، الواد يجهّز منه.»

---

## 6. Deal-breakers and deal-makers

**Deal-breakers (ranked):**
1. His own sticker customer is rerouted to, or ranked below, his competitor.
2. A 20 ج delivery fee on orders his own boy delivers for free.
3. 5% on his own customers with no cap: «طلبية الشهر بـ 75 جنيه عمولة».
4. Money paid weekly instead of next morning.
5. Any penalty or deduction for lateness or rejections.
6. He has to enter items himself.
7. The alert doesn't ring loudly, so he misses orders and gets punished for it.
8. The boy can be pulled into platform orders without the shop's switch.
9. Any hint that the platform will sell groceries itself (Talabat Mart or Breadfast style).

**Deal-makers (ranked). These make him join in week one and tell the shop next door:**
1. **Free for 60 days**, then 1% or 3 ج on his own customers and 5% (capped at 20 ج) on new ones.
2. **He sets and keeps the delivery fee** when his boy delivers.
3. **Next-morning payout** and a nightly WhatsApp statement.
4. Linked customers **always see him first**, and his store page has no competitors.
5. **«دفتر الشكك» in the app.** For customers he approves, a payment option «على الحساب». The platform records it, he carries the risk, and he sees each customer's balance.

   > «ده لوحده يخليني أقول لكل زبون نزّل التطبيق.»

   His best customers are credit customers. If they can't buy on credit through the app, they never move.
6. The field team enters the 300-item template with his son in one evening.
7. **"Reorder last basket" / «طلبيتي المعتادة»** for customers, so the app finally beats the phone call for Om Mohamed.
8. His boy earns from outside orders, and the shop gets 3–5 ج per outside delivery.
9. In writing: «مش هنفتح ماركت ولا مخزن ينافسك في الفيوم».

---

## 7. The pitch that works

**60-second field pitch (Egyptian Arabic):**

> «السلام عليكم يا حاج، أنا مش جاي أبيعلك حاجة، أنا جاي أجيبلك زباين.
> إحنا تطبيق فيومي، مش طلبات. ومش هنفتح ماركت ولا مخزن ننافسك، ده مكتوب في العقد.
> اللي بنعمله: الطلبة والناس اللي معاهمش رقمك يطلبوا منك من الموبايل، والطلب يرن عندك زي المكالمة، تدوس "قبول" وخلاص.
> زبونك القديم؟ تعلّق الستيكر ده، يربطه بيك إنت بس، يطلعله محلك أول واحد، والتوصيل بتاعه إنت اللي تحدده وتاخده، وولدك هو اللي يوصّل.
> فلوسك؟ أول شهرين ببلاش خالص. بعد كده على زبونك إنت 3 جنيه في الطلب، وعلى الزبون الجديد اللي إحنا جايبينه 5% بحد أقصى 20 جنيه. وفلوس الطلبات تنزلك تاني يوم الصبح على فودافون كاش، ورسالة كل ليلة فيها حسابك.
> الأصناف؟ إحنا نقعد مع ابنك ساعة، عندنا 300 صنف جاهزين بالأسعار، هو يعلّم على اللي عندك.
> مفيش غرامات، ومفيش عقد سنة. لو ماعجبكش، تقفل التطبيق في أي وقت.
> نجرب أسبوع؟»

**«عقد بسيط» (one page, what he would sign):**

> **اتفاق شراكة – بقالة السيد**
> 1. **مدة التجربة:** 60 يوم من غير أي عمولة. بعدها يتجدد شهر بشهر، وتقدر توقف في أي وقت برسالة واتساب.
> 2. **العمولة:**
>    - زبون مربوط بكودك وولدك هو اللي وصّل: 3 جنيه في الطلب.
>    - زبون مربوط بكودك وطيار التطبيق وصّل: 2.5%.
>    - زبون جديد من التطبيق أو طلب محوّل ليك: 5%.
>    - **أقصى عمولة في الطلب الواحد 20 جنيه.**
>    - السجاير وكروت الشحن ولبن الأطفال من غير عمولة.
> 3. **التوصيل:** لما ولدك يوصّل، إنت اللي تحدد رسوم التوصيل (من صفر لـ 15 جنيه) وهي ليك بالكامل.
> 4. **الأسعار:** سعر التطبيق = سعر الرف. إنت اللي تحدده وتغيّره وقت ما تحب.
> 5. **الفلوس:** فلوس المحفظة وطلبات طيارين التطبيق تنزلك تاني يوم الساعة 10 الصبح على فودافون كاش أو إنستاباي. العمولة على الكاش اللي ولدك حصّله بتتخصم من اللي لك، أو تدفعها مرة في الأسبوع.
> 6. **زباينك ليك:** الزبون المربوط بكودك محلك يطلعله أول واحد، وطلبه ما يتحوّلش لمحل تاني إلا لو هو وافق بنفسه.
> 7. **ولدك ليك:** ولدك ما ياخدش طلبات بره المحل إلا لو إنت فتحتله الزرار. ولو أخد، المحل ياخد 3 جنيه عن كل توصيلة بره.
> 8. **مفيش غرامات** على التأخير أو الرفض. التأخير بعد ما الطلب يتسلم من المحل مسؤوليتنا.
> 9. **مش هنفتح** ماركت أو مخزن أو نبيع بقالة باسمنا في الفيوم.
> 10. **بياناتك وأرقام زباينك** ما تتعرضش على أي محل تاني.
>
> توقيع صاحب المحل: ……………  توقيع المندوب: ……………

---

## 8. Sidebars

### 8a. د. هاني، neighborhood pharmacy owner

> «الروشتة المتصورة ماشي، بس أنا اللي أقراها وأنا اللي أبعت للزبون السعر يوافق عليه. مش التطبيق يحط أصناف لوحده.»

> «المضاد الحيوي من غير روشتة؟ لا. أدوية الجدول؟ لا تتباع أونلاين خالص ولا تتكتب عندكم.»

> «"استبدل بحاجة شبيهة"؟ في الدوا؟ ده ممكن يموّت حد. يا تكلمني يا تشيله.»

Analysis:
- **Pharmacist quote flow.** The pharmacist turns the prescription photo into a priced cart from his own list. The customer confirms, then dispatch starts.
- **Disable «بديل» for pharmacy items.** Today `missing_policy` is per order, not per store, so it must become per store.
- **Block controlled (جدول) drugs** in the catalog.
- **Cold chain.** Insulin and some vaccines require an insulated bag. The driver app needs a "cold" flag, and these orders can't wait in a 3-shop route.
- **Sealing.** He wants the bag sealed with the invoice stapled outside.
- **Legal worry.** He will ask whether this is legal. The press reports a draft pharmacy-practice law that requires EDA approval for app sales and allows them only through licensed pharmacies. Answer: «إحنا توصيل بس، البيع من صيدليتك المرخصة وفاتورتك». Have that answer checked by a lawyer.
- **Commission.** 5% on medicine he can live with. On baby formula and price-fixed items with tiny margins, he can't.

### 8b. المعلم رجب، koshary and foul shop

> «من 1 لـ 4 الضهر وبعد العشا الدنيا زحمة. مش هقدر أدوس قبول كل طلب. خليها تتقبل لوحدها.»

> «10% على كشري بـ 35 جنيه، ماشي، 3.5 جنيه. بس الزبون هيدفع 20 توصيل على أكلة بـ 35؟ مش هيطلب.»

> «العلبة والكيس والدقة والشطة عليّا بـ 4 جنيه. حطوها في الحساب.»

> «الكشري لو استنى ربع ساعة يعجّن. ابعتلي الطيار وأنا بغرف، مش بعد ما أخلّص.»

Analysis:
- **Auto-accept / rush mode.** A toggle that auto-accepts every order during rush hours, with an auto prep time of 5 minutes.
- **Minimum order and a lower fee.** Set a minimum order (for example 60 ج), or a reduced fee for single-restaurant orders under 2 km. A 20 ج fee on a 35 ج meal kills small orders.
- **Packaging line.** Let the shop add a visible «تغليف 3 ج» charge.
- **Menu modifiers.** صغير/وسط/كبير, زيادة دقة/تقلية/شطة. Without them, every order turns into a phone call.
- **Dispatch timing.** Send the driver at accept time, because prep takes 2 minutes and the food goes soggy if it waits.
- **Reroute.** He welcomes it. Koshary shops are interchangeable, which is exactly where reroute fits. Groceries are not.

---

## 9. Concrete changes, ranked by impact

1. **Delivery fee set by the shop when its own boy delivers** (0–15 ج, kept by the shop). Keep the 20 ج zone fee only for platform drivers.
   - Without this, pillar 1 (the sticker) is negative for both the customer and the shop.
   - Add `own_delivery_fee` to `stores` and a `delivered_by` field (`store` or `platform`) to `order_stores`.

2. **Commission rework for grocery:**
   - Own customer with own boy: flat 3 ج or 1%.
   - Own customer with platform driver: 2.5%.
   - New customer: 5%.
   - **Cap of 20 ج per store per order.**
   - Zero-commission flags on cigarettes, phone-credit cards and infant formula.
   - The founder's "fixed percentage" still holds for new demand, which is where the platform actually adds value.

3. **Reroute rules by category:**
   - Never silently reroute a linked customer; ask the customer instead.
   - Grocery and pharmacy: 4 minutes plus an automated voice call at 60 seconds.
   - Restaurants: keep 2 minutes.
   - Add a «مشغول 20 دقيقة» pause (`stores.paused_until`).

4. **Merchant app = 4 screens**: ringing new order, picking list with «خلصان»/«بديل»/«جاهز» plus handover code, «فلوس النهارده», and «الأصناف» with bulk ±. Requirements: big type, Arabic only, works on a 2 GB Android phone, and the alert rings on silent.

5. **Weight-based items**: a unit (piece or kg), fractional quantities (ربع/نص/كيلو) and a ±10% final-weight adjustment. Today `qty int 1–50` makes cheese, luncheon, loose rice, meat and vegetables impossible to sell correctly.

6. **Next-morning payouts and a nightly WhatsApp statement**, with cash commission netted against wallet balances.

7. **Shop-controlled "boy for hire" switch**, plus a 3–5 ج per outside delivery cut for the shop when the bike is the shop's.

8. **Store page for 1,500 items**: sections, in-store search, shop-front photo, opening hours, and "reorder my usual basket" on the customer side. The current page is a flat list of 5 items.

9. **Linked shop always ranked first** for linked customers, and no competitor tiles on a store page. Today «سوبرماركت النخيل» outranks «بقالة الحاج سيد» at an equal 0.1 km.

10. **«على الحساب» (شكك) payment** for customers the shop approves, recorded by the app with the shop carrying the risk. This is the feature that moves a بقالة's best customers onto the app.

11. **Errand guard.** «هاتلي أي حاجة» lets a driver buy from any shop with zero commission.

    > «طب ما المندوب بيشتري مني كده كده من غير عمولة، أشترك ليه؟»

    Fix: price errands higher (for example 35 ج) so a listed shop is always cheaper for the customer, and send the shops with the most errand orders to the field team as sign-up leads.

12. **Contract promise: no dark store in Fayoum.** It costs nothing, since the founder already decided it.

Sources checked:
- [Talabat Egypt vendor terms](https://www.talabat.com/page/vendor/terms/restaurants/egypt)
- [Menuviel on Talabat commissions](https://blog.menuviel.com/talabat-fees-and-commissions-for-restaurants/)
- [Enterprise on delivery-app commissions in Egypt](https://enterpriseam.com/egypt/2021/10/13/are-restaurant-delivery-apps-a-modern-day-mafia-in-egypt-and-abroad/)
- [Talabat Mart expansion](https://cairoscene.com/Business/Talabat-Mart-Expands-into-Four-New-Egyptian-Cities)
- [Endeavor on Breadfast and the 70% kiosk share](https://egypt.endeavor.org/profiles/breadfast/)
- [Masrawy on the private-sector minimum wage](https://www.masrawy.com/news/news_egypt/details/2026/11/15/3079249/index)
- [Egypt Telegraph on the draft pharmacy law](https://www.egypttelegraph.com/article/162765/)
- [Youm7 on EDA and medicine-selling apps](https://www.youm7.com/5731349)

Margin and wage figures are the persona's estimates, not verified data.
