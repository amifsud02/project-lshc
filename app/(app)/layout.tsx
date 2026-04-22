import "./globals.css";
import "./fonts.css";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import SiteNavbar from "@/components/Site/SiteNavbar";
import SiteFooter from "@/components/Site/SiteFooter";
import StyledComponentsRegistry from "@/lib/registry";

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
    <html lang="en">
      <body>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-R7TBRHBEYQ"
        />
        <Script id="google-analytics" strategy="afterInteractive">
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
        <Script
          id="adsense"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6327648024245847"
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
