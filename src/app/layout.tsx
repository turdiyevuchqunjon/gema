import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hemmort — Gemorroyga qarshi tabiiy shifo",
  description:
    "Hemmort — gemorroy va hazm tizimi muammolariga qarshi 100% tabiiy o'simlik mahsuloti. Bepul konsultatsiya uchun ariza qoldiring.",
  keywords: [
    "hemmort",
    "gemorroy",
    "tabiiy shifo",
    "o'simlik mahsuloti",
    "gemorroyga qarshi",
    "rektal shamlar",
    "giyohlar to'plami",
  ],
  openGraph: {
    title: "Hemmort — Gemorroyga qarshi tabiiy shifo",
    description:
      "100% tabiiy. Hech qanday himikat yoki sintetika yo'q. O'zbekiston bo'ylab bepul yetkazib berish.",
    type: "website",
    locale: "uz_UZ",
  },
};

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
