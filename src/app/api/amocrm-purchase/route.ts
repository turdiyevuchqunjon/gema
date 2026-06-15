import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/amocrm-purchase
 * AmoCRM webhook endpoint.
 * Lid SOTILDI bosqichiga o'tganda Meta CAPI ga "Purchase" event yuboradi.
 *
 * AmoCRM panelidan webhook o'rnating:
 *   URL: https://yourdomain.com/api/amocrm-purchase?secret=YOUR_SECRET
 *   Trigger: "Stage of the lead changed"
 */

export async function POST(req: NextRequest) {
  try {
    // Webhook secret tekshirish
    const expectedSecret = process.env.AMOCRM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const url = new URL(req.url);
      const providedSecret = url.searchParams.get("secret");
      if (providedSecret !== expectedSecret) {
        console.warn("[AMO PURCHASE] Noto'g'ri secret");
        return NextResponse.json({ ok: true });
      }
    }

    const formData = await req.formData();
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    console.log(
      "[AMO PURCHASE WEBHOOK] Received:",
      JSON.stringify(data, null, 2)
    );

    // AmoCRM bir nechta lidlarni bitta webhookda yuborishi mumkin
    const events: { leadId: string; statusId: string; price: string }[] = [];

    const indexes = new Set<string>();
    for (const key of Object.keys(data)) {
      const m = key.match(/^leads\[status\]\[(\d+)\]/);
      if (m) indexes.add(m[1]);
    }

    if (indexes.size === 0) {
      const leadId = data["leads[status][0][id]"];
      if (leadId) {
        events.push({
          leadId: String(leadId),
          statusId: String(data["leads[status][0][status_id]"] || ""),
          price: String(data["leads[status][0][price]"] || ""),
        });
      }
    } else {
      for (const i of indexes) {
        events.push({
          leadId: String(data[`leads[status][${i}][id]`] || ""),
          statusId: String(data[`leads[status][${i}][status_id]`] || ""),
          price: String(data[`leads[status][${i}][price]`] || ""),
        });
      }
    }

    if (events.length === 0) {
      console.warn("[AMO PURCHASE] Lid ma'lumotlari topilmadi");
      return NextResponse.json({ ok: true });
    }

    const SOLD_STATUS_ID = process.env.AMOCRM_SOLD_STATUS_ID;
    const HIGH_QUALITY_STATUS_ID = process.env.AMOCRM_HIGH_QUALITY_STATUS_ID;
    const results: any[] = [];

    for (const ev of events) {
      if (!ev.leadId) continue;

      const isSold = SOLD_STATUS_ID && ev.statusId === SOLD_STATUS_ID;
      const isHighQuality = HIGH_QUALITY_STATUS_ID && ev.statusId === HIGH_QUALITY_STATUS_ID;

      if (!isSold && !isHighQuality) {
        console.log(
          `[AMO WEBHOOK] Lid ${ev.leadId} bosqichi ${ev.statusId} - qayta ishlanmaydi`
        );
        continue;
      }

      const leadInfo = await fetchLeadDetails(ev.leadId);
      if (!leadInfo) {
        console.error(`[AMO WEBHOOK] Lid ${ev.leadId} topilmadi`);
        continue;
      }

      if (isSold) {
        const result = await sendPurchaseToMeta({
          phone: leadInfo.phone,
          name: leadInfo.name,
          fbp: leadInfo.fbp,
          fbc: leadInfo.fbc,
          price: parseFloat(ev.price) || leadInfo.price || 0,
          leadId: ev.leadId,
          eventType: "Purchase",
        });
        results.push({ leadId: ev.leadId, type: "Purchase", meta: result });
      }

      if (isHighQuality) {
        const result = await sendPurchaseToMeta({
          phone: leadInfo.phone,
          name: leadInfo.name,
          fbp: leadInfo.fbp,
          fbc: leadInfo.fbc,
          price: parseFloat(ev.price) || leadInfo.price || 0,
          leadId: ev.leadId,
          eventType: "HighQualityLead",
        });
        results.push({ leadId: ev.leadId, type: "HighQualityLead", meta: result });
      }
    }

    return NextResponse.json({ ok: true, processed: results });
  } catch (err: any) {
    console.error("[AMO PURCHASE ERROR]", err);
    // Har doim 200 qaytaramiz - AmoCRM webhookni qaytadan urinmasligi uchun
    return NextResponse.json({ ok: true });
  }
}

