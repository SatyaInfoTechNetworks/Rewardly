"use client";

import Script from 'next/script';
import { useEffect } from 'react';

export default function AdScripts() {
  useEffect(() => {
    const initAds = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rewardlyapi.satyainfotechnetworks.com'}/api/settings`);
        const settings = await res.json();
        
        if ((window as any).Adsgram) {
          (window as any).AdsgramController = (window as any).Adsgram.init({ blockId: settings.adsgram_block_id || "29726" });
          (window as any).__ADSGRAM_CHECKIN_BLOCK_ID__ = settings.adsgram_checkin_block_id || "30393";
          (window as any).__ADSGRAM_DRAW_BLOCK_ID__ = settings.adsgram_draw_block_id || "30393";
          console.log("✅ AdsGram Configured:", {
            game: settings.adsgram_block_id || "29726",
            checkin: settings.adsgram_checkin_block_id || "30393",
            draw: settings.adsgram_draw_block_id || "30393"
          });
        }
      } catch (err) {
        console.error("Failed to load ad settings:", err);
      }
    };
    initAds();
  }, []);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <Script src="https://sad.adsgram.ai/js/sad.min.js" strategy="afterInteractive" />
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
