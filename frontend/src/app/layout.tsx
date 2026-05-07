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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
        <script src="//libtl.com/sdk.js" data-zone="10977311" data-sdk="show_10977311" defer></script>
        <script src="https://richinfo.co/richpartners/telegram/js/tg-ob.js" defer></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              if (typeof TelegramAdsController !== 'undefined') {
                window.TelegramAdsController = new TelegramAdsController();
                window.TelegramAdsController.initialize({
                  pubId: "1010920",
                  appId: "7351",
                });
              }
            });
          `
        }} />
      </head>
      <body className={`${poppins.variable} font-poppins antialiased`}>
        {children}
      </body>
    </html>
  );
}
