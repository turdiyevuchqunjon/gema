#!/bin/bash
cd "$(dirname "$0")"

echo "🌿 Hemmort — Vercel deploy boshlandi..."
echo ""

# Vercel CLI o'rnatilganini tekshirish
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI topilmadi. O'rnatilmoqda..."
  npm install -g vercel
fi

echo "📦 Muhit o'zgaruvchilari qo'shilmoqda..."

# Yangi env variables qo'shish (Production + Preview + Development)
vercel env add AMOCRM_FIELD_FBP production <<< "565246"
vercel env add AMOCRM_FIELD_FBP preview <<< "565246"
vercel env add AMOCRM_FIELD_FBC production <<< "565248"
vercel env add AMOCRM_FIELD_FBC preview <<< "565248"
vercel env add AMOCRM_HIGH_QUALITY_STATUS_ID production <<< "86494610"
vercel env add AMOCRM_HIGH_QUALITY_STATUS_ID preview <<< "86494610"

echo ""
echo "🚀 Production deploy boshlandi..."
vercel --prod

echo ""
echo "✅ Deploy tugadi! ginko-farm.vercel.app yangilandi."
echo ""
read -p "Enter bosing yopish uchun..."
