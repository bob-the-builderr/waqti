# Round 2: الحاجة فاطمة retests the fixed app, and reads the new plan

**Method.** I used the built-in browser at phone size (375x812) and clicked by ref. I walked the full journey and placed test order **#9: 349 EGP, cash, 3 shops** (pharmacy, grocery and vegetables). I opened the order page and tried cancel (backed out at the confirm step), «اطلب نفس الطلب تاني» and «محتاج مساعدة؟». I searched «بقاله», «عيش» and «طماطم», linked `SAYED`, and switched «خط كبير» on and then off. Afterwards I emptied the cart and reset the viewport. Screenshots are `round2/elderly-shots/01`–`34`.

> «لأ، المرة دي اتعدلت. فيه "متأكدة؟"، وفيه إلغاء، وبيقولي هيوصل الساعة كام، وبيسألني هدفع بفئة كام عشان الباقي. ده كلام ناس فاهمة.»

---

## 1. What is fixed, and what still scares her

**Fixed. Every one of these worked when I tested it:**
- «أكّد الطلب» opens a sheet: «نبعت الطلب؟ هتدفع 349 جنيه كاش… [أيوه، ابعت الطلب] [لأ، استنى]» (`20`).
- Cancel asks first, in red: «المحلات لسه مأكدتش، فالإلغاء ببلاش» (`25`).
- The delivery fee is inside the cart total (121 → 164 → 349) and split at checkout as «توصيل أول محل 20 + محلين زيادة × 5» (`18`).
- Adding a second shop now shows a toast that states the new fee: «بقالة الحاج سيد هيجي مع نفس المندوب · التوصيل بقى 25 جنيه» (`13`).
- Removing an item offers «رجّعه», and it works (`07`, `08`).
- The phone number field accepts Arabic digits (`19`).
- The cash option asks about change («هتدفع بفئة كام؟») and only offers notes bigger than the total (`18`).
- Search handles «بقاله» with ه (`10`) and finds items, not just shops.
- A 4th shop gets a clear sheet instead of a vanishing toast (`15`).
- The order page has a status tracker (`21`). «اطلب نفس الطلب تاني» refills the cart and goes to the review screen; it doesn't send anything by itself (`24`).
- A wrong shop code shows a red inline error (`28`), and linking ends on a proper success screen (`29`).
- Every back button now says «رجوع», the developer text is gone, and the cart survives a page reload.

**Still scares her, ranked:**

1. **There is still no human.** The store page has no shop phone and the order page has no driver. «محتاج مساعدة؟» opens «الخدمة دي هتشتغل قريب جداً» (`23`).
   > «طب لو المندوب اتأخر أكلم مين؟ "قريب جداً" دي مش رقم تليفون.»
2. **The phone number isn't hers, and it's shown backwards.** Checkout came pre-filled with «010 0000 0001», a number another tester left in this browser (`17`). After she typed ٠١١١٢٢٢٣٣٣٤, the checkout row reads «هنكلمك على 011 1222 3334». The right-to-left text flow puts the groups in reverse visual order, so left to right it shows **«3334 1222 011»** (`20`). «حسابي» shows it correctly.
   > «ده مش رقمي! أنا رقمي بيبدأ بـ011.»
3. **The "guaranteed" time moves.** Checkout said **4:59**, the confirm sheet **5:00**, the order page **5:02**, and reopening checkout **5:03**.
   > «هو مضمون ولا بيزحف؟»
4. **The add button still bites, in a new place** (`06`, `07`). The «أضف» pill is 132px wide. After the first tap, its *right half* becomes the qty number and the **trash can** (the trash covers 103–147px of the old 16–148px pill). The word «أضف» sat right there. A second tap on the word deletes the item. Undo saves it, but the undo toast appears at the **top** of the screen, 400px away from her finger.
5. **«اطلب نفس الطلب تاني» sits above «إلغاء الطلب» on a live order.** Both are the same outline style.
   > «ده هيبعته تاني؟ أنا لسه ما استلمتش الأول!»

   This invites duplicate orders.
