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
          const gameId = (settings.adsgram_block_id || "29726").toString().replace(/\D/g, '');
          const checkinId = (settings.adsgram_checkin_block_id || "30393").toString().replace(/\D/g, '');
          const drawId = (settings.adsgram_draw_block_id || "30394").toString().replace(/\D/g, '');
          const visitId = "int-" + (settings.adsgram_visit_block_id || "30395").toString().replace(/\D/g, '');

          (window as any).AdsgramController = (window as any).Adsgram.init({ blockId: gameId });
          (window as any).__ADSGRAM_CHECKIN_BLOCK_ID__ = checkinId;
          (window as any).__ADSGRAM_DRAW_BLOCK_ID__ = drawId;
          (window as any).__ADSGRAM_VISIT_BLOCK_ID__ = visitId;

          console.log("✅ AdsGram Configured:", {
            game: gameId,
            checkin: checkinId,
            draw: drawId,
            visit: visitId
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
