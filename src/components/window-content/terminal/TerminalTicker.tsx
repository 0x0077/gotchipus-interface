"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function TerminalTicker() {
  const { t } = useTranslation();

  const TICKER_ITEMS = [
    t('ticker.item1'), t('ticker.item2'), t('ticker.item3'), t('ticker.item4'),
    t('ticker.item5'), t('ticker.item6'), t('ticker.item7'), t('ticker.item8')
  ];
  const [tickerOffset, setTickerOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-6 bg-white win98-bezel-inset overflow-hidden flex items-center flex-shrink-0 mx-1 mb-1">
      <div
        className="flex gap-8 whitespace-nowrap text-xs text-[#000080] font-bold"
        style={{ transform: `translateX(${tickerOffset}px)` }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-[#000080]">●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
