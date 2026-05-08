"use client";

import Script from 'next/script';

export default function AdScripts() {
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
