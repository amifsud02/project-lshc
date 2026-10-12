import "./globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import SiteNavbar from "@/components/Site/SiteNavbar";
import SiteFooter from "@/components/Site/SiteFooter";
import StyledComponentsRegistry from "@/lib/registry";
import { AD_CLIENT } from "@/components/AdSense/AdSense";
import { getGeneralGlobal } from "@/lib/utils/payload/globals";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const DEFAULT_SITE_NAME = 'La Salle Handball'
const DEFAULT_DESCRIPTION = "Visit the La Salle Handball Club official website: all the latest news on the team and club, and fixtures."
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;

// Site name, description, favicon and share image come from Site Settings in the admin.
export async function generateMetadata(): Promise<Metadata> {
  const general = await getGeneralGlobal()
  const siteName = general.siteName || DEFAULT_SITE_NAME
  const description = general.siteDescription || DEFAULT_DESCRIPTION
  const shareImage = general.fallbackImageUrl ? [general.fallbackImageUrl] : undefined

  return {
    metadataBase: baseSiteUrl ? new URL(baseSiteUrl) : undefined,
    applicationName: siteName,
    // Pages set their own title ("Contact us"); the site name is added after it.
    title: { default: `${siteName} | Official Website`, template: `%s | ${siteName}` },
    description,
    icons: { icon: general.faviconUrl || '/favicon.ico' },
    openGraph: {
      siteName,
      title: siteName,
      description,
      url: baseSiteUrl,
      images: shareImage,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <Script
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-R7TBRHBEYQ"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-R7TBRHBEYQ');
          `}
        </Script>
        <Script
          id="cookieyes"
          strategy="afterInteractive"
          src="https://cdn-cookieyes.com/client_data/bf6579391a8ef2247d80d05c/script.js"
        />
        {/* Plain async script rather than next/script: React 19 hoists this into
            <head> and leaves off the data-nscript attribute, both of which
            AdSense requires for Auto ads and site verification. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
          crossOrigin="anonymous"
        />
        <StyledComponentsRegistry>
          <main>
            <SiteNavbar />
            {children}
            <SiteFooter/>
          </main>
        </StyledComponentsRegistry>
        <Analytics/>
      </body>
    </html>
  );
}
