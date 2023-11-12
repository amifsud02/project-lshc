"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
const AdSense = ({adSlot}: {adSlot: string}) => {
  useEffect(() => {
    const scriptElement = document.querySelector(
      'script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6327648024245847"]'
    )

    console.log(scriptElement);

    const handleScriptLoad = () => {
      try {
        if (window.adsbygoogle) {
          console.log('pushing ads');
          window.adsbygoogle.push({});
        } else {
          scriptElement!.addEventListener("load", handleScriptLoad);
          console.log("waiting until adsense lib is laoded");
        }
      } catch (err) {
        console.log("error in adsense", err)
      }
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-6327648024245847" // Replace with your publisher ID
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

export default AdSense;
