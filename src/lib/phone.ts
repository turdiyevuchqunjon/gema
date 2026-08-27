/**
 * O'zbekiston telefon raqamlarini yagona E.164 formatga keltiradi: +998XXXXXXXXX
 *
 * Qo'llab-quvvatlanadigan kirishlar:
 *   "+998 90 123 45 67", "998901234567", "90 123 45 67", "901234567",
 *   "8 90 123 45 67" (ba'zi mijozlar 8 bilan yozadi)
 *
 * Bir nechta raqam bitta maydonga kiritilgan bo'lsa (masalan "776654047 +998500558833"),
 * yoki umuman noto'g'ri bo'lsa — null qaytaradi.
 */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;

  let digits = String(raw).replace(/\D/g, "");

  // "8XXXXXXXXX" (10 xona, 8 bilan boshlanadi) -> 998 bilan almashtirish
  if (digits.length === 10 && digits.startsWith("8")) {
    digits = "998" + digits.slice(1);
  }

  // "901234567" (9 xona, operator kodi + raqam) -> 998 prefiks
  if (digits.length === 9) {
    digits = "998" + digits;
  }

  // Endi faqat "998" + 9 xona = 12 xona to'g'ri hisoblanadi
  if (digits.length === 12 && digits.startsWith("998")) {
    return "+" + digits;
  }

  return null;
}

/** CAPI hash uchun: E.164 dan "+" olib tashlangan ko'rinish (998XXXXXXXXX) */
export function phoneForHash(raw: string | undefined | null): string {
  const normalized = normalizePhone(raw);
  if (normalized) return normalized.replace("+", "");
  // Normalize qilib bo'lmasa — eski xatti-harakat: faqat raqamlarni qoldirish
  return String(raw || "").replace(/\D/g, "");
}

/** Ikki raqam bir xil odamnikimi (faqat raqamlar bo'yicha solishtirish) */
export function samePhone(a: string | undefined | null, b: string | undefined | null): boolean {
  const da = String(a || "").replace(/\D/g, "");
  const db = String(b || "").replace(/\D/g, "");
  if (!da || !db) return false;
  // oxirgi 9 xona bo'yicha solishtirish (prefiks farqlarini yutish uchun)
  return da.slice(-9) === db.slice(-9);
}
