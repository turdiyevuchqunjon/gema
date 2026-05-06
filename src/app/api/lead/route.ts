import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/lead
 * Frontend formadan kelgan lidni qabul qiladi va parallel ravishda:
 *  1) Meta CAPI ga "Lead" event yuboradi (server-side)
 *  2) AmoCRM ga kontakt + lid yaratadi (FBP/FBC custom field bilan)
 *  3) Telegram botga UTM bilan birga xabar yuboradi
 */

interface LeadPayload {
  name: string;
  phone: string;
  address: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  pageUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: LeadPayload = await req.json();
    const { name, phone, address, fbp, fbc, userAgent, pageUrl } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Ism va telefon majburiy" },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Parallel yuborish - tez javob qaytarish uchun
    const [metaResult, amoResult, telegramResult] = await Promise.allSettled([
      sendToMetaCAPI({
        name,
        phone,
        fbp,
        fbc,
        clientIp,
        userAgent: userAgent || "",
        pageUrl: pageUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
      }),
      createAmoCRMLead({ name, phone, address, fbp, fbc }),
      sendToTelegram({ name, phone, address, pageUrl: pageUrl || "" }),
    ]);

    return NextResponse.json({
      success: true,
      meta:
        metaResult.status === "fulfilled" ? metaResult.value : { error: "failed" },
      amo:
        amoResult.status === "fulfilled" ? amoResult.value : { error: "failed" },
      telegram:
        telegramResult.status === "fulfilled"
          ? telegramResult.value
          : { error: "failed" },
    });
  } catch (err: any) {
    console.error("[LEAD API ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Server xatoligi" },
      { status: 500 }
    );
  }
}

// ============== META CAPI ==============
async function sendToMetaCAPI(data: {
  name: string;
  phone: string;
  fbp?: string;
  fbc?: string;
  clientIp: string;
  userAgent: string;
  pageUrl: string;
}) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[META CAPI] credentials yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const hash = (value: string) =>
    crypto
      .createHash("sha256")
      .update(value.toLowerCase().trim())
      .digest("hex");

  const normalizedPhone = data.phone.replace(/[\s\-\(\)\+]/g, "");
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: data.pageUrl,
        action_source: "website",
        user_data: {
          fn: firstName ? [hash(firstName)] : [],
          ln: lastName ? [hash(lastName)] : [],
          ph: normalizedPhone ? [hash(normalizedPhone)] : [],
          client_ip_address: data.clientIp,
          client_user_agent: data.userAgent,
          fbp: data.fbp || "",
          fbc: data.fbc || "",
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      console.error("[META CAPI ERROR]", result);
      return { error: result };
    }
    console.log("[META CAPI] Lead event yuborildi");
    return result;
  } catch (err: any) {
    console.error("[META CAPI EXCEPTION]", err);
    return { error: err.message };
  }
}

