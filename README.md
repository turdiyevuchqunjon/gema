# 🌿 Hemmort — Next.js + Tailwind Landing

Gemorroyga qarshi tabiiy mahsulot uchun professional landing sayt. **Next.js 14 (App Router) + TypeScript + TailwindCSS** asosida.

---

## ✨ Imkoniyatlar

- 📐 Rasmlardagi dizaynga 100% mos — krem fon, **Fraunces** serif shrift, yashil aksent
- 📝 Lid forma (Ism Familiya, Telefon, Manzil) — to'liq integratsiya:
  - **Telegram bot** — UTM bilan birga xabar
  - **AmoCRM** — kontakt + lid yaratish, FBP/FBC custom field bilan
  - **Meta CAPI** — server-side `Lead` event
- 🛒 **Purchase event** — AmoCRM webhook orqali, lid SOTILDI bosqichiga o'tganda Meta'ga avtomatik `Purchase` event yuboriladi (lookalike auditoriya uchun)
- 🔒 Webhook himoyasi — `?secret=XXX` orqali
- 📱 To'liq responsiv — desktop, tablet, mobil
- ⚡ Server-side optimized, parallel API chaqiruvlari (Promise.allSettled)

---

## 🚀 Boshlash

```bash
# 1. Bog'liqliklarni o'rnatish
npm install

# 2. .env.local yaratish va kalitlarni to'ldirish
cp .env.local.example .env.local
# (.env.local ichini to'ldiring)

# 3. Development
npm run dev

# 4. Production
npm run build
npm start
```

Sayt: `http://localhost:3000`

---

## 🔑 .env.local kalitlarini to'ldirish

### Meta Pixel & Conversions API

1. https://business.facebook.com/events_manager → Pixel yarating
2. Pixel ID ni nusxa oling → `META_PIXEL_ID` va `NEXT_PUBLIC_META_PIXEL_ID` (bir xil qiymat)
3. **Settings → Conversions API → Generate Access Token** → `META_ACCESS_TOKEN`
4. Test paytida: **Test Events** → `META_TEST_EVENT_CODE` (production'da bo'sh qoldiring)

### AmoCRM

1. **Settings → Integrations → Create your integration** (yoki "Long-lived token")
2. Long-lived Access Token → `AMOCRM_ACCESS_TOKEN`
3. Domain: `xxx.amocrm.ru` formatida → `AMOCRM_DOMAIN`
4. **Pipeline ID** va status ID'larni topish:
   ```bash
   curl https://YOUR_DOMAIN/api/v4/leads/pipelines \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
5. **AMOCRM_SOLD_STATUS_ID** — "Sotildi" bosqichi ID
6. **Custom field'lar** (FBP/FBC) yaratish:
   - AmoCRM → Settings → Fields → **Contacts** → Add field → Text → "FBP" va "FBC"
   - Field ID'larni topish:
   ```bash
   curl https://YOUR_DOMAIN/api/v4/contacts/custom_fields \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### AmoCRM Webhook (Purchase event uchun)

AmoCRM panelida:
- **Settings → Integrations → Webhooks**
- URL: `https://yourdomain.com/api/amocrm-purchase?secret=YOUR_SECRET`
- Trigger: ✅ **"Lead status changed"**
- `AMOCRM_WEBHOOK_SECRET` ni ham `.env.local` ga qo'ying

### Telegram Bot

1. [@BotFather](https://t.me/BotFather) → `/newbot` → token → `TELEGRAM_BOT_TOKEN`
2. Bot bilan suhbat boshlang yoki guruhga qo'shing
3. [@userinfobot](https://t.me/userinfobot) yoki [@RawDataBot](https://t.me/RawDataBot) → `chat_id` → `TELEGRAM_CHAT_ID`
4. Guruh uchun `chat_id` minus bilan: `-1001234567890`

---

## 📁 Loyiha tuzilishi

```
hemmort/
├── src/app/
│   ├── api/
│   │   ├── lead/route.ts              # Forma → Meta + AmoCRM + Telegram
│   │   ├── amocrm-purchase/route.ts   # AmoCRM webhook → Meta Purchase
│   │   └── webhook/meta/route.ts      # Meta webhook (verify + events)
│   ├── globals.css                    # Tailwind + custom CSS variables
│   ├── layout.tsx                     # Root layout + Meta Pixel
│   └── page.tsx                       # Landing sahifasi
├── .env.local.example
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 Lead → Purchase oqimi

```
1. Mijoz formada ariza qoldiradi
   └─→ POST /api/lead
       ├─→ Meta CAPI: "Lead" event (server-side, FBP/FBC + IP + UA)
       ├─→ AmoCRM: kontakt + lid yaratiladi (FBP/FBC saqlanadi)
       └─→ Telegram: UTM bilan xabar

2. Menejer AmoCRM'da lid bilan ishlaydi, summasi kiritiladi

3. Lid "SOTILDI" bosqichiga o'tkaziladi
   └─→ AmoCRM webhook → POST /api/amocrm-purchase
       └─→ Meta CAPI: "Purchase" event (FBP/FBC + summa)
           └─→ Meta lookalike auditoriya signal
```

**Muhim**: Purchase event'da `event_id = purchase_lead_{leadId}` — bu deduplikatsiya uchun (webhook qayta kelganda Meta bir xil event'ni ikki marta hisoblamaydi).

---

## 🧪 Test qilish

### Meta CAPI test
1. `META_TEST_EVENT_CODE` ni `.env.local` ga qo'ying
2. Events Manager → **Test Events** → kodni ko'rsating
3. Formani to'ldiring → real-time ko'rinadi

### AmoCRM webhook test
```bash
curl -X POST "http://localhost:3000/api/amocrm-purchase?secret=YOUR_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "leads[status][0][id]=12345" \
  -d "leads[status][0][status_id]=YOUR_SOLD_STATUS_ID" \
  -d "leads[status][0][price]=500000"
```

### Telegram test
Formani to'ldiring — Telegram chatga xabar kelishi kerak.

---

## 📦 Production deploy

### Vercel (tavsiya etiladi)
```bash
npm i -g vercel
vercel
```
Vercel dashboard'da `.env.local` dagi barcha kalitlarni Environment Variables bo'limiga qo'shing.

### Boshqa platformalar
```bash
npm run build
npm start
```

---

## ⚠️ Xavfsizlik

- ❌ `.env.local` faylini hech qachon git'ga yubormaslik (`.gitignore`'da)
- ✅ AmoCRM webhook'ga `?secret=` qo'ying
- ✅ Meta Access Token va AmoCRM token faqat server-side (`META_PIXEL_ID` client uchun bo'lishi mumkin, lekin **token EMAS**)
- ✅ Production'da `META_TEST_EVENT_CODE` ni bo'sh qoldiring

---

© Hemmort. Tabiiydan kelgan shifo.
# gema
