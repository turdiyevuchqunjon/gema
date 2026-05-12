"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const benefits = [
  {
    title: "Asabni tinchlantiradi",
    desc: "Stress va kuchli tashvishlardan keyin tananing tabiiy muvozanatini tiklaydi.",
  },
  {
    title: "Uyquni yaxshilaydi",
    desc: "Chuqur va tinch uyquni qaytarib, tongda tetik uyg'onishga yordam beradi.",
  },
  {
    title: "Hazm tizimini yaxshilaydi",
    desc: "Oshqozon va ichak ishini yumshoq tarzda normallashtiradi.",
  },
  {
    title: "Ichakdagi infeksiyalarni tozalaydi",
    desc: "Tabiiy antibakterial xususiyatlar orqali zararli mikroblarga qarshi turadi.",
  },
  {
    title: "Qabziyatni oldini oladi",
    desc: "Ichakni yumshoq harakatlantiradi, og'riqsiz va tabiiy yo'l bilan.",
  },
  {
    title: "Immunitetni mustahkamlaydi",
    desc: "O'simlik tarkibidagi antioksidantlar tana himoyasini kuchaytiradi.",
  },
];

const teaHerbs = [
  { name: "Yorongul", latin: "Hypericum perforatum", use: "yallig'lanishga qarshi" },
  { name: "Qichitqi o't", latin: "Urtica dioica", use: "qon tomirlarni mustahkamlaydi" },
  { name: "Kalendula", latin: "Calendula officinalis", use: "jarohatni tezda bitiradi" },
  { name: "Chakanda", latin: "Hippophae rhamnoides", use: "vitaminlarga boy" },
  { name: "Beda", latin: "Medicago sativa", use: "umumiy quvvat beradi" },
];

const suppHerbs = [
  { name: "Kakao yog'i", latin: "Theobroma cacao", use: "asos sifatida" },
  { name: "Yorongul", latin: "Hypericum perforatum", use: "yumshatuvchi" },
  { name: "Qaldirg'och o't", latin: "Chelidonium majus", use: "antibakterial" },
  { name: "Qichitqi o't", latin: "Urtica dioica", use: "qonni to'xtatadi" },
  { name: "Chakanda", latin: "Hippophae rhamnoides", use: "tez tiklaydi" },
];

type HerbItem = { name: string; latin: string; use: string };

