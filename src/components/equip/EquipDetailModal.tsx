'use client'

import { useState } from "react"
import SvgIcon from "@/components/gotchiSvg/SvgIcon"
import { WearableItem, RARITY } from "./types"
import { WearableShareCardModal } from "./WearableShareCardModal"

interface EquipDetailModalProps {
  item: WearableItem | null;
  onClose: () => void;
  inCart: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onTryOn: (item: WearableItem) => void;
  isTrying: boolean;
}

export const EquipDetailModal = ({ item, onClose, inCart, onAdd, onRemove, onTryOn, isTrying }: EquipDetailModalProps) => {
  const [showShareCard, setShowShareCard] = useState(false);
  if (!item) return null;
  const r = RARITY[item.rarity];

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 bg-black/35 z-[2000]" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] z-[2001] bg-win98-face animate-[modalIn_0.15s_ease]"
        style={{ boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 4px 4px 0 #000' }}
      >
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-[5px] py-0.5 pr-[3px] flex items-center justify-between select-none min-h-[18px]">
          <span className="text-white font-bold text-[11px] tracking-wide text-shadow-win98">{item.name}</span>
          <button
            onClick={onClose}
            className="w-4 h-3.5 shadow-win98-outer bg-win98-face border-none text-[9px] cursor-pointer flex items-center justify-center p-0 font-bold"
          >&#10005;</button>
        </div>

        {/* Image */}
        <div
          className="h-[180px] m-[3px] shadow-win98-inner flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${r.glow}, #f0a0a0 40%, #f0a0a0 60%, ${r.glow})` }}
        >
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #000 3px, #000 4px)' }}
          />
          <SvgIcon
            imagePath={item.imagePath}
            alt={item.name}
            width={160}
            height={160}
            className="object-contain"
            style={{ filter: `drop-shadow(0 0 16px ${r.color}44)` }}
          />
        </div>

        {/* Details */}
        <div className="px-2.5 pt-1.5 pb-2.5">
          {/* Rarity + Price */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <span
                className="px-[5px] text-[9px] font-bold tracking-wider uppercase inline-block"
                style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}
              >{item.rarity}</span>
              <div className="text-[10px] text-[#808080] mt-[3px]">
                {item.category} Wearable · #{item.id}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-[#808080]">Price</div>
              <div className="text-[18px] font-bold text-[#000080] font-mono">
                {item.price}<span className="text-[11px] text-[#404040] ml-[3px]">USDC</span>
              </div>
            </div>
          </div>

          {/* Attribute Bonuses */}
          {Object.keys(item.stats).length > 0 && (
            <div className="shadow-win98-inner bg-white p-2 mb-2">
              <div className="text-[9px] text-[#808080] tracking-widest uppercase mb-[5px]">
                Attribute Bonuses
              </div>
              {Object.entries(item.stats).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 mb-[3px]">
                  <span className="w-7 text-[10px] text-[#404040] font-bold font-mono">{k}</span>
                  <div
                    className="flex-1 h-2 bg-win98-highlight overflow-hidden"
                    style={{ boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff' }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(v * 15, 100)}%`,
                        background: `linear-gradient(90deg, ${r.color}88, ${r.color})`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#000080] font-bold font-mono w-5 text-right">+{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-[3px]">
            <button
              onClick={() => onTryOn(item)}
              className={`${isTrying ? 'shadow-win98-inner' : 'shadow-win98-outer'} bg-win98-face border-none px-3 py-[5px] text-[11px] cursor-pointer`}
            >
              {isTrying ? 'Previewing' : 'Try On'}
            </button>
            <button
              onClick={() => setShowShareCard(true)}
              className="shadow-win98-outer bg-win98-face border-none px-3 py-[5px] text-[11px] cursor-pointer"
            >
              Share
            </button>
            <div className="flex-1">
              {inCart ? (
                <button
                  onClick={onRemove}
                  className="w-full py-[5px] shadow-win98-outer bg-win98-face border-none text-[11px] cursor-pointer"
                >Remove from Cart</button>
              ) : (
                <button
                  onClick={onAdd}
                  className="w-full py-[5px] shadow-win98-outer bg-[#000080] text-white border-none text-xs font-bold cursor-pointer"
                >Add to Cart — {item.price} USDC</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showShareCard && (
        <WearableShareCardModal
          item={item}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
};
