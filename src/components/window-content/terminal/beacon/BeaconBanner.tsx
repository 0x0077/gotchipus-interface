"use client";

import { useState } from "react";
import Image from "next/image";

interface BeaconBannerProps {
  beaconIds: string[];
  isLoading: boolean;
  onSummon: (beaconId: string) => void;
}

export function BeaconBanner({ beaconIds, isLoading, onSummon }: BeaconBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isLoading && beaconIds.length === 0) return null;

  return (
    <div className="win98-bezel bg-win98-face mb-2 flex-shrink-0">
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`px-3 py-2 cursor-pointer select-none flex items-center gap-3 bg-gradient-to-r from-[#000080]/10 via-[#1084d0]/5 to-transparent hover:from-[#000080]/15 hover:via-[#1084d0]/10 transition-colors ${
          expanded ? "border-b border-[#808080]" : ""
        }`}
      >
        {/* Animated icon */}
        <div className="w-6 h-6 relative flex-shrink-0 border border-[#808080] shadow-win98-inner bg-gradient-to-b from-[#0a1628] to-[#1a3a6a] rounded-sm overflow-hidden">
          <Image src="/beacon-summon.gif" alt="" fill className="object-contain" unoptimized />
        </div>

        {/* Count badge */}
        <span className="bg-[#000080] text-white text-[10px] font-bold px-1.5 py-px font-mono min-w-[20px] text-center">
          {isLoading ? "..." : beaconIds.length}
        </span>

        {/* Label */}
        <div className="flex flex-col gap-0">
          <span className="text-xs font-bold text-[#000080] leading-tight">
            {isLoading ? "Loading Beacons..." : "Unsummoned Beacons"}
          </span>
          <span className="text-[9px] text-[#808080] leading-tight">
            Click to expand · Select one to summon a Gotchipus
          </span>
        </div>

        <span className="flex-1" />

        {/* Summon hint */}
        {!expanded && beaconIds.length > 0 && (
          <span className="text-[9px] text-[#000080] font-bold border border-[#000080] px-1.5 py-0.5 bg-white/50 hidden sm:inline">
            ✦ SUMMON
          </span>
        )}

        {/* Chevron */}
        <span className="text-xs text-[#808080] font-mono font-bold">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded grid */}
      {expanded && (
        <div className="p-2 flex flex-wrap gap-1.5 bg-[#d4d0c8]">
          {beaconIds.map((id) => (
            <div
              key={id}
              onClick={() => onSummon(id)}
              className="w-[76px] win98-bezel-inset bg-[#e8e4dc] flex flex-col items-center p-1 cursor-pointer hover:outline hover:outline-2 hover:outline-[#000080] hover:-outline-offset-2 active:bg-[#d0e8ff] transition-colors group"
            >
              <div className="w-[62px] h-[52px] bg-gradient-to-b from-[#0a1628] to-[#1a3a6a] flex items-center justify-center relative overflow-hidden border border-[#404040]">
                <Image
                  src="/beacon-summon.gif"
                  alt={`Beacon #${id}`}
                  fill
                  className="object-contain p-0.5"
                  unoptimized
                />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="font-mono text-[9px] font-bold text-[#000080]">#{id}</span>
                <span className="text-[8px] text-[#808080] group-hover:text-[#000080] transition-colors">summon</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
