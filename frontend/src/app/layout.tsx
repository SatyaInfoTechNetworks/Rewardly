import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Rewardly | Fun & Easy Rewards",
  description: "Join the ultimate reward experience. Earn coins, play games, and get real rewards with Rewardly.",
  keywords: ["rewards", "earnings", "gift cards", "gaming", "fintech"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Script 
          src="//libtl.com/sdk.js" 
          data-zone="10977311" 
          data-sdk="show_10977311" 
          strategy="afterInteractive"
          onLoad={() => { (window as any).monetagReady = true; console.log("✅ Monetag Ready"); }}
        />
        <Script 
          src="https://richinfo.co/richpartners/telegram/js/tg-ob.js" 
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof (window as any).TelegramAdsController !== 'undefined') {
              const tg = (window as any).Telegram?.WebApp;
              if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                try {
                  (window as any).TelegramAdsController = new (window as any).TelegramAdsController();
                  (window as any).TelegramAdsController.initialize({
                    pubId: "1010920",
                    appId: "7351",
                  });
                  (window as any).richAdsReady = true;
                  console.log("✅ RichAds Initialized");
                } catch (e) {
                  console.error("RichAds Init Error:", e);
                }
              }
            }
          }}
        />
      </head>
      <body className={`${poppins.variable} font-poppins antialiased`}>
        {children}
      </body>
    </html>
  );
}
