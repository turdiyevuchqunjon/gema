import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const DOMAIN = process.env.AMOCRM_DOMAIN;
  const ACCESS_TOKEN = process.env.AMOCRM_ACCESS_TOKEN;

  if (!DOMAIN || !ACCESS_TOKEN) {
    return NextResponse.json({
      error: "AmoCRM ulanmagan",
      AMOCRM_DOMAIN: DOMAIN ? "bor" : "YO'Q",
      AMOCRM_ACCESS_TOKEN: ACCESS_TOKEN ? "bor" : "YO'Q",
    }, { status: 400 });
  }

  const baseUrl = `https://${DOMAIN}`;
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}` };

  try {
    const accountRes = await fetch(`${baseUrl}/api/v4/account`, { headers });
    if (!accountRes.ok) {
      return NextResponse.json({
        error: `HTTP ${accountRes.status}`,
        sabab: accountRes.status === 401 ? "Token noto'g'ri" : "Domen muammoli",
      }, { status: 400 });
    }
    const account = await accountRes.json();

    const pipelinesRes = await fetch(`${baseUrl}/api/v4/leads/pipelines`, { headers });
    const pipelinesData = pipelinesRes.ok ? await pipelinesRes.json() : null;

    const pipelines = pipelinesData?._embedded?.pipelines?.map((p: any) => ({
      pipeline_id: p.id,
      nomi: p.name,
      is_main: p.is_main,
      statuses: p._embedded?.statuses?.map((s: any) => ({
        status_id: s.id,
        nomi: s.name,
      })) || [],
    })) || [];

    const fieldsRes = await fetch(`${baseUrl}/api/v4/contacts/custom_fields`, { headers });
    const fieldsData = fieldsRes.ok ? await fieldsRes.json() : null;
    const fields = fieldsData?._embedded?.custom_fields?.map((f: any) => ({
      field_id: f.id,
      nomi: f.name,
      code: f.code,
    })) || [];

    return NextResponse.json({
      ulanish: "AmoCRM ulandi",
      akkaunt: { nomi: account.name },
      barcha_voronkalar: pipelines,
      barcha_kontakt_maydonlari: fields,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}