6. **Search ranking.** «عيش» lists «ربع فرخة مشوية» first, because its note says «مع عيش» (`11`). «طماطم» lists «بيتزا مارجريتا» above tomatoes (`14`).
7. **The big-text mode breaks the money line** (`32`, `33`). The cart bar splits **«349 / جنيه»** across two lines, «السلة · 7 / حاجات» wraps, and the bar grows over «محلاتك». The «م» of «5:03 م» drops to its own line. The switch is a small toggle hidden in «حسابي».
8. **The most useful sentence in the cart bar is cut off:** «التوصيل 20 جنيه · ضيف محل كمان عل…» (`09`). The full text ends «…بـ5 جنيه بس».
9. **The shop code is still Latin** (placeholder «SAYED»), and «أول توصيل ببلاش» appears nowhere (`27`).
10. **The catalog is unchanged:** «مسكن للصداع» (which brand?), «جم», whole kilos only. The dashed «+» circles in the cart bar look like buttons but aren't.

---

## 2. Her reaction to the new prices (draft section 1)

Here is the draft tariff on **her real baskets** (her flat is in حي الجامعة):

| Her order | Today | Draft | She says |
|---|---|---|---|
| Grocery only (0.1 km), 198 EGP | 20 | **15** | «كويس، أرخص.» |
| Pharmacy only, one painkiller strip, 38 EGP | 20 | 15 + 5 = **20** | «زي ما هو.» |
| Bread only from the bakery (0.4 km), 20 EGP | 20 | 15 + 5 = **20** | «أدفع 20 توصيل على عيش بـ20؟ ده الواد بتاع الفرن بيجيبه ببلاش.» |
| Pharmacy + grocery + vegetables (farthest 1.8 km), 319 EGP | 30 | 20 + 7 + 7 = **34** | «زادوا 4 جنيه. ماشي، بس قولولي من الأول.» |
| Worst case: 3 shops, far, under 100 EGP | 30 | 25 + 7 + 7 **+ 5 = 44** | «مش قالوا أقصى حاجة 39؟» |

> «أنا مالي ومال المسافة؟ أنا عايزة رقم واحد أعرفه قبل ما أختار. لو كاتبلي على المحل "التوصيل لحد بابك 15 جنيه" يبقى خلاص.»

Her verdict on each part:
- **Distance tiers: acceptable, only if the number sits on the store card** before she taps anything (the draft promises this). The current card still shows «التوصيل 20 جنيه» even after another shop changed the trip fee. Show the *incremental* cost instead: «+7 جنيه مع نفس المندوب».
- **+7 per extra shop:**
  > «سبعة عشان يعدّي على الصيدلية؟ معقول، بدل ما أبعت حد.»

  Fine, and it's easy to say.
- **+5 under 100 EGP: this is the one that stings.** It punishes exactly her small pharmacy and bread orders. If it stays, word it as an offer, never a surprise at checkout: «الطلب أقل من 100 جنيه عليه 5 جنيه زيادة. ضيف بـ22 جنيه كمان وتتشال». **Also, the "max 39" in the draft is false:** the small-basket fee stacks on a 3-shop trip (44). Cap the total at 39, or waive the +5 on multi-shop trips.
- **«أول توصيل ببلاش» for linking a shop:**
  > «ده حلو. بس ببلاش بجد؟ ولا يطلعلي الخمسة جنيه بتاعة الطلب الصغير؟»

  It must be totally free: no small-basket fee and no fine print. She can't scan a QR, but she **can type 4 digits** («٤٨٢١»). Show the reward on the code screen: «ضيف محلك، وأول توصيل علينا».
- **The guarantee becoming a clock time with credits:** she likes the clock time. She doesn't understand "credit":
  > «رصيد 10 جنيه بيخلص بعد أسبوعين؟ ده زي كوبونات السوبر ماركت، بتضيع.»

  > «وإيه "لو الدبوس غلط"؟ ابني هو اللي حط العنوان.»

  Apply it automatically to the next order and show it as a line on the next checkout: «خصم التأخير اللي فات: −10 جنيه». Never make her claim it. Make the voiding rule visible *before* the order, in one sentence.

  **And update the copy today:** home and checkout still say «لو اتأخرنا، التوصيل الجاي علينا». Under the new rule, a 12-minute delay pays only 10 EGP.
  > «قالوا التوصيل الجاي ببلاش، وادوني عشرة جنيه!»

  That breaks trust exactly where trust is being sold.
- **«اطلب لأهلك»: her favourite thing in the whole plan.**
  > «لو أحمد يطلبلي من مصر ويدفع، وأنا يجيلي رسالة مين جاي وإمتى… ده اللي هيخليني أستخدمه.»

  Her conditions:
  - she gets a WhatsApp/SMS saying «أحمد طلبلك من الحاج سيد · المندوب محمد · قبل 5:00 · **مدفوع**»;
  - the driver never asks her for money;
  - she can phone the shop to change one item;
  - the proof photo is **of the bag at the door, never of her**.
    > «يصوّرني أنا؟ لأ طبعاً.»
