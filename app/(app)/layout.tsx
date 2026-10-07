import "./globals.css";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import SiteNavbar from "@/components/Site/SiteNavbar";
import SiteFooter from "@/components/Site/SiteFooter";
import StyledComponentsRegistry from "@/lib/registry";
import { AD_CLIENT } from "@/components/AdSense/AdSense";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const title =  "La Salle Handball | Official Website"
const description = "Visit the La Salle Handball Club official website: all the latest news on the team and club, and fixtures."
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}`;

export const metadata = {
  title: title,
    description: description,
    alternates: {
      canonical: canonical
    },
    openGraph: {
        title: title,
        description: description,        
        url: canonical,
    }
};

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
