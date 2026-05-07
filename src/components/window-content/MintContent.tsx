"use client";

import { useState, useEffect, useCallback, memo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useContractWrite, useContractRead } from "@/src/hooks/useContract";
import { useAccount, useBalance } from "wagmi";
import { parseEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import { observer } from "mobx-react-lite";
import { useStores } from "@stores/context";
import { CustomConnectButton } from "@/components/footer/CustomConnectButton";
import EnhancedGotchiSvg from "@/components/gotchiSvg/EnhancedGotchiSvg";
import { WearableIndices } from "@/hooks/useSvgLayers";
import { useWindowMode } from "@/hooks/useWindowMode";

// ── Constants ──

const NATIVE_SYMBOL = "ETH";
const NATIVE_DECIMALS = 18;
const PRICE = 0.006; // matches LibGotchiConstants.MINT_PRICE on-chain
const PRICE_RAW = parseEther(PRICE.toString());
const MAX_SUPPLY = 20000;

const GRID_GOTCHIS = [
  { backgroundIndex: 1, bodyIndex: 1 },
  { backgroundIndex: 5, bodyIndex: 3 },
  { backgroundIndex: 9, bodyIndex: 5 },
  { backgroundIndex: 3, bodyIndex: 7 },
];

const ROTATING_PARTS = [
  { key: "eyeIndex", max: 13 },
  { key: "handIndex", max: 86 },
  { key: "headIndex", max: 45 },
  { key: "clothesIndex", max: 43 },
  { key: "faceIndex", max: 27 },
  { key: "mouthIndex", max: 11 },
] as const;

type RotatingState = Pick<WearableIndices, "eyeIndex" | "handIndex" | "headIndex" | "clothesIndex" | "faceIndex" | "mouthIndex">;

function randomRotatingState(): RotatingState {
  return {
    eyeIndex: Math.floor(Math.random() * 13) + 1,
    handIndex: Math.floor(Math.random() * 86) + 1,
    headIndex: Math.floor(Math.random() * 45) + 1,
    clothesIndex: Math.floor(Math.random() * 43) + 1,
    faceIndex: Math.floor(Math.random() * 27) + 1,
    mouthIndex: Math.floor(Math.random() * 11) + 1,
  };
}

// ── Sub-components ──

function W98Btn({ children, onClick, disabled, primary, className = "" }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; primary?: boolean; className?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      disabled={disabled}
      className={`font-win98 text-[11px] px-3 py-1 select-none
        ${disabled ? "bg-[#c8c8c8] text-[#808080] cursor-not-allowed" : "bg-win98-face text-black cursor-pointer"}
        ${primary && !disabled ? "outline outline-1 outline-black -outline-offset-4" : ""}
        ${pressed ? "w98-sunken" : "w98-raised"}
        ${className}`}
    >
      {children}
    </button>
  );
}

const GridPreviewCell = memo(({ backgroundIndex, bodyIndex, rotating }: {
  backgroundIndex: number; bodyIndex: number; rotating: RotatingState;
}) => {
  const indices: WearableIndices = { backgroundIndex, bodyIndex, ...rotating };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#000040]">
      <EnhancedGotchiSvg wearableIndices={indices} showBackground width="100%" height="100%" />
    </div>
  );
});

// ── Main Component ──

