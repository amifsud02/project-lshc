import "./globals.css";
import "./fonts.css";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: "La Salle Handball Club",
  description: "An amateur club with a professional mentality.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-R7TBRHBEYQ"
          />
          <Script id="google-analytics">
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-R7TBRHBEYQ');
            `}
          </Script>
        </div>
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
