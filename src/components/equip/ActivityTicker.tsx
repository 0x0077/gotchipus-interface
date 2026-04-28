'use client'

import { useState, useEffect } from "react"

interface ActivityRecord {
  id: string;
  user: string;
  item: string;
  price: number;
  time: string;
  hash: string;
  txType?: string;
}

interface ActivityTickerProps {
  activities: ActivityRecord[];
}

export const ActivityTicker = ({ activities }: ActivityTickerProps) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (activities.length === 0) return;
    const t = setInterval(() => setIdx(p => (p + 1) % activities.length), 3500);
    return () => clearInterval(t);
  }, [activities.length]);

  useEffect(() => {
    setIdx(0);
  }, [activities[0]?.id]);

  if (activities.length === 0) return null;
  const a = activities[idx % activities.length];

  return (
    <div className="shadow-win98-inner bg-white px-2 py-1 mb-1.5 flex items-center gap-1.5 text-[11px]">
      <span className="bg-[#000080] text-white px-1.5 py-px text-[9px] font-bold">LIVE</span>
      <span className="text-[#808080] font-mono text-[10px]">{a.user}</span>
      <span className="text-[#008000] font-bold">{a.txType || 'bought'}</span>
      <span className="font-bold">{a.item}</span>
      <span className="text-[#000080] font-mono font-bold">{a.price} USDC</span>
      <span className="ml-auto text-[#808080] text-[10px]">{a.time}</span>
    </div>
  );
};
