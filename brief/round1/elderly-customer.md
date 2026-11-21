# Round 1: the elderly customer (الحاجة فاطمة, 64, حي الجامعة)

**Method.** I used the web build at `http://localhost:8081` in the built-in browser at phone size (375x812). I opened home, found the pharmacy from the category grid, and found the grocery by searching. I added items from صيدلية النور, بقالة الحاج سيد and خضار وفاكهة البستان, tried a 4th shop (the bakery), and read the checkout. I placed a real test order (**#7, 429 EGP, cash, 3 shops**), opened «طلباتي», and linked a shop with the code `SAYED`. I also read every screen's source for the exact wording and sizes. The 29 screenshots are in `brief/round1/elderly-shots/` (numbered in walkthrough order). Font sizes below come from the rendered page.

---

## 1. Would she use it instead of calling the grocery?

> «لأ، مش النهارده. الحاج سيد بكلمه من عشرين سنة، بقوله "نص كيلو خيار وعلبة البنادول بتاعتي" وخلاص. هنا مفيش نص كيلو، ومفيش بنادول، ومفيش رقم أكلم حد. وأنا دُست مرتين والحاجة اختفت.»

> «بس لو ابني نزّلهولي، والصيدلية والبقالة والخضري ييجوا مع واد واحد بتلاتين جنيه، وأقدر أكلم المحل من جوه... ساعتها آه، أجرّب.»

**Honest answer: she tries it once if her son installs it, and drops it after the first scare.** The *idea* beats the phone call: three shops in one trip for at most 30 EGP, and "late = next delivery free" are things she cannot get by phone. The *execution* loses to the phone on the four things she cares about most:

1. **Control.** A second tap removes what the first tap added. «اطلب» places the order with no "are you sure", and there's no way to cancel.
2. **A human.** There's no phone number for the shop, she is never asked for her own number, and no driver is shown. «اتصل بيا» calls nobody.
3. **Money clarity.** The store page says التوصيل 20 ج, the cart says 399, and the order button says 429. Nothing explains the 30 until she scrolls to the bottom.
4. **Her real items.** She can't find "بنادول", "رز" or "نص كيلو". Search fails on «بقاله» spelled with ه.

---

## 2. Walkthrough, screen by screen

### Home (`01-home-top`, `02-home-bottom`)
- **The first thing she sees is the big saffron «هاتلي أي حاجة» card, with a black «اطلب دلوقتي» button.** It's the loudest thing on the screen, so she taps it. A dark toast says «"هاتلي أي حاجة" هتتبني في خطوة جاية» for 2.4 seconds and disappears (`03`).
  > «يعني إيه هتتبني؟ هو أنا دُست غلط؟»
- The description line «المندوب يشتري ويصوّرلك الفاتورة» is 13.5px. She likes it but has to bring the phone close to read it.
- «محلاتك / امسح كود محلك عشان يظهر هنا» is 12.5px in gray. **She reads «امسح» as "erase"**, not "scan".
  > «أمسح إيه؟ أنا مش عايزة أمسح حاجة.»
- The category grid is clear: «صيدليات» and «سوبرماركت وبقالة» are found immediately. This part works.
- She reads the two banners, «مشوار واحد لحد 3 محلات…» and «نفس سعر المحل، ووقت مضمون…» (13.5px). She understands "مندوب واحد" but not "مشوار" as a pricing unit. **«20 ج + 5 ج لكل محل زيادة» reads like arithmetic homework.**
- The «قريب منك» rail scrolls sideways. She never discovers the cards past the edge.
- Shops are shown as a single letter in a colored square (س, ن, ف). **She recognises her grocer by his name and his shop front, not by «س».**

### Category → pharmacy (`04`, `05`)
- The meta line «★ 4.7  20–30 دقيقة  0.9 كم» is 12.5px. To her it's three numbers jammed together.
- The green «روشتة» badge is 11.5px. She thinks it means "prescription only" and nearly skips the pharmacy.
- The pharmacy page shows the stats boxes «التقييم / الوقت / التوصيل» (labels 12px on beige, about 5:1 contrast). Then comes the card «عندك روشتة؟» with a **"+" icon**, so she thinks it's an add button. Tapping it gives another "هيتبني" toast (`06`).
- The list is titled «منتجات من غير روشتة»: «مسكن للصداع / شريط / 38 ج».
  > «مسكن للصداع إيه؟ أنا باخد بنادول بس. ده ممكن يبقى أي حاجة.»
- **The worst moment of the test (`07`, `08`).** She taps "+" on «مسكن للصداع». The button turns into «− 1 +», and **the "−" now sits exactly where the "+" was** (x≈41). She wants two strips, so she taps the same spot again, and the item disappears. The cart bar disappears too. Nothing says what happened.
  > «يا نهار أبيض! راح فين؟ أنا بوظت حاجة؟»

  Her fear of "pressing the wrong button" is confirmed in her first 30 seconds.
- She adds 2 strips and 1 masks. The bar says **«السلة · 3 أصناف»** (`09`).
  > «3 أصناف؟ أنا طالبة حاجتين بس.»

  The app counts pieces, but in Egyptian usage «صنف» means a *kind* of item.

### Search → grocery (`11`–`15`)
- She taps the home search box. **It isn't a box: it opens another page** («كل المحلات»), and she has to tap again before the keyboard appears.
- She types «بقاله» (with ه, the way most people type on Android): **«مفيش محل بالاسم ده»** (`12`). «رز» also returns nothing. The only suggested action is «اطلبه من هاتلي أي حاجة», the same dead button as on home.
- «سيد» works. The grocery has 5 items with no brands: «شاي 250 جم» (which tea? and «جم» is an abbreviation she wouldn't use), «بيض 10 بيضات» (she buys a طبق).
- Adding sugar shows the toast **«ضفنا بقالة الحاج سيد لنفس المشوار»** (`14`).
  > «ضفنا؟ يعني دفعت زيادة؟»

  The toast never says the delivery fee just went from 20 to 25.
- The floating cart bar covers the egg price (`15`), and on home it covers the «سوبرماركت وبقالة» tile label (`10`).

### Vegetables (`16`, `17`)
- «أسعار النهارده من المحل» is a great trust line, but it's 12px gray.
- Tomatoes can only be bought by the whole kilo. **There's no half kilo.**
  > «نص كيلو خيار، مش كيلو. مين ياكل كيلو خيار؟»

### A 4th shop: the bakery (`18`)
- She tries «عيش بلدي» and gets a toast, **«المشوار الواحد لحد 3 محلات»**, for 2.4 seconds. Bread is the one thing every house needs daily, and she doesn't know what to do now.
  > «طب والعيش؟ الكلام اختفى قبل ما أقراه.»

### Checkout (`19`–`22`)
- The header says «تأكيد الطلب» ("confirm the order"). The big teal **«اطلب · 429 ج»** button is visible from the first second, *before* she has seen the payment choice, the missing-item choice or the fee breakdown (`19`).
  > «429؟ ده في السلة كان 399! أنا كنت عايزة أراجع بس، لو دُست هنا هيطلب على طول؟»

  It does. One tap, no confirmation.
- She can't change a quantity or remove anything here, so she has to go back into each shop.
- «هيوصلك خلال 50 دقيقة، مضمون» is clear. She'd rather see a clock time ("قبل الساعة 8:40").
- **«لو صنف مش موجود:»** shows three chips. «اتصل بيا» is right for her, but she's never asked for her number:
  > «هيتصلوا بيا إزاي وهما ما خدوش رقمي؟»

  «هات أقرب بديل» worries her:
  > «أقرب بديل بكام؟ يجيبلي حاجة أغلى؟»
- **The payment choices.** «كاش عند الاستلام» is fine. For «إنستاباي أو محفظة للمندوب عند الباب»:
  > «محفظة؟ ما أنا هدفع من محفظتي! وإنستاباي ده إيه؟»

  She reads «محفظة» as her purse.
- The summary: «قيمة الطلب 399 / التوصيل · مشوار واحد من 3 محلات 30 / الإجمالي 429». **The 30 isn't split into 20+5+5**, so she thinks "they said 20".
- The key trust sentence, «من غير رسوم خدمة ولا تغليف. الأسعار هي أسعار المحل نفسه», is the smallest, grayest text on the screen (12.5px, muted).
- I simulated Android's large font (130%) (`22`): the layout holds and the chips wrap. Good: **don't add `maxFontSizeMultiplier` caps.**
- There's no change question («هتدفعي بكام؟»). Her real worry is "will the boy have change for 500?"

### Order placed (`23`)
- «طلبك اتسجّل · رقم 7 / هتدفع 429 ج كاش عند الاستلام…» reads well. Then comes the box: **«الطلب اتسجّل في قاعدة البيانات… المحلات والمندوبين هيستلموه لما نبني تطبيقاتهم»**.
  > «قاعدة بيانات؟ يعني الطلب مش هيوصل؟»

  This is fine for a prototype, but it's fatal in front of any real user.
- **There's no «إلغاء الطلب»**, no shop phone, and no driver.

### طلباتي (`24`)
- The card shows «صيدلية النور + بقالة الحاج سيد + خضار…», then «رقم 7», then «الخميس ٧:٤٩ ص», with the status «اتسجّل ومستني المحل» and «429 ج».
- **The digits are mixed:** the time is in Arabic-Indic (٧:٤٩) but the price and order number are Latin (429, 7).
- The card can't be tapped: she can't see what she ordered, can't cancel, can't call, and can't reorder.
- Side note: orders #5 and #6, placed by other testers in the same browser profile, showed up as "hers". An anonymous session belongs to the device, so a son ordering from Cairo would never see her orders, and she wouldn't see his.

### Link a shop (`25`–`28`)
- «اكتب الكود المطبوع على ستيكر المحل» with the placeholder «مثال: SAYED». **Her keyboard is Arabic.** She types «سيد» (`26`). A toast says «الكود ده مش لأي محل عندنا» for 2.4s; I could only catch it with a DOM observer, so she will miss it too.
- With Latin «sayed» (lowercase works), it links: the toast «بقالة الحاج سيد اتضاف لمحلاتك» appears and the shop shows on home under **«المحلات اللي مسحت الكود بتاعها»**. The store page badge says «من محلاتك · مسحت الكود بتاعه» (`28`).
  > «أنا ما مسحتش حاجة!»
- **Nothing tells her why she'd link a shop**, or what she gets from it.

---

## 3. Friction list, ranked by severity

| # | Sev | Screen / element | Problem | Exact fix |
|---|---|---|---|---|
| 1 | **Blocker** | `QtyControl` (store pages) | After the first tap, "−" takes the place of "+". A second tap at the same spot removes the item, with no feedback. | Keep "+" fixed under the finger: JSX order `[−][qty][+]` so "+" stays the leftmost (end) element in RTL. Initial button: a pill **«+ أضف»**, 96×48px, 16px text. Buttons 48×48 min with 12px between them. At qty 1, "−" becomes a trash icon, and removing shows an undo toast «اتشال مسكن للصداع · رجّعه» for 6s. |
| 2 | **Blocker** | Checkout «اطلب · 429 ج» | One tap places the order. There's no review step and no cancel. | Label **«أكّد الطلب · 429 جنيه»**. On tap, open a bottom sheet: «هتدفع **429 جنيه** كاش للمندوب. هيوصلك **قبل الساعة 8:40**.» with buttons **[أيوه، ابعت الطلب]** (56px, teal) and **[لأ، استنى]** (56px, outline). After placing, show **«إلغاء الطلب»** until the first shop accepts (≤2 min). |
| 3 | **Blocker** | Checkout / whole app | Her phone number is never asked for, so «اتصل بيا» is impossible. | Before the first order: «رقم موبايلك عشان المندوب والمحل يكلموك» with a numeric field (18px). Show it in checkout: «هنكلمك على 0100 123 4567 · تغيير». |
| 4 | **Blocker** | order-placed note, hero toasts, Rx toast, account, `friendlyError` | Developer text: «قاعدة البيانات», «هتتبني في خطوة جاية», «Supabase». | Delete it. Hide the «هاتلي أي حاجة» card and the Rx card until they work (or let them open a "قريب جداً" sheet with a WhatsApp number). |
| 5 | Major | Cart pill / store «التوصيل 20 ج» / add toast | 399 becomes 429 with no explanation, and adding a shop says nothing about the fee. | Pill: **«السلة · 3 حاجات · 429 جنيه شامل التوصيل»**. Toast when a 2nd/3rd shop is added: **«الحاج سيد هيجي مع نفس المندوب · التوصيل بقى 25 جنيه بدل 20»**. |
| 6 | Major | Checkout summary | The 30 is not split. | Rows: «توصيل أول محل 20 جنيه» / «محلين زيادة × 5 جنيه 10 جنيه» / **«الإجمالي 429 جنيه» at 22px bold**. |
| 7 | Major | Search (`stores.tsx`) | No Arabic normalisation, no item search, home box isn't a real field. | Normalise ة/ه, ى/ي, أ/إ/آ/ا and strip tashkeel. Search product names too («رز» → shops that sell rice). `autoFocus` when opened from home. |
| 8 | Major | 4th shop | A 2.4s toast and a dead end. | A modal: «المندوب بيلم من 3 محلات بس في المشوار الواحد. تحب تبعت الطلب ده دلوقتي، والعيش في طلب تاني؟» with **[ابعت اللي في السلة الأول]** **[شيل محل من السلة]**. |
| 9 | Major | Toasts (`toast.ts`, `ui.tsx`) | 2.4s at 14px. She can't read them. | 5s minimum, 16px, near the top. Errors shown **inline under the field**, red `#B42318`, 15px, never only in a toast. |
| 10 | Major | Link store | Latin code on an Arabic keyboard, the «مسحت» wording, no stated benefit. | Numeric codes («كود المحل: 4821»), `keyboardType="number-pad"`, and convert ٤٨٢١ to 4821. Title «اكتب الرقم اللي على ورقة المحل». Benefit line: «محلك هيفضل أول حاجة قدامك، وصاحب المحل يعرف إن الطلب منك». |
| 11 | Major | Type sizes (`txt.tsx`, all screens) | 12–13.5px used for meta, stats, badges, fine print and tab labels. Muted `#5E6A66` gives about 5:1 on sand/beige. | Minimum **15px** for anything she must read, **14px** absolute floor. Prices 17px/600, totals 20–22px. Muted text becomes `#3F4A47` (about 9:1 on white). Tab labels 12px → 14px. Badge 11.5px → 13px. |
| 12 | Major | Checkout lines | Can't edit quantities. | A stepper on every line plus «شيل» per line. |
| 13 | Major | Cart (`cart.ts`) | The cart lives only in memory. A WhatsApp call or Android killing the app wipes her list. | Persist it with zustand `persist` + AsyncStorage. |
| 14 | Major | طلباتي | Cards are dead, there's no item list, digits are mixed. | Tappable order detail: items, «هيوصل قبل 8:40», **«اتصل بالمحل»**, «إلغاء» (while `placed`), **«اطلب نفس الطلب تاني»**. One digit system everywhere. |
| 15 | Major | Catalog | Generic names, no half kilo. | Brand in the name («بنادول 500 · شريط»). A 0.5 step for veg/meat with «نص كيلو / كيلو / كيلو ونص». |
| 16 | Minor | «لو صنف مش موجود» chips | 40px tall, and «أقرب بديل» sounds open-ended. | 48px tall. Wording in section 6. |
| 17 | Minor | Rx card | "+" icon looks like add-to-cart. | A camera icon plus a «صوّر» button. |
| 18 | Minor | Cart pill overlap | Covers the egg price and a category label. | Add bottom padding of pill height + 24 (≈ 104), and hide the pill while the keyboard is open. |
| 19 | Minor | Shop identity | A letter avatar, no address, no phone. | Shop front photo (taken by the onboarding team), «شارع … جنب …», **«اتصل بالمحل»** button. |
| 20 | Minor | Header back | A bare 24px chevron. | Chevron plus the word **«رجوع»** (15px). |

---

## 4. Trust and money

| Promise | Does she get it? | What makes it safe for her |
|---|---|---|
| Delivery 20 EGP | Yes, on the store page. | Show it the same way everywhere. Don't show 20 on the store and 30 at checkout. |
| +5 per extra shop, max 30 | **No.** "مشوار" means nothing to her as a price. Only the home banner explains it, and that sounds like a formula. | Say it as a sentence at the moment it happens: «التوصيل بقى 25 جنيه بدل 20». At checkout, split it 20 + 5 + 5. Add «أقصى حاجة 30 جنيه» once. |
| Guaranteed time, "late = next delivery free" | Half. She gets «ببلاش» but thinks in clock time, and asks «وأنا أطالب بيها إزاي؟». | «هيوصلك قبل الساعة 8:40. لو اتأخر، التوصيل الجاي علينا، **من غير ما تكلمي حد**». In طلباتي, show «طلبك الجاي توصيله مجاني» as a saffron badge when it applies. |
| Missing-item choice | Yes, she likes «اتصل بيا». It's broken without a phone number. | Number captured (fix 3). The substitute choice should promise a price cap («بنفس السعر أو أقل»). |
| Cash vs wallet | Cash is clear. **"محفظة" is misread as her purse**, and «إنستاباي» is unknown. | «كاش للمندوب لما يوصل» plus a change question «هتدفع بكام؟ [المبلغ مظبوط] [200] [500]». Rename the wallet option (section 6). Say once, near the payment choice: «مش هتدفع أي حاجة قبل ما الطلب يوصل». **This line kills her biggest fear: paying online.** |
| "Same price as in-store" | She sees it but doesn't believe it. It's in 12.5px gray. | «نفس سعر الرف في المحل بالظبط» at 15px. A printed receipt from the shop in the bag, and in-app: «الفاتورة من المحل» photo per order (the errand already promises this, so make it universal). |

**What would make her feel safe, in order:**
1. A **«اتصل بالمحل»** button with the shop's real number on the store page and in the order.
2. **Driver name, photo and phone** once assigned, plus «ده نفس مندوب الحاج سيد» when it's the shop's own delivery boy (pillar 2 is a trust weapon; show it).
3. **Cancel within 2 minutes.**
4. **Clock-time arrival.**
5. A **receipt photo**.

---

## 5. Things that would win her (ranked)

1. **«اطلب لماما»: the son in Cairo orders for her address.** He builds the basket, picks "pay cash at the door" or pays from his own wallet, and **she gets a WhatsApp/SMS with the driver's name and arrival time**. This is how she actually starts: her son is the installer and the first customer.
2. **«اطلب نفس الطلب تاني»**: her weekly list (sugar, oil, eggs, tomatoes, her pills) is the same every week. One button from طلباتي, then the confirmation sheet. This beats dictating the list on the phone.
3. **«اتصل بالمحل» / the shop calls her**: the human safety net. With it she forgives everything else.
4. **«صوّر علبة الدوا»**, inside the existing prescription exception: she photographs the empty box of her blood-pressure pills, and the pharmacy replies with the price. This fits the founder's rule (pharmacy only) and is the single best pharmacy feature for 60+ customers.
5. **Big-text mode** in حسابي («خط كبير»: everything ×1.25, 56px buttons), *and* respect Android's system font size (it already roughly works; keep it).
6. **Voice note for directions only** («سجّل للمندوب إزاي يوصل»), attached to the address. This doesn't break the "no free-text orders" rule, and «الدور التالت، اضرب الجرس مرتين» is exactly what she'd say.
7. **Half-kilo steps and brand names**: she orders what she actually uses.
8. **Arrival by clock time plus the automatic free next delivery**: a promise she can check.

---

## 6. Wording

| Current | Problem | Replace with |
|---|---|---|
| امسح كود محلك عشان يظهر هنا | «امسح» = erase | عندك كود من محلك؟ ضيفه وهيفضل قدامك هنا |
| المحلات اللي مسحت الكود بتاعها / من محلاتك · مسحت الكود بتاعه | same | المحلات اللي بتتعامل معاها / من محلاتك |
| كود محل (card) | vague | ضيف محلك |
| اكتب الكود المطبوع على ستيكر المحل | Latin code, «ستيكر» | اكتب الرقم المكتوب على ورقة المحل |
| ابحث عن محل بالاسم | shops only | دوّر على محل أو حاجة (رز، بنادول…) |
| مشوار واحد لحد 3 محلات. مندوب واحد يلم طلبك، والتوصيل 20 ج + 5 ج لكل محل زيادة. | formula | مندوب واحد يجيبلك من 3 محلات. التوصيل 20 جنيه، وكل محل زيادة بـ5 جنيه بس. |
| نفس سعر المحل، ووقت مضمون. لو اتأخرنا، التوصيل الجاي ببلاش. | fine but vague | نفس سعر الرف في المحل بالظبط. ولو اتأخرنا عن الميعاد، التوصيل الجاي علينا. |
| ضفنا X لنفس المشوار | hides the fee | X هيجي مع نفس المندوب · التوصيل بقى 25 جنيه |
| المشوار الواحد لحد 3 محلات | dead end | (modal in section 3, #8) |
| السلة · 3 أصناف من محل واحد | «صنف» ≠ piece | السلة · 3 حاجات · 121 جنيه شامل التوصيل |
| ج (everywhere) | abbreviation | جنيه |
| جم | abbreviation | جرام |
| منتجات من غير روشتة | stiff | حاجات من الصيدلية من غير روشتة |
| روشتة (badge) | reads "prescription only" | بتقبل صورة الروشتة |
| عندك روشتة؟ صوّرها والصيدلية ترد عليك… | | عندك روشتة أو علبة دوا فاضية؟ صوّرها والصيدلية تكلمك بالسعر قبل ما تبعت |
| الوقت 15–25 دقيقة (stat) | label too terse | بيوصل في 15–25 دقيقة |
| الأعلى تقييماً / الأسرع توصيلاً | MSA tanween | الأحسن تقييم / الأسرع |
| تأكيد الطلب (checkout header) | it isn't a confirmation | مراجعة الطلب |
| اطلب | too final, too short | أكّد الطلب · 429 جنيه |
| لو صنف مش موجود: | | لو حاجة مش موجودة في المحل: |
| اتصل بيا / هات أقرب بديل / شيله من الطلب | «بديل» open-ended | كلّموني الأول / هاتوا زيّها بنفس السعر أو أقل / شيلوها من الحساب |
| كاش عند الاستلام | fine | كاش للمندوب لما يوصل |
| إنستاباي أو محفظة للمندوب عند الباب | «محفظة» = purse | تحويل من الموبايل للمندوب (فودافون كاش أو إنستاباي) |
| قيمة الطلب | accounting term | حساب الحاجات |
| التوصيل · مشوار واحد من 3 محلات | no split | التوصيل (3 محلات: 20 + 5 + 5) |
| طلبك اتسجّل | cold | تمام، طلبك وصل للمحلات |
| …والوصول خلال 50 دقيقة مضمون | minutes, not time | هيوصلك قبل الساعة 8:40 |
| الطلب اتسجّل في قاعدة البيانات… | dev text | لو عايز تلغي أو تغيّر حاجة، دوس «إلغاء الطلب» في خلال دقيقتين |
| اتسجّل ومستني المحل | | مستنيين المحل يأكّد |
| «هتتبني في خطوة جاية» / «Supabase» / «ربط التطبيق بقاعدة البيانات» | dev text | remove; hide the unfinished feature |
| الكود ده مش لأي محل عندنا | blames her, no help | الرقم ده مش مظبوط. بص على الورقة اللي في المحل وجرّب تاني (inline, red) |

**Digits.** Pick one system. Today the time is ٧:٤٩ and the price is 429. The easy fix is to format dates with `ar-EG-u-nu-latn`.

---

## 7. Top 10 UI fixes for the developers (ordered)

1. **`components/qty-control.tsx`**: reorder the stepper children to `[−][qty][+]` so "+" never moves. The initial state becomes a «+ أضف» pill (min 96×48, text 16px). Steps are 48×48 with a 12px gap. At qty 1 the minus becomes a trash icon. `state/cart.ts` `remove()` triggers an undo toast (6s) when a line hits 0.
2. **`app/checkout.tsx`**: change the `PrimaryButton` label to «أكّد الطلب»/«{total} جنيه» and open a confirm bottom sheet before `order.mutate`. Add steppers per line. Total row 22px. Split the delivery fee into base + extras. Payment and missing-item wording from section 6. Add a "change for" chip row. Make the fine print 15px in `#3F4A47`.
3. **Phone number before the first order**: a new field/screen. `data/api.ts` `placeOrder` sends `p_phone`, and checkout shows it with «تغيير». Without it, «اتصل بيا» is a lie.
4. **Strip developer copy and hide unfinished features**: `order-placed.tsx` (the note box), `(tabs)/index.tsx` (hero toast, address toast), `store/[id].tsx` (Rx toast), `(tabs)/stores.tsx` (empty-state button), `(tabs)/account.tsx`, `data/api.ts` `friendlyError` (the Supabase string).
5. **Fee transparency**: `components/cart-pill.tsx` shows the total including `deliveryFee(groups.length, zone)` with «شامل التوصيل». In `store/[id].tsx` `onAdd`, the `'new-store'` toast states the new fee. `lib/pricing.ts` `money()` returns `${n} جنيه`, and `itemsWord()` uses «حاجة/حاجتين/حاجات».
6. **Type and contrast floor**: in `components/txt.tsx`, clamp `size` to ≥14 (log a warning under 15). In `theme.ts`, set `muted` to `#3F4A47`. Tab labels in `(tabs)/_layout.tsx` 12→14. `Badge` 11.5→13, `Chip` height 40→48 with 15px text, `Stat` labels 12→14. Never set `maxFontSizeMultiplier` below 1.5.
7. **Toasts and errors**: `state/toast.ts` timeout 2400→5000. `ui.tsx` toast text 16px. Errors in `link-store.tsx` become inline under the input. The `'store-limit'` result in `store/[id].tsx` opens a modal with two actions instead of a toast.
8. **Search**: in `(tabs)/stores.tsx`, add a `normalizeArabic()` helper (ة→ه, ى→ي, أإآ→ا, strip harakat) applied to both query and names. Match product names via a products query and show «بيبيعوا: رز» under the shop. `autoFocus` when pushed from the home search.
9. **`(tabs)/orders.tsx`**: cards push a new `order/[id].tsx` with items, a clock-time ETA (`placed_at + guaranteed_minutes`), «اتصل بالمحل», «إلغاء الطلب» (status `placed`), and «اطلب نفس الطلب تاني» (re-fills the cart, then goes to checkout). Use one numeral system in `placedAtText`.
10. **`app/link-store.tsx`, codes, and wording**: numeric codes, `keyboardType="number-pad"`, Arabic-Indic digits converted to Latin before `link_store`, the benefit sentence, and the «مسحت» wording replaced in `index.tsx` and `store/[id].tsx`. Also persist the cart (`state/cart.ts`, zustand `persist` + AsyncStorage) so a phone call mid-order doesn't wipe her list.

> «لو الزرار ما يتحركش من تحت صباعي، وأشوف هدفع كام قبل ما أطلب، وألاقي رقم الحاج سيد، يبقى خلاص، مش هكلمه تاني غير عشان أسلّم عليه.»
