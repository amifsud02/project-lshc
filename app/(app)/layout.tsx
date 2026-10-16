import "./globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import SiteNavbar from "@/components/Site/SiteNavbar";
import SiteFooter from "@/components/Site/SiteFooter";
import StyledComponentsRegistry from "@/lib/registry";
import { AD_CLIENT } from "@/components/AdSense/AdSense";
import GoogleAnalytics from "@/components/Analytics/GoogleAnalytics";
import JsonLd from "@/components/Seo/JsonLd";
import { getFooterGlobal, getGeneralGlobal } from "@/lib/utils/payload/globals";
import { DEFAULT_SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structuredData";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const DEFAULT_DESCRIPTION = "Visit the La Salle Handball Club official website: all the latest news on the team and club, and fixtures."

// Site name, description, favicon and share image come from Site Settings in the admin.
export async function generateMetadata(): Promise<Metadata> {
  const general = await getGeneralGlobal()
  const siteName = general.siteName || DEFAULT_SITE_NAME
  const description = general.siteDescription || DEFAULT_DESCRIPTION
  const shareImage = general.fallbackImageUrl ? [general.fallbackImageUrl] : undefined

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: siteName,
    // Pages set their own title ("Contact us"); the site name is added after it.
    title: { default: `${siteName} | Official Website`, template: `%s | ${siteName}` },
    description,
    icons: { icon: general.faviconUrl || '/favicon.ico' },
    // No canonical here: it would be inherited by every page that doesn't set its own.
    alternates: {
      types: { 'application/rss+xml': [{ url: '/news/feed.xml', title: `${siteName} news` }] },
    },
    robots: {
      index: true,
      follow: true,
      // Lets Google show large image previews and full snippets in Search and Discover.
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    openGraph: {
      type: 'website',
      locale: 'en_MT',
      siteName,
      title: siteName,
      description,
      url: SITE_URL,
      images: shareImage,
    },
    twitter: { card: 'summary_large_image' },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [general, footer] = await Promise.all([getGeneralGlobal(), getFooterGlobal()])
  const siteName = general.siteName || DEFAULT_SITE_NAME
  const description = general.siteDescription || DEFAULT_DESCRIPTION

  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <JsonLd
          data={[
            organizationJsonLd({
              name: siteName,
              description,
              logoUrl: general.logoUrl,
              email: footer.contact.email,
              phone: footer.contact.phone,
              sameAs: [footer.social.facebook, footer.social.instagram, footer.social.tiktok],
            }),
            websiteJsonLd({ name: siteName, description }),
          ]}
        />
        <GoogleAnalytics />
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
