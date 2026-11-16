import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

export default function AdsterraMinimalAd() {
  const adContainerRef = useRef(null);
  const publisherId = import.meta.env.VITE_ADSTERRA_PUBLISHER_ID;

  useEffect(() => {
    // If user provided a real Adsterra script / zone ID
    if (publisherId && publisherId !== 'sample_adsterra_key' && adContainerRef.current) {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = `//www.profitablecreativeformat.com/${publisherId}/invoke.js`;
        adContainerRef.current.appendChild(script);
      } catch (err) {
        console.warn('Adsterra script injection error:', err);
      }
    }
  }, [publisherId]);

  return (
    <div
      ref={adContainerRef}
      className="relative overflow-hidden rounded-2xl bg-[#0c0c0f] border border-white/5 p-3 text-left transition-all"
    >
      <div className="flex items-center justify-between text-[10px] uppercase font-mono text-neutral-500 mb-1">
        <span>Sponsor Ad</span>
        <span className="flex items-center gap-1 text-neutral-400">
          Adsterra <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>

      <div className="flex items-center gap-3 py-1">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
          ADS
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-neutral-200 truncate">Earn Crypto & Tournament Rewards</p>
          <p className="text-[11px] text-neutral-400 truncate">Discover trending games & bonus tokens today.</p>
        </div>
      </div>
    </div>
  );
}