const MintContent = observer(() => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { walletStore } = useStores();
  const { address } = useAccount();
  const { isMobile } = useWindowMode();

  const [qty, setQty] = useState(1);
  const [mintStep, setMintStep] = useState<"idle" | "minting" | "done">("idle");
  const [mintError_, setMintError_] = useState<string | null>(null);
  const [minted, setMinted] = useState(0);

  const [gridStates, setGridStates] = useState<RotatingState[]>(() =>
    GRID_GOTCHIS.map(() => randomRotatingState())
  );

  // ── Mint tx ──
  const { contractWrite, isConfirmed: mintConfirmed, error: mintError } = useContractWrite();

  // ── Read: totalSupply ──
  const { data: totalSupply, refetch: refetchTotalSupply } = useContractRead("totalSupply", [], {
    enabled: false,
  });

  // ── Read: whitelist status ──
  const { data: whitelistData, refetch: refetchWhitelist } = useContractRead(
    "isWhitelisted",
    address ? [address] : [],
    { enabled: !!address }
  );
  const isWhitelisted = Boolean(whitelistData);

  // ── Read: native ETH balance ──
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const balance = nativeBalance ? Number(nativeBalance.value) / 10 ** NATIVE_DECIMALS : 0;
  const balanceRaw = nativeBalance?.value ?? BigInt(0);

  useEffect(() => {
    if (totalSupply) setMinted(Number(totalSupply));
  }, [totalSupply]);

  useEffect(() => {
    const timer = setInterval(() => {
      refetchTotalSupply();
      if (address) {
        refetchNativeBalance();
        refetchWhitelist();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [refetchTotalSupply, refetchNativeBalance, refetchWhitelist, address]);

  // Whitelist forces qty=1
  useEffect(() => {
    if (isWhitelisted) setQty(1);
  }, [isWhitelisted]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGridStates(prev =>
        prev.map(cell => {
          const part = ROTATING_PARTS[Math.floor(Math.random() * ROTATING_PARTS.length)];
          return { ...cell, [part.key]: Math.floor(Math.random() * part.max) + 1 };
        })
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // When mint confirmed
  useEffect(() => {
    if (mintConfirmed && mintStep === "minting") {
      setMintStep("done");
      refetchNativeBalance();
      refetchWhitelist();
      refetchTotalSupply();
      toast({ title: t("toast.txConfirmed"), description: t("toast.txConfirmedDesc") });
    }
  }, [mintConfirmed]);

  // On any error
  useEffect(() => {
    if (mintError && mintStep === "minting") {
      setMintStep("idle");
      setMintError_("Mint failed: " + (mintError as Error).message?.slice(0, 80));
    }
  }, [mintError]);

  const handleMint = useCallback(() => {
    setMintError_(null);
    setMintStep("minting");
    if (isWhitelisted) {
      contractWrite("mint", [1]);
    } else {
      const totalCost = PRICE_RAW * BigInt(qty);
      contractWrite("mint", [qty], totalCost);
    }
  }, [qty, isWhitelisted, contractWrite]);

  const handleQtyInput = (val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) setQty(1);
    else if (n > 50) setQty(50);
    else setQty(n);
  };

  const cost = isWhitelisted ? 0 : qty * PRICE;
  const totalCostRaw = PRICE_RAW * BigInt(qty);
  const broke = !isWhitelisted && balanceRaw < totalCostRaw;
  const isSoldOut = minted >= MAX_SUPPLY;
  const isProcessing = mintStep === "minting";
  const qtyLocked = isWhitelisted || isSoldOut;

  return (
    <div className="w-full h-full bg-win98-face font-win98">
      <style>{`
        .w98-raised {
          border-top: 1px solid #fff; border-left: 1px solid #fff;
          border-right: 1px solid #404040; border-bottom: 1px solid #404040;
          box-shadow: 1px 1px 0 #000, inset 1px 1px 0 #fff;
        }
        .w98-sunken {
          border-top: 1px solid #404040; border-left: 1px solid #404040;
          border-right: 1px solid #fff; border-bottom: 1px solid #fff;
          box-shadow: inset 1px 1px 0 #808080;
        }
        @keyframes pulse { 0%,100% { opacity:.5 } 50% { opacity:1 } }
        @keyframes mintGlow { 0% { box-shadow:inset 0 0 20px rgba(255,215,0,0) } 50% { box-shadow:inset 0 0 20px rgba(255,215,0,.25) } 100% { box-shadow:inset 0 0 20px rgba(255,215,0,0) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div className={`flex w-full h-full ${isMobile ? 'flex-col' : ''}`}>

        {/* LEFT: 2x2 grid preview */}
        <div className={`aspect-square ${isMobile ? 'w-full' : 'h-full'} shrink-0 grid grid-cols-2 grid-rows-2 gap-[3px] p-[3px] bg-[#1a1a2a] relative`}>
          {GRID_GOTCHIS.map((g, i) => (
            <div key={i} className="w98-sunken overflow-hidden">
              <GridPreviewCell backgroundIndex={g.backgroundIndex} bodyIndex={g.bodyIndex} rotating={gridStates[i]} />
            </div>
          ))}
          {/* LIVE badge */}
          <div className="absolute top-[7px] left-[7px] flex items-center gap-[3px] bg-green-900/90 px-1.5 py-px z-10">
            <div className="w-1 h-1 rounded-full bg-[#4f4] animate-[pulse_1.5s_infinite]" />
            <span className="font-courier text-[8px] text-white font-bold tracking-wider">MINT LIVE</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col min-w-0 px-3 py-2.5 justify-between">

          {/* Header */}
          <div className="mb-3">
            <h2 className="font-win98 text-base font-bold text-black mb-1">Mint Your Gotchipus</h2>
            <p className="font-win98 text-[10px] text-[#404040] leading-snug">
              Mint a Gotchipus egg — summon it later to reveal its rarity and traits.
            </p>
          </div>

          {/* Whitelist banner */}
          {isWhitelisted && (
            <div className="w98-sunken bg-[#fffbe6] border border-[#bfa100] px-2.5 py-1.5 mb-3 flex items-center gap-2">
              <span className="text-[#bfa100] text-sm">{"\u2605"}</span>
              <div className="flex-1">
                <div className="font-win98 text-[10px] font-bold text-[#7a6a00]">Whitelist detected</div>
                <div className="font-win98 text-[9px] text-[#7a6a00] leading-tight">Free mint 1 Gotchipus — no payment required.</div>
              </div>
            </div>
          )}

          {/* Price + Supply */}
          <div className="w98-sunken bg-white flex items-center justify-between px-2.5 py-2 mb-3">
            <div>
              <div className="font-win98 text-[9px] font-bold text-[#404040] mb-px">Price per mint</div>
              <div className="flex items-baseline gap-1">
                {isWhitelisted ? (
                  <>
                    <span className="font-courier text-xl font-bold text-[#008000]">FREE</span>
                    <span className="font-win98 text-[10px] text-[#404040] line-through">{PRICE} {NATIVE_SYMBOL}</span>
                  </>
                ) : (
                  <>
                    <span className="font-courier text-xl font-bold text-black">{PRICE}</span>
                    <span className="font-win98 text-[10px] text-[#404040]">{NATIVE_SYMBOL}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-win98 text-[9px] font-bold text-[#404040] mb-px">Minted</div>
              <div className="font-courier text-[13px] font-bold text-black">
                {minted.toLocaleString()}
                <span className="text-[#404040] font-normal text-[10px]"> / {MAX_SUPPLY.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-3">
            <div className="font-win98 text-[9px] font-bold text-[#404040] mb-1">
              How many to mint{isWhitelisted && <span className="text-[#bfa100]"> (locked to 1 for whitelist)</span>}
            </div>
            <div className="flex items-center">
              <W98Btn
                onClick={() => qty > 1 && setQty(qty - 1)}
                disabled={qtyLocked || qty <= 1}
                className="!w-8 !h-8 !p-0 flex items-center justify-center !text-sm !font-bold"
              >
                {"\u2212"}
              </W98Btn>
              <input
                type="number" min={1} max={50} value={qty}
                onChange={e => handleQtyInput(e.target.value)}
                disabled={qtyLocked}
                className={`flex-1 h-8 font-courier text-base font-bold text-center bg-white text-black
                  border-t border-t-[#404040] border-b border-b-white border-l-0 border-r-0
                  outline-none ${qtyLocked ? "opacity-50" : ""}`}
              />
              <W98Btn
                onClick={() => qty < 50 && setQty(qty + 1)}
                disabled={qtyLocked || qty >= 50}
                className="!w-8 !h-8 !p-0 flex items-center justify-center !text-sm !font-bold"
              >
                +
              </W98Btn>
            </div>
            <div className="flex gap-[3px] mt-1">
              {[1, 3, 5, 10].map(n => (
                <div
                  key={n}
                  onClick={() => !qtyLocked && setQty(n)}
                  className={`flex-1 text-center py-[3px] font-courier text-[10px] font-bold transition-all
                    ${qtyLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    ${qty === n ? "bg-[#000080] text-white border border-[#000080]" : "bg-white text-black w98-sunken"}`}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Checkout */}
          <div className="w98-raised bg-win98-face p-2">
            <div className="flex justify-between mb-1">
              <span className="font-win98 text-[10px] text-[#404040]">
                {isWhitelisted
                  ? "Whitelist mint \u00D7 1"
                  : `${qty} ${qty === 1 ? "mint" : "mints"} \u00D7 ${PRICE} ${NATIVE_SYMBOL}`}
              </span>
              <span className="font-courier text-xs font-bold text-black">
                {isWhitelisted ? "FREE" : `${cost} ${NATIVE_SYMBOL}`}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-win98 text-[10px] text-[#404040]">Your {NATIVE_SYMBOL} balance</span>
              <span className={`font-courier text-[10px] font-bold ${broke ? "text-[#cc0000]" : "text-[#008000]"}`}>
                {broke && "\u2717 "}{balance.toFixed(4)} {NATIVE_SYMBOL}
              </span>
            </div>

            {/* Error display */}
            {mintError_ && (
              <div className="px-2 py-1.5 bg-red-50 border border-red-400 text-xs mb-2">
                <p className="font-bold text-red-700 mb-0.5">Failed</p>
                <p className="text-red-600 break-all">{mintError_}</p>
              </div>
            )}

            {/* Success display */}
            {mintStep === "done" && (
              <div className="px-2 py-1.5 bg-[#f0fff0] border border-[#008000] text-xs mb-2">
                <p className="font-bold text-[#008000]">{"\u2713"} Mint successful! {qty} Gotchipus minted.</p>
              </div>
            )}

            {!walletStore.isConnected ? (
              <div className="w98-raised bg-win98-face px-3 py-2 flex justify-center">
                <CustomConnectButton />
              </div>
            ) : mintStep === "done" ? (
              <W98Btn
                primary
                onClick={() => setMintStep("idle")}
                className="!w-full !py-2.5 !px-4 !text-[13px] !font-bold flex items-center justify-center gap-1.5 tracking-wide"
              >
                Mint More
              </W98Btn>
            ) : (
              <W98Btn
                primary
                disabled={isProcessing || broke || isSoldOut}
                onClick={handleMint}
                className={`!w-full !py-2.5 !px-4 !text-[13px] !font-bold flex items-center justify-center gap-1.5 tracking-wide
                  ${isProcessing ? "animate-[mintGlow_1.5s_infinite]" : ""}`}
              >
                {isProcessing ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-[#000080] border-t-transparent rounded-full animate-spin" />
                    Minting...
                  </>
                ) : isSoldOut ? "Sold Out" : broke ? `Insufficient ${NATIVE_SYMBOL}` : isWhitelisted ? (
                  <>{"\u2605"} Claim Whitelist Mint</>
                ) : (
                  <>{"\u2726"} Mint {qty} Gotchipus</>
                )}
              </W98Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MintContent;
