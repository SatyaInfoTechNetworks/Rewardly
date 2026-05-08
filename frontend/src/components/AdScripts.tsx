"use client";

import Script from 'next/script';
import { useEffect } from 'react';

export default function AdScripts() {
  useEffect(() => {
    console.log("🚀 AdScripts Component Mounted");
    
    // Manual injection of RichAds to ensure it bypasses any potential script blocking
    if (!(window as any).richAdsInitialized) {
      const script = document.createElement('script');
      script.src = "https://richinfo.co/richpartners/telegram/js/tg-ob.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ RichAds Script Loaded (Manual Injection)");
        if (typeof (window as any).TelegramAdsController !== 'undefined') {
          try {
            // Create instance exactly like the snippet provided
            const controller = new (window as any).TelegramAdsController();
            controller.initialize({
              pubId: "1010920",
              appId: "7351",
            });
            
            // Assign instance globally as per snippet
            (window as any).TelegramAdsController = controller;
            (window as any).richAdsInstance = controller;
            (window as any).richAdsReady = true;
            (window as any).richAdsInitialized = true;
            console.log("✅ RichAds Initialized Successfully (Manual)");
          } catch (e) {
            console.error("❌ RichAds Init Error:", e);
          }
        } else {
          console.error("❌ RichAds Controller class not found after script load");
        }
      };
      script.onerror = () => {
        console.error("❌ RichAds Script failed to load (Network/Adblock)");
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <Script 
        src="//libtl.com/sdk.js" 
        data-zone="10977311" 
        data-sdk="show_10977311" 
        strategy="afterInteractive"
        onLoad={() => { 
          (window as any).monetagReady = true; 
          console.log("✅ Monetag Ready"); 
        }}
      />
    </>
  );
}
