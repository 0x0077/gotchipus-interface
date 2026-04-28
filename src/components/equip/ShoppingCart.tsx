'use client'

import SvgIcon from "@/components/gotchiSvg/SvgIcon"
import { Win98Loading } from "@/components/ui/win98-loading"
import { CartItem, WearableItem, RARITY } from "./types"

interface ShoppingCartProps {
  cart: CartItem[];
  items: WearableItem[];
  isConnected: boolean;
  isPurchasing: boolean;
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onClose: () => void;
  onPurchase: () => void;
}

export const ShoppingCart = ({
  cart,
  items,
  isConnected,
  isPurchasing,
  onUpdateQty,
  onRemove,
  onClear,
  onClose,
  onPurchase,
}: ShoppingCartProps) => {
  const total = cart.reduce((s, c) => {
    const it = items.find(i => i.id === c.id);
    return s + (it ? it.price * c.quantity : 0);
  }, 0);
  const count = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 bg-black/30 z-[3000]" />
      <div
        className="absolute top-0 right-0 bottom-0 w-[310px] z-[3001] bg-win98-face flex flex-col animate-[slideIn_0.2s_ease]"
        style={{ boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, -4px 0 0 #000' }}
      >
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-[5px] py-0.5 pr-[3px] flex items-center justify-between select-none min-h-[18px]">
          <div className="flex items-center gap-1">
            <span className="text-[11px]">&#9632;</span>
            <span className="text-white font-bold text-[11px] tracking-wide text-shadow-win98">Cart ({count} items)</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-3.5 shadow-win98-outer bg-win98-face border-none text-[9px] cursor-pointer flex items-center justify-center p-0 font-bold"
          >&#10005;</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto p-1">
          {cart.length === 0 ? (
            <div className="text-center p-10 text-[#808080] text-[11px]">
              <div className="text-[28px] mb-1.5 opacity-40">&#9632;</div>
              Your cart is empty.
            </div>
          ) : cart.map(c => {
            const it = items.find(i => i.id === c.id);
            if (!it) return null;
            const r = RARITY[it.rarity];
            return (
              <div
                key={c.id}
                className="shadow-win98-inner bg-white p-1.5 mb-[3px] flex gap-1.5 items-center"
                style={{ borderLeft: `3px solid ${r.color}` }}
              >
                <div
                  className="w-9 h-9 shrink-0 shadow-win98-inner flex items-center justify-center overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${r.glow}, #f0a0a0)` }}
                >
                  <SvgIcon imagePath={it.imagePath} alt={it.name} width={32} height={32} className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{it.name}</div>
                  <div className="text-[10px] text-[#000080] font-bold font-mono">{(it.price * c.quantity).toFixed(2)} USDC</div>
                </div>
                <div className="flex gap-px items-center">
                  <button
                    onClick={() => onUpdateQty(c.id, c.quantity - 1)}
                    disabled={c.quantity <= 1}
                    className={`shadow-win98-outer bg-win98-face border-none px-2 py-0.5 text-[11px] ${c.quantity <= 1 ? 'cursor-default' : 'cursor-pointer'}`}
                  >−</button>
                  <div className="shadow-win98-inner bg-white w-[22px] text-center py-px text-[11px] font-mono">{c.quantity}</div>
                  <button
                    onClick={() => onUpdateQty(c.id, c.quantity + 1)}
                    className="shadow-win98-outer bg-win98-face border-none px-2 py-0.5 text-[11px] cursor-pointer"
                  >+</button>
                  <button
                    onClick={() => onRemove(c.id)}
                    className="bg-transparent border-none text-[9px] text-[#808080] cursor-pointer ml-0.5"
                  >&#10005;</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#808080] p-1.5 bg-[#d4d0c8]">
          <div className="shadow-win98-inner bg-white px-2.5 py-2 mb-[5px] flex justify-between items-baseline">
            <span className="text-xs font-bold">Total:</span>
            <div className="text-right">
              <div className="text-base font-bold text-[#000080] font-mono">{total.toFixed(2)} USDC</div>
              <div className="text-[9px] text-[#808080]">{count} item(s)</div>
            </div>
          </div>

          {isConnected ? (
            <>
              <button
                onClick={onPurchase}
                disabled={isPurchasing || cart.length === 0}
                className={`w-full py-[7px] text-xs mb-[3px] shadow-win98-outer bg-[#000080] text-white border-none font-bold ${isPurchasing ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
              >
                {isPurchasing ? (
                  <Win98Loading className="w-full p-1" text="Processing..." />
                ) : (
                  `Buy Now (${total.toFixed(2)} USDC)`
                )}
              </button>
              <button
                onClick={onClear}
                className="w-full py-1 text-[11px] shadow-win98-outer bg-win98-face border-none cursor-pointer"
              >Clear Cart</button>
            </>
          ) : (
            <button className="w-full py-[7px] text-xs shadow-win98-outer bg-[#000080] text-white border-none font-bold cursor-pointer">
              Connect Wallet to Buy
            </button>
          )}
        </div>
      </div>
    </>
  );
};