// ============== AMOCRM ==============
async function createAmoCRMLead(data: {
  name: string;
  phone: string;
  address: string;
  fbp?: string;
  fbc?: string;
}) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;
  const FIELD_FBP = process.env.AMOCRM_FIELD_FBP;
  const FIELD_FBC = process.env.AMOCRM_FIELD_FBC;

  if (!DOMAIN || !ACCESS_TOKEN) {
    console.warn("[AMOCRM] credentials yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const baseUrl = `https://${DOMAIN}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };

  let contactId: number | null = null;

  // 1) Mavjud kontaktni qidirish (telefon bo'yicha)
  try {
    const searchRes = await fetch(
      `${baseUrl}/api/v4/contacts?query=${encodeURIComponent(data.phone)}`,
      { headers }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const existing = searchData?._embedded?.contacts?.[0];
      if (existing) {
        contactId = existing.id;
        console.log("[AMOCRM] Mavjud kontakt topildi:", contactId);

        // Mavjud kontaktda FBP/FBC ni yangilash
        if (FIELD_FBP || FIELD_FBC) {
          const updateFields: any[] = [];
          if (FIELD_FBP && data.fbp) {
            updateFields.push({
              field_id: parseInt(FIELD_FBP),
              values: [{ value: data.fbp }],
            });
          }
          if (FIELD_FBC && data.fbc) {
            updateFields.push({
              field_id: parseInt(FIELD_FBC),
              values: [{ value: data.fbc }],
            });
          }
          if (updateFields.length > 0) {
            await fetch(`${baseUrl}/api/v4/contacts/${contactId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ custom_fields_values: updateFields }),
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("[AMOCRM] Kontakt qidirishda xatolik:", err);
  }

  // 2) Yangi kontakt yaratish
  if (!contactId) {
    const customFields: any[] = [
      {
        field_code: "PHONE",
        values: [{ value: data.phone, enum_code: "WORK" }],
      },
    ];
    if (FIELD_FBP && data.fbp) {
      customFields.push({
        field_id: parseInt(FIELD_FBP),
        values: [{ value: data.fbp }],
      });
    }
    if (FIELD_FBC && data.fbc) {
      customFields.push({
        field_id: parseInt(FIELD_FBC),
        values: [{ value: data.fbc }],
      });
    }

    const contactPayload = [
      { name: data.name, custom_fields_values: customFields },
    ];

    const contactRes = await fetch(`${baseUrl}/api/v4/contacts`, {
      method: "POST",
      headers,
      body: JSON.stringify(contactPayload),
    });
    const contactData = await contactRes.json();
    if (!contactRes.ok) {
      console.error(
        "[AMOCRM KONTAKT XATOLIK]",
        JSON.stringify(contactData, null, 2)
      );
    } else {
      contactId = contactData?._embedded?.contacts?.[0]?.id;
      console.log("[AMOCRM] Yangi kontakt:", contactId);
    }
  }

  // 3) Lid yaratish
  const leadPayload: any[] = [
    {
      name: `Hemmort — ${data.name}`,
      ...(process.env.AMOCRM_PIPELINE_ID
        ? { pipeline_id: parseInt(process.env.AMOCRM_PIPELINE_ID) }
        : {}),
      ...(process.env.AMOCRM_STATUS_ID
        ? { status_id: parseInt(process.env.AMOCRM_STATUS_ID) }
        : {}),
      ...(contactId
        ? { _embedded: { contacts: [{ id: contactId }] } }
        : {}),
    },
  ];

  const leadRes = await fetch(`${baseUrl}/api/v4/leads`, {
    method: "POST",
    headers,
    body: JSON.stringify(leadPayload),
  });
  const leadData = await leadRes.json();
  if (!leadRes.ok) {
    console.error("[AMOCRM LID XATOLIK]", JSON.stringify(leadData, null, 2));
    throw new Error("AmoCRM lid yaratishda xatolik");
  }

  const leadId = leadData?._embedded?.leads?.[0]?.id;
  console.log("[AMOCRM] Lid yaratildi ID:", leadId);

  // 4) Manzil va batafsil ma'lumotlarni izoh sifatida qo'shish
  if (leadId) {
    try {
      await fetch(`${baseUrl}/api/v4/leads/${leadId}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify([
          {
            note_type: "common",
            params: {
              text: `🌿 Hemmort - yangi ariza\n\n👤 Mijoz: ${data.name}\n📞 Telefon: ${data.phone}\n📍 Manzil: ${data.address || "ko'rsatilmagan"}`,
            },
          },
        ]),
      });
    } catch (err) {
      console.warn("[AMOCRM] Izoh qo'shishda xatolik:", err);
    }
  }

  return { leadId, contactId };
}

// ============== TELEGRAM ==============
async function sendToTelegram(data: {
  name: string;
  phone: string;
  address: string;
  pageUrl: string;
}) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    console.warn("[TELEGRAM] credentials yo'q, o'tkazib yuborildi");
    return { skipped: true };
  }

  const utm: Record<string, string> = {
    utm_source: "-",
    utm_medium: "-",
    utm_campaign: "-",
    utm_term: "-",
    utm_content: "-",
  };

  try {
    if (data.pageUrl) {
      const url = new URL(data.pageUrl);
      Object.keys(utm).forEach((key) => {
        const val = url.searchParams.get(key);
        if (val) utm[key] = val;
      });
    }
  } catch {
    /* invalid url - ignore */
  }

  const date = new Date().toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
  });

  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "-";
  const lastName = nameParts.slice(1).join(" ") || "-";

  const text =
    `🌿 <b>Yangi ariza — Hemmort</b>\n\n` +
    `👤 <b>Ism:</b> ${escapeHtml(firstName)}\n` +
    `👤 <b>Familiya:</b> ${escapeHtml(lastName)}\n` +
    `📞 <b>Telefon:</b> ${escapeHtml(data.phone)}\n` +
    `📍 <b>Manzil:</b> ${escapeHtml(data.address || "-")}\n` +
    `📅 <b>Sana:</b> ${date}\n\n` +
    `📊 <b>UTM ma'lumotlari:</b>\n` +
    `• source: <code>${escapeHtml(utm.utm_source)}</code>\n` +
    `• medium: <code>${escapeHtml(utm.utm_medium)}</code>\n` +
    `• campaign: <code>${escapeHtml(utm.utm_campaign)}</code>\n` +
    `• term: <code>${escapeHtml(utm.utm_term)}</code>\n` +
    `• content: <code>${escapeHtml(utm.utm_content)}</code>`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const result = await res.json();
    if (!result.ok) {
      console.error("[TELEGRAM ERROR]", result);
      return { error: result.description };
    }
    console.log("[TELEGRAM] Xabar yuborildi");
    return { ok: true };
  } catch (err: any) {
    console.error("[TELEGRAM EXCEPTION]", err);
    return { error: err.message };
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
