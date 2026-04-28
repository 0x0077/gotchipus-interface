"use client";

import { useState, useEffect } from "react";
import { useSvgLayers } from "@/hooks/useSvgLayers";
import { composePfp } from "@/src/utils/composePfp";

interface GotchiPfpProps {
  tokenId: string;
  size?: number;
  className?: string;
}

export function GotchiPfp({ tokenId, size = 40, className = "" }: GotchiPfpProps) {
  const { wearableIndices, isLoading: isSvgLoading } = useSvgLayers(tokenId);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isSvgLoading) return;
    let cancelled = false;

    composePfp(wearableIndices, size * 2).then((dataUrl) => {
      if (!cancelled) setPfpUrl(dataUrl);
    });

    return () => { cancelled = true; };
  }, [wearableIndices, isSvgLoading, size]);

  if (isSvgLoading || !pfpUrl) {
    return (
      <div
        className={`border border-[#808080] overflow-hidden bg-[#d4d0c8] flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[8px] text-[#808080]">...</span>
      </div>
    );
  }

  return (
    <div
      className={`border border-[#808080] overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={pfpUrl}
        alt={`Gotchi #${tokenId}`}
        width={size}
        height={size}
        className="block [image-rendering:pixelated]"
      />
    </div>
  );
}
