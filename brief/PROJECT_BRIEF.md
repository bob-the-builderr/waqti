# Project brief: a delivery app for Fayoum, Egypt

Read this whole file before you start. It is the shared context for every reviewer on the team.

## 1. The idea in one paragraph

A client from Fayoum (an Egyptian governorate about 100 km south-west of Cairo; Fayoum city is the capital) wants a mobile app for iOS and Android that is "like Talabat, but for everything except clothes". The launch area is Fayoum city only; the other districts (markaz) of the governorate come later. The person building it is an Egyptian founder who writes in Egyptian Arabic. He wants **the strongest delivery app in this market**, and he pushes back hard on generic or weak ideas.

## 2. The market today

- **Talabat's Egypt city list had 21 cities in Nov 2026, and Fayoum was not one of them.** Rabbit (quick commerce) covers Greater Cairo and Giza only. Breadfast, Instashop, Mrsool and similar apps either don't serve Fayoum or are thin there. Verify this yourself before you rely on it.
- **How Fayoum people order today:** they phone or WhatsApp a shop they know, and the shop's own delivery boy brings the order, usually on a motorbike or bicycle. Delivery is cheap or free, and the shop owner knows the customer personally. **The real competitor is that phone call, not another app.**
- Customers tend to have lower incomes than in Cairo, are very price sensitive and mostly pay cash. Many are older people, and phone literacy is mixed. Most shops are small independent ones: groceries (بقالة/سوبر ماركت), pharmacies, koshary and foul shops, bakeries, butchers, and vegetable sellers.

## 3. Decisions the founder has already made (don't reopen these unless you have a very strong reason)

1. **A pure platform, like Talabat.** No dark store and no stock of our own. The founder rejected the dark-store option explicitly.
2. **Everything except clothes:** restaurants, groceries and supermarkets, pharmacies, vegetables and fruit, meat and poultry, bakeries, and later more.
3. **Shops never photograph or upload their products.** Every shop is a list of items with prices; photos are optional and come from a shared catalog.
4. **No free-text "write your order" for shops.** The founder says it causes too many problems. Only two exceptions are kept:
   - **"صوّر الروشتة"** (photograph your prescription), for pharmacies only.
   - **"هاتلي أي حاجة"** ("get me anything"), an errand where a driver buys something from anywhere.
5. **Open driver registration, like Talabat.** Anyone can sign up as a driver and choose a bicycle, a scooter or a motorcycle.
6. **The customer home screen** shows store categories, plus a separate page listing all stores by name, for people who want one particular shop.
7. **Tech:** Expo (React Native) and Supabase. The founder builds step by step with the assistant. Testing is done through a web link, then an APK with EAS Update, never Expo Go.

## 4. The strategy: "beat the phone call" (the 5 pillars)

The plan is to win by doing things a phone call can't. These are the five pillars:

1. **Store referral code.** Each shop gets a sticker with a code or QR. A customer who links the shop pays nothing extra, and the shop pays only **half commission** on orders from customers it brought in. This turns shops into our marketing channel instead of our enemy.
2. **The shop's own delivery boy joins our driver app.** The shop keeps its boy, and he can also take platform orders when he's free. We get drivers from day one, and the shop gets tracking and fewer phone calls.
3. **Auto-reroute.** If a shop doesn't accept an order within 2 minutes, the system offers it to the nearest similar shop, so the customer never waits on a shop that didn't pick up.
4. **One trip for up to 3 shops.** Pharmacy, grocery and bakery come in one delivery. The delivery fee is **20 EGP base plus 5 EGP for each extra shop**, so the most it can be is 30 EGP. A phone call can't do this.
5. **Guaranteed time.** Every order shows a promised time. If it's late, the next delivery is free.
   - The promised time = the slowest shop's max ETA + 5 minutes + 5 minutes for each extra shop.

## 5. Money

