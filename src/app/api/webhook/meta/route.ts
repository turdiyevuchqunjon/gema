import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/webhook/meta — Meta webhook verification (subscription)
 * POST /api/webhook/meta — Meta tomonidan kelgan event'larni qabul qilish
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    console.log("[META WEBHOOK] Verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[META WEBHOOK] Verification failed");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[META WEBHOOK] Received:", JSON.stringify(body, null, 2));

    // Meta event'larni shu yerda qayta ishlash mumkin
    // Hozircha faqat log qilamiz va 200 qaytaramiz.

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[META WEBHOOK ERROR]", err);
    return NextResponse.json({ ok: true });
  }
}
