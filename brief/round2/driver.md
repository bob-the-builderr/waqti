# Round 2: محمود attacks the merged plan

**Baseline from round 1:**
- The koshary job pays about 280 EGP net a day plus a meal (about 7,200 a month).
- Running costs are about 6.5 EGP per order.
- He needs about 400 EGP net a day before he would switch.

---

## 1. Hybrid cash design and the critic's deposit

> «أدفع للمحل عند الاستلام؟ ماشي، ما أنا مع الكشري بدفع وأقبض. بس من فلوس مين؟ "هنسلّفك ٣٠٠ وتردّهم من أول أسبوع"، يعني بعد أسبوع بقت فلوسي أنا اللي لافّة. ودفعت للمحل ١٠٢ والزبون طلع مش موجود؟ مين يرجّعلي؟ وتأمين ١٠٠٠ جنيه من أول أسبوعين؟ ده تلت أو نص اللي هكسبه. إيصال أمانة بس بفلوسي.»

**What works:** paying at the counter keeps his debt small. On a 120 EGP koshary order he pays the shop 102, collects 140, keeps 22, and owes the platform only **16**.

**What breaks:**
1. **The advance is repaid in week 1,** so the float becomes his own money.
2. **Nothing refunds him** if he has paid the shop and the delivery then fails.
3. **Paying "102" needs small notes on both sides,** which adds 1–2 minutes per pickup.
4. **The owed cap has a bug.** A 600 EGP multi-shop cash order, where he pays nothing at pickup, puts him straight over the **400 EGP owed cap**, and cash offers pause in the middle of his shift.
5. **The deposit collects 1,300 of his money to cover a 400 risk.** After week 1 the platform can lose at most the 400 he owes. The critic wants 1,000 deposited on top of the 300 advance he has already repaid.
   - If 3 of 30 riders run off, the loss is about 1,200–2,100 EGP.
   - Deposits would lock up 30,000 EGP of riders' money and kill recruitment.

**Counter-proposal:**

| Item | Number |
|---|---|
| Float | **A 300 EGP عهدة (cash held for the platform) owned by the platform.** It is never repaid from earnings and is returned when he leaves. That's 9,000 EGP for 30 riders. |
| 600 and 1,000 float tiers | **Optional.** He tops up with his own cash for bigger orders and can withdraw it within 24 hours. |
| Paying at the counter | **Round down to the nearest 5 EGP** («ادفع ١٠٠»). The remainder goes into the shop's 23:00 payout. |
| Delivery fails after he paid the shop | **The platform credits him within 1 hour,** using GPS and the call log. Groceries and pharmacy refund him in cash when he returns the goods. |
| Owed cap | **400 EGP, rising to 1,000 after 50 clean orders.** A large cash order never pauses him; it is remitted within 3 hours through «ورّد دلوقتي» (remit now). |
| Night | After 11 pm, pay at the counter only for orders up to 300 EGP, and carry at most 1,500 EGP. |
| Deposit | **None.** At most 200 EGP after day 60, built from 10% of his payouts and refunded within 3 days of leaving. |

---

## 2. The pay formula as adopted: what got lost

> «الـ١٦ والـ٣ والـ٧ موجودين. بس الدايرة ٢ كيلو، يعني الـ٣ جنيه للكيلو عمري ما هشوفها. كل أوردر ١٦، وفي الذروة ٢٠. والضهر ولا ٦ المغرب هقف ساعة على أوردر بـ١٦.»