- **Commission per order, set by category** (taken from the shop's subtotal, never added on top for the customer):

  | Category | Commission |
  |---|---|
  | Restaurants | 10% |
  | Supermarket / grocery | 5% |
  | Pharmacy | 5% |
  | Vegetables and fruit | 7% |
  | Meat and poultry | 7% |
  | Bakery | 8% |

  The commission is halved when the customer came in through that shop's code.
- **Delivery fee:** 20 EGP base and +5 per extra shop, set per zone in the database. There's no service fee at the moment (the `service_fee` column is 0).
- **Goal stated by the founder:** "a fixed percentage from every order, without the customer feeling that ordering through the app is expensive."
- **Payment:** cash on delivery, or a wallet (mobile money). No cards yet.
- **When an item is missing, the customer chooses:** call me, substitute with something similar, or remove it.

## 6. Product catalog onboarding (the founder's biggest worry: "who uploads all the items?")

The current answer has these parts:

- One shared master catalog, plus a template for each shop type (for example, a typical grocery's 300 common items with photos).
- Barcode scan or shelf photo to add items.
- AI that turns a photo of a menu into an item list.
- A field onboarding team that sits with each shop the first time.
- Daily prices (vegetables, meat) updated by a WhatsApp photo or voice note, which we then apply.

## 7. What's built so far (customer app)

The code is in `C:\Users\MA\Desktop\fayoum-delivery\apps\customer` (Expo SDK 58, expo-router in `src/app`, RTL Arabic, Alexandria + Readex Pro fonts).

**Placeholder look:** the name «توصيل الفيوم» with teal `#0E6B66` and saffron `#F2B544` on sand `#FAF6EF`. This is temporary until the brand is chosen.

**Screens** (the web dev server runs at `http://localhost:8081`):

| Route | Screen |
|---|---|
| `/` | Home: address, search, "هاتلي أي حاجة" errand card, «محلاتك» (linked shops + "add a shop code" card), category grid, banners, «قريب منك» list |
| `/stores` | All stores by name, with search and category chips |
| `/category/rest` | One category (other ids: `market`, `pharm`, `veg`, `meat`, `bakery`), with sort chips |
| `/store/b884ffe4-321d-4981-3a93-4af4b06d115f` | A pharmacy store page (has the prescription-photo card) |
| `/store/944cac9b-2aef-5ce9-b3ca-fc6c55d5b65d` | A koshary restaurant store page |
| `/store/fbaf79fe-6d6a-a607-d1ac-e7e8a06228da` | A grocery store page |
| `/store/997ee7be-5cd9-5156-8e0c-43ee2e2abc86` | A vegetable store page (daily prices) |
| `/checkout` | The multi-shop cart: groups per shop, guarantee banner, missing-item choice, payment, place order. It's empty unless items were added in the same browser session. |
| `/orders` | «طلباتي», my orders |
| `/link-store` | Type a shop code (e.g. `SAYED`) to link that shop |
| `/account` | A placeholder |

**Backend:** Supabase project `wtzxosrsunyqxhzlqosi`. It holds the tables categories, zones, stores, products, orders, order_stores and order_items, plus customer_stores. Orders can only be written through the `place_order` RPC, which prices everything on the server, and shops are linked through the `link_store` RPC. Sign-in is anonymous for now; phone OTP comes later. There are 13 fictional shops and 48 products as seed data.

**Next build steps the founder agreed to:**
3. Merchant app.
4. Driver app.
5. Dispatch (own driver, auto-reroute, multi-shop trip, guarantee).
6. Prescription and errand.
7. Admin web.
8. APK testing, then the stores.

### How to screenshot the app (headless Chrome, already installed)

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="<a fresh temp dir of yours>" --force-device-scale-factor=1 --virtual-time-budget=15000 \
  --window-size=390,844 --screenshot="<out.png>" "http://localhost:8081/<route>"
```

- For a taller capture of a long page, use `--window-size=390,2400`.
- Open the PNG with your Read tool to look at it.
- Don't start or stop the dev server. It's already running and shared.

## 8. Brand history (identity is still open)

- **The founder asked for** its own identity, distinctive colors, and a strong, attractive name that says "this app is powerful".
- **The horse logo idea is dropped completely.** He first asked for a horse carrying a delivery box, then abandoned it. Don't propose horses.
- **The name style he wants:** "عربي بروح عالمية", meaning an Arabic word that feels like a global company. His reference points are Careem, Halan, Fawry and Khazna: a short real Arabic word, written cleanly in Latin letters.
- **Names he rejected as weak:** أدهم، جواد، سبّاق، عنتر، حاضر، دلوقتي، ماتور، عزوة، أوج، عزم.
- **Latest shortlist, not answered yet:** لحظة (Lahza)، زِمام (Zimam)، رَواج (Rawaj)، عَمار (Amar).
- **Names already used by delivery or transport businesses in Egypt or the region (avoid):**

  | Name | Used by |
  |---|---|
  | مشوار | Meshwar rides, Egypt |
  | سكة | Yalla Fel Sekka; Sekka transport |
  | طيار | Tayar / Tayary |
  | صاروخ | Sarookh, KSA |
  | همة | Himma |
  | وفرة | Wafra, Egypt |
  | وصلة / وصلّي | Wasla, Egypt; Careem's Wasally |

  Zajel, Deliverzy, Weevo, Nawrt and HurryApp also exist. زخم was dropped because its classical meaning is "stench".
- **Color direction last shown:** black with signal yellow `#FFC72C` (recommended), cobalt, and lime. The founder didn't pick one.
- **Why the founder is unhappy:** he said the assistant's results felt weak in everything. That's why this review team exists. **Be bold, specific and concrete. Generic advice is useless here.**

## 9. Rules for every reviewer

- **Write your report in English,** but quote Arabic wording where the exact words matter (UI text, names, slogans).
- **Be concrete:** give numbers, specific screens, specific wording and specific fixes. Rank by impact.
- **Don't touch** the app source code, the database, or other reviewers' files. Write only inside your own output folder.
- **Never ask for or use secret keys.** The public Supabase URL and publishable key in `apps/customer/.env` are fine to read.