function HerbColumn({
  kicker,
  title,
  items,
}: {
  kicker: string;
  title: string;
  items: HerbItem[];
}) {
  return (
    <div className="editorial-card p-7 pb-3 max-sm:rounded-[22px] max-sm:px-[18px] max-sm:py-[22px]">
      <div className="mini-kicker mb-4">{kicker}</div>
      <h3 className="font-fraunces mb-4 text-[clamp(1.45rem,2.6vw,2rem)] font-medium leading-[1.08] tracking-[-0.03em]">
        {title}
      </h3>

      <div className="mt-5">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="grid grid-cols-[56px_minmax(0,1.1fr)_minmax(120px,0.8fr)] gap-4 border-t border-line py-[18px] max-md:grid-cols-[56px_1fr] max-sm:grid-cols-[48px_1fr] max-sm:gap-3"
          >
            <div className="herb-num">{String(index + 1).padStart(2, "0")}</div>

            <div>
              <div className="font-fraunces text-[1.15rem] leading-[1.2]">
                {item.name}
              </div>
              <div className="mt-[5px] font-fraunces italic text-[14px] leading-7 text-muted">
                {item.latin}
              </div>
            </div>

            <div className="mt-[5px] text-right text-[14px] leading-7 text-muted max-md:col-[2/3] max-md:text-left max-md:mt-[2px] max-md:italic max-md:text-accent">
              {item.use}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");

      // Pixel client-side Lead event
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead");
      }

      setStatus("success");
      setForm({ name: "", phone: "", address: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <main className="overflow-clip">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 border-b border-[rgba(217,208,196,0.7)] bg-[rgba(248,245,239,0.82)] backdrop-blur-[16px]">
        <div className="container-custom flex items-center justify-between gap-5 py-[18px] max-sm:flex-col max-sm:items-start">
          <a href="#" className="inline-flex flex-col gap-1">
            <span className="font-fraunces text-[1.4rem] leading-none tracking-[-0.04em]">
              Hemmort
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Tabiiy mahsulot
            </span>
          </a>

          <nav className="flex items-center gap-5 max-sm:w-full max-sm:justify-between">
            <a href="#foyda" className="text-sm text-muted transition hover:text-ink">
              Foyda
            </a>
            <a href="#tarkib" className="text-sm text-muted transition hover:text-ink">
              Tarkib
            </a>
            <a
              href="#buyurtma"
              className="primary-btn !min-w-0 !min-h-0 !py-3 !px-5 !text-[11px]"
            >
              <span>Ma'lumot qoldiring</span>
              <span className="arrow">→</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="py-[76px] pb-[88px] max-md:pt-[54px] max-md:pb-[68px]">
        <div className="container-custom relative">
          <div
            className="mb-[22px] inline-flex items-center gap-[14px]"
            data-reveal
          >
            <span className="inline-block h-px w-[84px] bg-line max-sm:w-[56px]" />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted">
              Hemmort · Tabiiy preparat
            </span>
          </div>

          <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div data-reveal>
              <h1 className="font-fraunces flex flex-col gap-1 text-[clamp(3.1rem,8vw,6.9rem)] font-medium leading-[0.92] tracking-[-0.05em]">
                <span>Gemorroyga</span>
                <span className="italic text-accent">qarshi.</span>
                <span>Tabiiy</span>
                <span className="italic">shifo vositasi.</span>
              </h1>
            </div>

            <div className="relative z-[1]" data-reveal>
              <p className="mb-[34px] max-w-[470px] text-[15px] leading-[1.85] text-muted">
                Hech qanday himikat, sintetika yoki konservant yo&apos;q.
                Faqat dorivor o&apos;simliklar — malakali mutaxassislar
                tomonidan tanlangan, O&apos;zbekiston bo&apos;ylab bepul
                yetkazib beriladi.
              </p>

   <a href="#buyurtma" className="primary-btn max-sm:w-full">
                  <span>Ma'lumot qoldiring</span>
                  <span className="arrow">→</span>
                </a>

              <div className="mb-[34px] pt-8 grid gap-[18px] md:grid-cols-3 max-md:grid-cols-1">
                <div className="border-t border-line pt-[14px]">
                  <div className="font-fraunces text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.04em]">
                    100<span className="italic text-accent">%</span>
                  </div>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                    Tabiiy tarkib
                  </div>
                </div>

                <div className="border-t border-line pt-[14px]">
                  <div className="font-fraunces text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.04em]">
                    0
                  </div>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                    Himikat va sintetika
                  </div>
                </div>

                <div className="border-t border-line pt-[14px]">
                  <div className="font-fraunces text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.04em]">
                    24<span className="italic text-accent">/</span>7
                  </div>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                    Konsultatsiya
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-[18px] max-sm:flex-col max-sm:items-start">

                <a
                  href="tel:+998785550307"
                  className="text-sm text-muted transition hover:text-ink"
                >
                  +998 78 555 03 07
                </a>
              </div>
            </div>
          </div>

          {/* Decorative botanical lines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-[10px] h-[320px] w-[180px] opacity-55 max-lg:hidden"
          >
            <span className="absolute bottom-0 right-[20px] h-[260px] w-px rotate-[-6deg] bg-gradient-to-b from-transparent to-[rgba(45,106,79,0.5)]" />
            <span className="absolute bottom-0 right-[54px] h-[310px] w-px rotate-[8deg] bg-gradient-to-b from-transparent to-[rgba(45,106,79,0.5)]" />
            <span className="absolute bottom-0 right-[92px] h-[210px] w-px rotate-[-12deg] bg-gradient-to-b from-transparent to-[rgba(45,106,79,0.5)]" />
            <span className="absolute bottom-0 right-[126px] h-[290px] w-px rotate-[12deg] bg-gradient-to-b from-transparent to-[rgba(45,106,79,0.5)]" />
          </div>
        </div>
      </section>

      {/* ============ § 01 — FOYDA ============ */}
      <section id="foyda" className="py-24 max-md:py-[78px]">
        <div className="container-custom">
          <div
            className="mb-[44px] grid items-end gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"
            data-reveal
          >
            <div>
              <div className="section-kicker">§ 01 — Foyda</div>
              <h2 className="font-fraunces mt-[14px] text-[clamp(2.4rem,5vw,4.6rem)] font-medium leading-[0.96] tracking-[-0.04em]">
                Bir mahsulot,
                <br />
                <span className="italic text-accent">olti ta&apos;sir.</span>
              </h2>
            </div>

            <div>
              <p className="max-w-[520px] text-[15px] leading-[1.8] text-muted">
                Hemmort tarkibidagi har bir o&apos;simlik ma&apos;lum bir
                vazifani bajaradi. Birgalikda — ular gemorroyni davolashdan
                tashqari, butun hazm-ovqat tizimi va asab tarmog&apos;iga
                foydali ta&apos;sir ko&apos;rsatadi.
              </p>
            </div>
          </div>

          <div
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 max-md:grid-cols-1"
            data-reveal
          >
            {benefits.map((item, index) => (
              <article
                key={item.title}
                className="editorial-card p-7 max-sm:rounded-[22px] max-sm:px-[18px] max-sm:py-[22px]"
              >
                <div className="mb-[26px] flex items-center gap-[14px]">
                  <span className="benefit-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-block flex-1 h-px bg-line" />
                </div>

                <h3 className="font-fraunces mb-[14px] text-[clamp(1.45rem,2.6vw,1.85rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-[15px] leading-[1.75] text-muted">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ § 02 — TARKIB ============ */}
      {/* <section id="tarkib" className="py-24 max-md:py-[78px]">
        <div className="container-custom">
          <div
            className="mb-[44px] grid items-end gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"
            data-reveal
          >
            <div>
              <div className="section-kicker">§ 02 — Tarkib</div>
              <h2 className="font-fraunces mt-[14px] text-[clamp(2.4rem,5vw,4.6rem)] font-medium leading-[0.96] tracking-[-0.04em]">
                O&apos;simliklar.
                <br />
                <span className="italic text-accent">Boshqa hech narsa.</span>
              </h2>
            </div>

            <div>
              <p className="max-w-[520px] text-[15px] leading-[1.8] text-muted">
                Hemmort ikki shakldan iborat: ichish uchun giyohlar
                to&apos;plami (choy) va rektal shamlar (svecha). Har ikkalasi
                ham faqat tabiiy o&apos;simlik xom-ashyosidan ishlab
                chiqarilgan.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2" data-reveal>
            <HerbColumn
              kicker="Birinchi shakl"
              title="Giyohlar to'plami (choy)"
              items={teaHerbs}
            />
            <HerbColumn
              kicker="Ikkinchi shakl"
              title="Rektal shamchalar (svecha)"
              items={suppHerbs}
            />
          </div>
        </div>
      </section> */}

      {/* ============ § 03 — BUYURTMA ============ */}
      <section id="buyurtma" className="pb-24 pt-[90px] max-md:py-[78px]">
        <div className="container-custom">
          <div
            className="mb-[44px] grid items-end gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"
            data-reveal
          >
            <div>
              <div className="section-kicker">§ 03 — Buyurtma</div>
              <h2 className="font-fraunces mt-[14px] text-[clamp(2.4rem,5vw,4.6rem)] font-medium leading-[0.96] tracking-[-0.04em]">
                Ma&apos;lumotlaringizni
                <br />
                <span className="italic text-accent">qoldiring.</span>
              </h2>
            </div>

            <div>
              <p className="max-w-[520px] text-[15px] leading-[1.8] text-muted">
                Formani to&apos;ldiring. Operator siz bilan tez orada
                bog&apos;lanadi va buyurtmangizni tasdiqlaydi.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2" data-reveal>
            {/* Aloqa kartochkasi */}
            {/* <div className="editorial-card p-7 max-sm:rounded-[22px] max-sm:px-[18px] max-sm:py-[22px]">
              <div className="mini-kicker mb-4">Aloqa</div>
              <h3 className="font-fraunces mb-[14px] text-[clamp(1.45rem,2.6vw,2rem)] font-medium leading-[1.08] tracking-[-0.03em]">
                Tezkor bog&apos;lanish
              </h3>
              <p className="mb-6 text-[15px] leading-[1.8] text-muted">
                Buyurtma yuborilgach, siz bilan telefon orqali bog&apos;lanamiz.
              </p>

              <div className="space-y-3">
                <a
                  href="tel:+998785550307"
                  className="block font-fraunces text-[22px] text-ink transition hover:text-accent"
                >
                  +998 78 555 03 07
                </a>
                <p className="text-[14px] text-muted">
                  O&apos;zbekiston bo&apos;ylab yetkazib berish mavjud
                </p>
                <p className="text-[14px] text-muted">
                  24/7 konsultatsiya xizmati
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-line space-y-3">
                <div className="flex items-center gap-3 text-[14px] text-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Bepul yetkazib berish</span>
                </div>
                <div className="flex items-center gap-3 text-[14px] text-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Qabul qilingandan keyin to&apos;lov</span>
                </div>
                <div className="flex items-center gap-3 text-[14px] text-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Ma&apos;lumotlaringiz xavfsiz</span>
                </div>
              </div>
            </div> */}

            {/* Forma */}
            <div className="editorial-card p-7 max-sm:rounded-[22px] max-sm:px-[18px] max-sm:py-[22px]">
              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-6 w-16 h-16 text-accent">
                    <svg viewBox="0 0 48 48" fill="none">
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M14 24l7 7 13-14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="font-fraunces text-[28px] mb-3">
                    Arizangiz qabul qilindi
                  </h4>
                  <p className="text-muted mb-6 max-w-[320px] mx-auto">
                    Mutaxassisimiz tez orada siz bilan bog&apos;lanadi.
                    Qo&apos;ng&apos;iroqqa tayyor bo&apos;ling.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-[12px] uppercase tracking-[0.18em] text-muted border border-line px-5 py-3 rounded-full hover:border-ink hover:text-ink transition"
                  >
                    Yana ariza yuborish
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-fraunces mb-5 text-[clamp(1.45rem,2.6vw,2rem)] font-medium leading-[1.08] tracking-[-0.03em]">
                    Buyurtma formasi
                  </h3>

                  <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    <div className="min-h-[84px]">
                      <label
                        htmlFor="name"
                        className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted"
                      >
                        Ism familiya
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Masalan: Ali Valiyev"
                        autoComplete="name"
                        required
                        className="editorial-input"
                      />
                    </div>

                    <div className="min-h-[84px]">
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted"
                      >
                        Telefon raqam
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+998 90 123 45 67"
                        autoComplete="tel"
                        required
                        className="editorial-input"
                      />
                    </div>

                    <div className="min-h-[84px]">
                      <label
                        htmlFor="address"
                        className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted"
                      >
                        Manzil
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Viloyat, tuman, mahalla"
                        autoComplete="street-address"
                        required
                        className="editorial-input"
                      />
                    </div>

                    {status === "error" && errorMsg && (
                      <div className="border-l-2 border-[#8a2727] bg-[rgba(138,39,39,0.06)] px-4 py-3 text-sm text-[#8a2727]">
                        ⚠ {errorMsg}
                      </div>
                    )}

                    <div className="mt-7 flex flex-wrap items-center gap-[18px]">
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="primary-btn max-sm:w-full"
                      >
                        {status === "loading" ? (
                          <span className="spinner mx-auto" />
                        ) : (
                          <>
                            <span>Yuborish</span>
                            <span className="arrow">→</span>
                          </>
                        )}
                      </button>

                      <p className="text-[13px] text-muted">
                        Ma&apos;lumotlaringiz maxfiy saqlanadi
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-ink text-bg pt-[60px] pb-[40px]">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] mb-12">
            <div>
              <div className="font-fraunces text-[28px] tracking-[-0.04em] mb-2">
                Hemmort
              </div>
              <p className="text-[14px] leading-[1.7] text-[rgba(240,237,227,0.6)] max-w-[340px]">
                Tabiiy tarkibga asoslangan mahsulot. O&apos;zbekiston
                bo&apos;ylab buyurtma va konsultatsiya xizmati mavjud.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 max-sm:grid-cols-1">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(240,237,227,0.4)] mb-3">
                  Aloqa
                </p>
                <a
                  href="tel:+998785550307"
                  className="text-[15px] text-[rgba(240,237,227,0.85)] hover:text-white transition"
                >
                  +998 78 555 03 07
                </a>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(240,237,227,0.4)] mb-3">
                  Yetkazish
                </p>
                <p className="text-[15px] text-[rgba(240,237,227,0.85)]">
                  O&apos;zbekiston bo&apos;ylab
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(240,237,227,0.4)] mb-3">
                  Ish vaqti
                </p>
                <p className="text-[15px] text-[rgba(240,237,227,0.85)]">
                  24/7 konsultatsiya
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(240,237,227,0.1)] pt-6 flex flex-wrap justify-between items-center gap-4">
            <p className="text-[12px] text-[rgba(240,237,227,0.4)] tracking-[0.04em]">
              © {new Date().getFullYear()} Hemmort. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex gap-6 text-[13px] text-[rgba(240,237,227,0.55)]">
              <a href="#foyda" className="hover:text-white transition">
                Foyda
              </a>
              <a href="#tarkib" className="hover:text-white transition">
                Tarkib
              </a>
              <a href="#buyurtma" className="hover:text-white transition">
                Buyurtma
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}