/* AmoCRM dan lid + kontakt ma'lumotlarini olish */
async function fetchLeadDetails(leadId: string) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;
  const FIELD_FBP = process.env.AMOCRM_FIELD_FBP;
  const FIELD_FBC = process.env.AMOCRM_FIELD_FBC;

  if (!DOMAIN || !ACCESS_TOKEN) {
    console.warn("[AMO FETCH] credentials yo'q");
    return null;
  }

  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}` };

  try {
    const leadRes = await fetch(
      `https://${DOMAIN}/api/v4/leads/${leadId}?with=contacts`,
      { headers }
    );
    if (!leadRes.ok) {
      console.error("[AMO FETCH] lid xatolik:", leadRes.status);
      return null;
    }
    const lead = await leadRes.json();
    const contactId = lead?._embedded?.contacts?.[0]?.id;
    if (!contactId) {
      console.warn("[AMO FETCH] lidda kontakt yo'q");
      return null;
    }

    const contactRes = await fetch(
      `https://${DOMAIN}/api/v4/contacts/${contactId}`,
      { headers }
    );
    if (!contactRes.ok) {
      console.error("[AMO FETCH] kontakt xatolik:", contactRes.status);
      return null;
    }
    const contact = await contactRes.json();

    let phone = "";
    let fbp = "";
    let fbc = "";

    for (const field of contact.custom_fields_values || []) {
      if (field.field_code === "PHONE") {
        phone = field.values?.[0]?.value || "";
      }
      if (FIELD_FBP && String(field.field_id) === FIELD_FBP) {
        fbp = field.values?.[0]?.value || "";
      }
      if (FIELD_FBC && String(field.field_id) === FIELD_FBC) {
        fbc = field.values?.[0]?.value || "";
      }
    }

    return {
      name: contact.name || "",
      phone,
      fbp,
      fbc,
      price: lead.price || 0,
    };
  } catch (err) {
    console.error("[AMO FETCH LEAD]", err);
    return null;
  }
}

/* Meta CAPI ga event yuborish (Purchase yoki HighQualityLead) */
async function sendPurchaseToMeta(data: {
  phone: string;
  name: string;
  fbp: string;
  fbc: string;
  price: number;
  leadId: string;
  eventType: "Purchase" | "HighQualityLead";
}) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[META EVENT] credentials yo'q");
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

  const eventPrefix = data.eventType === "HighQualityLead" ? "hqlead" : "purchase";

  const payload = {
    data: [
      {
        event_id: `${eventPrefix}_lead_${data.leadId}`,
        event_name: data.eventType,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url:
          process.env.NEXT_PUBLIC_SITE_URL || "https://hemmort.uz",
        action_source: "website",
        user_data: {
          ph: normalizedPhone ? [hash(normalizedPhone)] : [],
          fn: firstName ? [hash(firstName)] : [],
          ln: lastName ? [hash(lastName)] : [],
          fbp: data.fbp || "",
          fbc: data.fbc || "",
        },
        custom_data: {
          currency: "UZS",
          value: data.price,
          content_name: data.eventType === "HighQualityLead"
            ? "Yuqori sifatli lid"
            : "Sotildi",
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
      console.error(`[META ${data.eventType} ERROR]`, result);
      return { error: result };
    }
    console.log(
      `[META ${data.eventType}] Lid ${data.leadId} - yuborildi! Summa: ${data.price} UZS`
    );
    return result;
  } catch (err: any) {
    console.error(`[META ${data.eventType} EXCEPTION]`, err);
    return { error: err.message };
  }
}

// AmoCRM ba'zan GET orqali test qiladi
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "AmoCRM Purchase webhook",
    method: "POST",
  });
}

