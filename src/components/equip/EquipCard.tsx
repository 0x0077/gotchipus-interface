'use client'

import { useState } from "react"
import SvgIcon from "@/components/gotchiSvg/SvgIcon"
import { WearableItem, RARITY } from "./types"

interface EquipCardProps {
  item: WearableItem;
  inCart: boolean;
  isTrying: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onTryOn: (item: WearableItem) => void;
  onPreview: (item: WearableItem) => void;
  index: number;
}

export const EquipCard = ({ item, inCart, isTrying, onAdd, onRemove, onTryOn, onPreview, index }: EquipCardProps) => {
  const [hover, setHover] = useState(false);
  const r = RARITY[item.rarity];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onPreview(item)}
      className={`bg-win98-face cursor-pointer transition-transform duration-150 flex flex-col relative ${isTrying ? '' : 'shadow-win98-outer'}`}
      style={{
        boxShadow: isTrying
          ? `inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 0 0 0 2px ${r.color}`
          : undefined,
        transform: hover ? 'translateY(-2px)' : undefined,
        animation: `cardIn 0.3s ease ${index * 0.03}s both`,
      }}
    >
      {/* Trying indicator */}
      {isTrying && (
        <div
          className="absolute -top-px -left-px -right-px text-white text-[8px] font-bold text-center py-px tracking-wider z-[5]"
          style={{ background: r.color }}
        >
          PREVIEWING
        </div>
      )}

      {/* Image area */}
      <div className={`relative m-0.5 aspect-square shadow-win98-inner flex items-center justify-center overflow-hidden ${isTrying ? 'mt-3.5' : ''}`}>
        <SvgIcon
          imagePath={item.imagePath}
          alt={item.name}
          width={120}
          height={120}
          className="w-full h-full object-contain transition-transform duration-200"
          style={{
            transform: hover ? 'scale(1.12)' : undefined,
            filter: hover ? `drop-shadow(0 0 6px ${r.color}44)` : undefined,
          }}
        />

        {/* Scanline */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none z-[1]"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)' }}
        />

        {/* Top badges */}
        <div className="absolute top-[3px] left-[3px] right-[3px] z-[2] flex justify-between items-start">
          <span
            className="px-[5px] text-[9px] font-bold tracking-wider uppercase inline-block"
            style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}
          >{item.rarity}</span>
          <span className="text-[9px] text-black/35 font-mono bg-white/50 px-[3px]">#{item.id}</span>
        </div>

        {/* Stats pills */}
        <div className="absolute bottom-[3px] left-[3px] right-[3px] z-[2] flex gap-0.5 flex-wrap">
          {Object.entries(item.stats).map(([k, v]) => (
            <span key={k} className="bg-white border border-[#808080] px-1 py-px text-[9px] font-mono inline-flex items-center gap-0.5">
              <span className="text-[#808080]">{k}</span>
              <span className="text-[#000080] font-bold">+{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="px-[5px] pt-1 pb-[5px]">
        <div className="text-[9px] text-[#808080] tracking-wider uppercase mb-px">{item.category}</div>
        <div className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis mb-1">{item.name}</div>
        <div className="flex items-center justify-between gap-[3px]">
          <span className="text-[11px] font-bold text-[#000080] font-mono">
            {item.price} USDC
          </span>
          <div className="flex gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); onTryOn(item); }}
              className={`${isTrying ? 'shadow-win98-inner' : 'shadow-win98-outer'} bg-win98-face border-none px-[5px] py-px text-[9px] cursor-pointer whitespace-nowrap`}
            >
              {isTrying ? 'On' : 'Try'}
            </button>
            {inCart ? (
              <button
                onClick={e => { e.stopPropagation(); onRemove(); }}
                className="shadow-win98-outer bg-win98-face border-none text-[#008000] text-[9px] px-[5px] py-px cursor-pointer"
              >✓</button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onAdd(); }}
                className="shadow-win98-outer bg-win98-face border-none text-[9px] px-[5px] py-px cursor-pointer"
              >+ Cart</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
