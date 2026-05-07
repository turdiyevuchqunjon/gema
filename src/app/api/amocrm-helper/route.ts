import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/amocrm-helper
 *
 * Bu yordamchi endpoint AmoCRM ulanishini test qiladi va sizga kerakli
 * ID'larni ko'rsatadi:
 *   - pipeline_id (voronka ID)
 *   - status_id (har bir bosqich ID)
 *   - field_id (kontaktdagi maxsus maydonlar)
 *
 * Brauzerda oching: https://sizning-domen/api/amocrm-helper
 */
export async function GET(_req: NextRequest) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;

  if (!DOMAIN || !ACCESS_TOKEN) {
    return NextResponse.json(
      {
        error: "AmoCRM ulanmagan",
        kerak: {
          AMOCRM_DOMAIN: DOMAIN ? "✅ bor" : "❌ YO'Q — .env.local ga yozing",
          AMOCRM_ACCESS_TOKEN: ACCESS_TOKEN
            ? "✅ bor"
            : "❌ YO'Q — .env.local ga yozing",
        },
        eslatma:
          "Eski .env da ACCSESS_TOKEN_AMO bo'lgan — bu noto'g'ri nom! AMOCRM_ACCESS_TOKEN deb yozing.",
      },
      { status: 400 }
    );
  }

  const baseUrl = `https://${DOMAIN}`;
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}` };

  try {
    // 1. Account info
    const accountRes = await fetch(`${baseUrl}/api/v4/account`, { headers });
    if (!accountRes.ok) {
      const errText = await accountRes.text();
      return NextResponse.json(
        {
          error: `AmoCRM bilan bog'lanib bo'lmadi (HTTP ${accountRes.status})`,
          sabab:
            accountRes.status === 401
              ? "AMOCRM_ACCESS_TOKEN noto'g'ri yoki muddati o'tgan"
              : "Domen yoki token muammoli",
          batafsil: errText,
        },
        { status: 400 }
      );
    }
    const account = await accountRes.json();

    // 2. Pipelines + statuses
    const pipelinesRes = await fetch(`${baseUrl}/api/v4/leads/pipelines`, {
      headers,
    });
    const pipelinesData = pipelinesRes.ok ? await pipelinesRes.json() : null;

    const pipelines =
      pipelinesData?._embedded?.pipelines?.map((p: any) => ({
        pipeline_id: p.id,
        nomi: p.name,
        is_main: p.is_main,
        statuses:
          p._embedded?.statuses?.map((s: any) => ({
            status_id: s.id,
            nomi: s.name,
            color: s.color,
            is_won: s.id === 142,
            is_lost: s.id === 143,
            izoh:
              s.id === 142
                ? "✅ SOTILDI (Muvaffaqiyatli yakunlandi) — bu AMOCRM_SOLD_STATUS_ID uchun"
                : s.id === 143
                ? "❌ Yo'qotildi"
                : undefined,
          })) || [],
      })) || [];

    // 3. Contact custom fields
    const fieldsRes = await fetch(
      `${baseUrl}/api/v4/contacts/custom_fields`,
      { headers }
    );
    const fieldsData = fieldsRes.ok ? await fieldsRes.json() : null;

    const fields =
      fieldsData?._embedded?.custom_fields?.map((f: any) => ({
        field_id: f.id,
        nomi: f.name,
        code: f.code,
        type: f.type,
      })) || [];

    // FBP/FBC topish
    const fbpField = fields.find((f: any) =>
      String(f.nomi).toLowerCase().includes("fbp")
    );
    const fbcField = fields.find((f: any) =>
      String(f.nomi).toLowerCase().includes("fbc")
    );

    // Asosiy voronka va birinchi bosqich
    const mainPipeline =
      pipelines.find((p: any) => p.is_main) || pipelines[0];
    const firstStatus = mainPipeline?.statuses?.[0];
    const soldStatus = mainPipeline?.statuses?.find(
      (s: any) => s.is_won || s.status_id === 142
    );

    return NextResponse.json(
      {
        ulanish: "✅ AmoCRM bilan muvaffaqiyatli ulandi",
        akkaunt: {
          id: account.id,
          nomi: account.name,
          subdomen: account.subdomain,
        },
        tavsiyalangan_env: {
          "# .env.local fayliga shu qiymatlarni yozing": "",
          AMOCRM_PIPELINE_ID: mainPipeline?.pipeline_id || "tanlanmagan",
          AMOCRM_STATUS_ID: firstStatus?.status_id || "tanlanmagan",
          AMOCRM_SOLD_STATUS_ID: soldStatus?.status_id || 142,
          AMOCRM_FIELD_FBP:
            fbpField?.field_id ||
            "❌ TOPILMADI — AmoCRM da 'FBP' nomli matn maydoni yarating",
          AMOCRM_FIELD_FBC:
            fbcField?.field_id ||
            "❌ TOPILMADI — AmoCRM da 'FBC' nomli matn maydoni yarating",
        },
        barcha_voronkalar: pipelines,
        barcha_kontakt_maydonlari: fields,
        keyingi_qadamlar: [
          "1. AmoCRM da 'Sozlash → Maxsus maydonlar → Kontaktlar' ga kiring",
          "2. 'FBP' va 'FBC' nomli ikkita matn maydoni yarating (agar yo'q bo'lsa)",
          "3. Yuqoridagi tavsiyalangan_env qiymatlarini .env.local ga yozing",
          "4. Serverni qayta ishga tushiring (npm run dev)",
          "5. Formani to'ldirib test qiling — lid AmoCRM ga tushishi kerak",
        ],
      },
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Xatolik yuz berdi",
        details: err.message,
      },
      { status: 500 }
    );
  }
}