**What was lost or watered down:**
1. **The approach pay** (+2/km beyond 2 km to the first shop) is gone. It matters once the area grows.
2. **«ألغي واتعوّض» is gone** (after 20 minutes at a shop: cancel and get +10). Waiting is capped at 20 minutes, but he has no way out.
3. **Door waiting** (+1/min after 5 minutes) is gone.
4. **The iftar +6 is gone.** Ramadan 2027 starts around 8 February, inside the launch window. Iftar is the hardest 45 minutes of the year. It needs +6 per order plus dates and water for the rider.
5. **The "no rate cut for 12 months" promise is gone.** That was his main reason to sign up.
6. **Waiting "charged to the shop"** must mean the platform pays him first and recovers it from the shop.
7. **The guarantee conditions are missing.** Write them: online at least 95% of the shift, accepts at least 70% of offers, and 2 weeks' notice before it ends.
8. **Batching** (the critic's 9 EGP for a second drop) isn't in the pay table. He accepts **9 EGP plus 3/km when the drops are more than 0.5 km apart**, shown as one total on the offer card.

**What the 2 km circle does to his pay:**
- Most orders pay 16, or 20 at peak.
- At peak that's about 50 EGP an hour, which is good.
- **Off-peak (12–2, 6–8, 11 pm–1 am) it's 16–20 EGP an hour,** which barely covers fuel. Guarantee those hours or don't open them.

---

## 3. «توصيل المحل» as the default

> «يعني الكشري يوصّله ولد الكشري، والصيدلية ولدها، وأنا آخد اللي فاضل: البعيد والتقيل ووقت الزحمة لما ولد المحل مش ملاحق. ولو فضلت ولد الكشري، هتجيبلي أوردرات أكتر بنفس اليومية، والمعلم ياخد رسوم التوصيل.»

**The numbers:**
- At the day-60 target of 150 orders a day, with 40% delivered by shops' own boys, **about 90 orders a day** are left for the platform fleet.
- That's **3 per rider per day across 30 riders**.
- A full-time rider needs 16–18 a day, so **there's room for about 5 full-time riders, not 30.**
- The fleet becomes an overflow fleet: peaks, far drops, heavy orders.

**Fixes:**
1. **Cap active platform riders at 12–15** until the platform passes 300 orders a day.
2. **The overflow rule:** when the shop taps «الطيار مش موجود» (our rider isn't here), the store card shows the platform fee before the customer orders. The order is never silently given to a platform rider at the shop's 5 EGP fee.
3. **In-app tipping at checkout (5/10/15 EGP), 100% to the shop's boy, paid daily.** The draft dropped his +3 app bonus, so tips are the only own-delivery money that reaches him. Tipping costs the platform nothing.
4. **«مشوار الصبح» (the 7–9 am morning route):** 10 EGP a drop and about 10 drops an hour, so **about 200 EGP before his koshary shift.** It's the best item in the plan for him. **Write down that the full 10 EGP is the rider's.**

**Is there still a job?** Yes, as a **side job**: released hours, the morning route and evening peaks. It is not a full-time living at 150 orders a day.

---

## 4. The guarantee: is it fair now?

> «أحسن بكتير: مش هدفع، والمحل يشيل لو اتأخر. بس الزبون مش شايف التايم ستامب، شايفني أنا. هيدّيني نجمة واحدة عشان الكشري اتأخر.»

**About 80% fair. The gaps:**
1. **Write the thresholds into the driver terms.**
   - Shop late: handover more than 3 minutes past its promised ready time.
   - Dispatch late: more than 4 minutes to assign a rider, or assigning a rider more than 2 km away.
   - Driver late: his riding legs take more than 1.4× the app estimate plus 5 minutes.
2. **The customer's tracking screen shows the shop's delay:** «الطيار مستني المحل من ١٢ دقيقة» (the rider has been waiting at the shop for 12 minutes).
3. **His rating excludes lateness caused by the shop or dispatch.** No bans on ratings alone.
4. **No hidden score.** A late order he caused lowers his offer priority only after a pattern (10 in a month), and he is shown it.

---

## 5. Verdict

> «أسجّل؟ آه، النهارده. أسيب الكشري؟ لأ. ١٥٠ أوردر على ٣٠ طيار يعني ٣ ليا. هشتغل المشوار الصبح، وبالليل في الذروة لو المعلم سابني. اللي يخليني أسيبه حاجة واحدة: يومية ثابتة زي أي شغل محترم، وفوقها على الأوردر.»

**The one change: a «طيار أساسي» (core rider) contract for 8 riders, alongside open sign-up.**

| Item | Number |
|---|---|
| Pay | **5,500 EGP a month fixed (paid weekly) + 14 EGP per order + 7 per extra shop.** Tips are his. This matches Damietta's 2026 ad: 5,500 + 22 per order. |
| Commitment | 6 shifts of 9 hours a week, 4 paid days off a month, accident insurance |
| His month at 16 orders a day | 11,324 gross − 2,700 running costs + about 1,250 tips = **about 9,870 net, +35% over koshary.** He quits. |
| His month at 10 orders a day | About 8,200 net. That's even with koshary, but it's guaranteed, so he still quits. |
| Platform cost | **44,000 EGP a month**, about 52,000 with social insurance or a staffing company. |

**Funding:** the draft's guarantee can cost up to 12 riders × 4 hours × 35 EGP = **1,680 EGP a day, about 50,000 a month.** The same money buys **8 committed full-time riders** instead of 12 part-timers who leave when the guarantee ends. Core riders cost about 26–28 EGP per order against about 22 for freelancers. **That 4–6 EGP premium pays for an on-time promise you can keep.**