- **«رقم واحد للفيوم» hotline: the bridge from her phone habit.**
  > «رقم أتصل بيه وأقول عايزة إيه؟ ده اللي أنا متعودة عليه.»

  Her conditions:
  - a real person who speaks Egyptian, not «اضغط 1»;
  - the number printed on the shop's sticker and on the bag;
  - the agent reads back the total before sending («هتدفعي 214 جنيه، أبعت؟»);
  - **the same number sits behind «محتاج مساعدة؟»**, which today is a dead «قريب».

---

## 3. The remaining top 10 UI fixes

1. **Add a human contact.** «اتصل بالمحل» (a `tel:` link) on each store page and each shop block in `order/[id].tsx`. A driver card (name, photo, «اتصل») once he's assigned. «محتاج مساعدة؟» dials the hotline; until it exists, it dials the operations phone. No more «قريب» sheets on anything about a live order.
2. **Fix the phone row** (`checkout.tsx`, line 249).
   - Wrap the number in a left-to-right isolate (`'⁦' + formatPhone(phone) + '⁩'`) or `writingDirection: 'ltr'`. The same applies anywhere a phone number appears inside Arabic text.
   - Never pre-fill a number the user didn't enter on this device. The first order starts with an empty field.
3. **Freeze the promise.** Compute `promised_at` once when checkout opens and round it **up** to the next 5 minutes (5:00 rather than 4:59). Send it to `place_order`, have the server return it, and use it on the sheet, the order page and «طلباتي». One time, everywhere.
4. **Give the add button a safe footprint** (`qty-control.tsx`). After the first tap, the whole old pill area (all 132px) becomes **«+»** with the count inside it («+  ١»). The «−»/trash goes *outside* that area (48×48, toward the item name). Put the undo toast just above the cart bar, not at the top, where it also covers «رجوع».
5. **Order page buttons.** Hide «اطلب نفس الطلب تاني» until the order is delivered or cancelled. While the order is live, show «إلغاء الطلب» first, with a red outline.
6. **Search ranking** (`search.tsx`): an exact name match ranks first, then a name that starts with the query, then note matches. When the query is a category word («عيش», «صيدلية»), show shops first. Let shop names wrap to 2 lines instead of «…».
7. **Cart bar** (`cart-pill.tsx`): allow 2 lines for the hint (`numberOfLines={2}`). In big-text mode, put the total on its own row. Make `money()` use a non-breaking space (` جنيه`) so «349 جنيه» never splits; do the same for «5:03 م».
8. **Show the new tariff in the UI.** Store card: «التوصيل لحد بابك 15 جنيه». After the first shop, other stores show «+7 مع نفس المندوب». Show the small-basket line with its «ضيف بـX وتتشال» hint. Show «أقصى توصيل 39 جنيه» once, and enforce it, small-basket fee included.
9. **Link store:** a 4-digit numeric code with `keyboardType="number-pad"`, Arabic digits accepted, placeholder «مثال: ٤٨٢١», and the line «ضيف محلك، وأول توصيل علينا».
10. **Big text discovery:** on first launch, ask «الكلام صغير؟» with two 56px buttons, [كبّره] [كده كويس]. Replace the toggle with a two-choice control («عادي / كبير») that shows a sample line. Keep 48px chips in big mode.

Not UI, but blocking: the catalog needs brand names, «جرام» instead of «جم», and ربع/نص/كيلو (draft section 7, item 7).

---

## 4. Would she now use it instead of calling?

> «للطلبية الكبيرة بتاعة الأسبوع، الصيدلية والحاج سيد والخضري مع واد واحد، آه، هستخدمه. بس للعيش والشريط الواحد هتصل بالفرن، التوصيل أغلى من العيش. ولو مفيش رقم أكلمه وقت الزنقة، هرجع للتليفون أول ما حاجة تتأخر.»

**Verdict: yes for the weekly multi-shop basket, no for single small items.** She is safe *inside* the app now:
- the confirm sheet and cancel remove her fear of the wrong button;
- the clock time and the fee split remove her fear of being overcharged.

The two things that would make her switch completely are both in the plan but not in the app:
- **«اطلب لأهلك»**, where her son pays and she is notified;
- **a real number to call**: the hotline behind «محتاج مساعدة؟», and the shop's phone.

Until both exist, the phone call still owns the moment something goes wrong.
