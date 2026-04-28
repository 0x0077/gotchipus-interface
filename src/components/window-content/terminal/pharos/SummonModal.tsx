"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useContractWrite, useERC6551Read, useChiRegistryRead } from "@/hooks/useContract";
import { ethers } from "ethers";
import { ens_normalize } from "@adraffy/ens-normalize";
import { CHAIN_ID, ZERO_ADDRESS } from "@/lib/constant";
import { PUS_ADDRESS, ERC6551_ACCOUNT_IMPLEMENTATION_ADDRESS } from "@/src/app/blockchain";
import { useToast } from "@/hooks/use-toast";
import { useStores } from "@stores/context";
import { observer } from "mobx-react-lite";
import { CustomConnectButton } from "@/components/footer/CustomConnectButton";
import { Win98Loading } from "@/components/ui/win98-loading";
import { useTranslation } from "react-i18next";
import { getERC6551AccountSalt, getTraitsIndex } from "@/src/utils/contractHepler";
import GotchiSvg from "@/src/components/gotchiSvg/GotchiSvg";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface SummonModalProps {
  pharosId: string;
  onClose: () => void;
  onSummonComplete: () => void;
}

interface GotchipusPreview {
  id: string;
  traitsIndex: number[];
  image: JSX.Element;
}

const SummonModal = observer(({ pharosId, onClose, onSummonComplete }: SummonModalProps) => {
  const { walletStore } = useStores();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { contractWrite, isConfirmed, error } = useContractWrite();

  const [chiName, setChiName] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [isSummoning, setIsSummoning] = useState(false);
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [showRules, setShowRules] = useState(false);

  // Compute TBA
  const salt = getERC6551AccountSalt(CHAIN_ID, Number(pharosId));
  const accountData = useERC6551Read("account", [
    ERC6551_ACCOUNT_IMPLEMENTATION_ADDRESS,
    salt,
    CHAIN_ID,
    PUS_ADDRESS,
    Number(pharosId),
  ]);

  const tokenBoundAccount = (accountData as string) || ZERO_ADDRESS;

  // Generate 5 preview variants
  const gotchipusPreviews = useMemo<GotchipusPreview[]>(() => {
    if (!accountData || tokenBoundAccount === ZERO_ADDRESS) return [];
    return Array(5)
      .fill(0)
      .map((_, index) => {
        const traits = getTraitsIndex(
          Number(pharosId),
          tokenBoundAccount,
          `${walletStore.address}`,
          index
        );
        return {
          id: `${pharosId}-${index}`,
          traitsIndex: traits,
          image: (
            <GotchiSvg
              bgIndex={traits[0]}
              bodyIndex={traits[1]}
              eyeIndex={traits[2]}
              className="w-full h-full"
            />
          ),
        };
      });
  }, [accountData, tokenBoundAccount, pharosId, walletStore.address]);

  const currentPreview = gotchipusPreviews[selectedPreviewIndex];

  // ENS-style name normalization and validation
  const [normalizedName, setNormalizedName] = useState("");
  const [nameError, setNameError] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleChiNameChange = useCallback((raw: string) => {
    setChiName(raw);
    if (!raw) {
      setNormalizedName("");
      setNameError("");
      setDebouncedName("");
      return;
    }
    try {
      const normalized = ens_normalize(raw);
      setNormalizedName(normalized);
      const codePoints = Array.from(normalized).length;
      if (codePoints < 5) {
        setNameError(`Min 5 characters (${codePoints}/5)`);
        setDebouncedName("");
      } else if (codePoints > 64) {
        setNameError(`Max 64 characters (${codePoints}/64)`);
        setDebouncedName("");
      } else {
        setNameError("");
        // Debounce availability check
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedName(normalized), 500);
      }
    } catch (e: any) {
      setNormalizedName("");
      setNameError(e.message?.replace(/[\u200E\u200F]/g, "") || "Invalid name");
      setDebouncedName("");
    }
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // On-chain availability check (auto-disabled when CHI_DIAMOND_ADDRESS is empty)
  const { data: isAvailable, isLoading: isCheckingAvailability } = useChiRegistryRead(
    "isNameAvailable",
    [debouncedName],
    { enabled: !!debouncedName }
  );

  const isNameTaken = debouncedName && isAvailable === false;
  const showNormalizedHint = normalizedName && chiName !== normalizedName && !nameError;

  const hasNameValue = chiName.length > 0;
  const isValidName = hasNameValue && normalizedName.length > 0 && !nameError && !isNameTaken;
  const canSummon = isValidName && stakeAmount && !isInsufficientBalance && !isSummoning;

  const tbaDisplay = tokenBoundAccount !== ZERO_ADDRESS
    ? `${tokenBoundAccount.slice(0, 6)}...${tokenBoundAccount.slice(-4)}`
    : null;

  // Handle summon
  const handleSummon = () => {
    if (!canSummon) return;
    setIsSummoning(true);
    const args = [
      Number(pharosId),
      normalizedName,
      ZERO_ADDRESS,
      ethers.parseEther(stakeAmount),
      selectedPreviewIndex,
    ];
    contractWrite("summonGotchipus", [args], ethers.parseEther(stakeAmount));
    toast({ title: t("toast.txSubmitted"), description: t("toast.txSubmittedDesc") });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast({ title: t("toast.txConfirmed"), description: t("toast.txConfirmedDesc") });
      setIsSummoning(false);
      // Cache chi name to database via resolve endpoint (retry with delay for chain propagation)
      if (normalizedName) {
        const cacheChiName = async (retries = 3, delay = 3000) => {
          for (let i = 0; i < retries; i++) {
            await new Promise((r) => setTimeout(r, delay));
            try {
              const ownerParam = walletStore.address ? `&owner=${walletStore.address}` : "";
              const res = await fetch(`/api/chi/resolve?name=${encodeURIComponent(normalizedName)}&force=true${ownerParam}`);
              const data = await res.json();
              if (data.code === 0) return;
            } catch (err) {
            }
          }
        };
        cacheChiName();
      }
      setTimeout(() => onSummonComplete(), 500);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (error) {
      setIsSummoning(false);
      toast({
        title: t("toast.txCancelled"),
        description: t("toast.txCancelledDesc"),
        variant: "destructive",
      });
    }
  }, [error]);

  const handleStakeAmountChange = (value: string) => {
    const v = value.replace(/[^0-9.]/g, "");
    setStakeAmount(v);
    const userBalance = Number(walletStore.formattedPharos(18));
    setIsInsufficientBalance(Number(v) > userBalance);
  };

  const isLoading = gotchipusPreviews.length === 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-win98-face win98-bezel shadow-[2px_2px_0_#000] w-[520px] max-w-[95vw] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Title bar */}
        <div className="bg-[#000080] px-2 py-1 flex items-center gap-1.5 select-none">
          <span className="text-xs font-bold text-white flex-1">
            Summon Gotchipus — Pharos #{pharosId}
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] w-[18px] h-[18px] transition-colors"
          >
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 flex gap-3">
          {/* Left: Preview */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-[160px] h-[160px] win98-bezel-inset bg-gradient-to-b from-sky-300 via-[#98D8C8] to-[#7BC8A4] flex items-center justify-center relative overflow-hidden">
              {isLoading ? (
                <Win98Loading />
              ) : currentPreview ? (
                <div className="w-full h-full flex items-center justify-center">
                  {currentPreview.image}
                </div>
              ) : null}
            </div>
            {/* Candidate thumbnails */}
            {!isLoading && (
              <div className="flex gap-1">
                {gotchipusPreviews.map((preview, i) => (
                  <div
                    key={preview.id}
                    onClick={() => setSelectedPreviewIndex(i)}
                    className={`w-[28px] h-[28px] border border-[#808080] cursor-pointer relative overflow-hidden flex items-center justify-center
                      ${i === selectedPreviewIndex
                        ? "bg-[#d0e8ff] outline outline-2 outline-[#000080] -outline-offset-2"
                        : "bg-[#e8e4dc] hover:outline hover:outline-1 hover:outline-[#000080]"
                      }`}
                  >
                    <div className="w-full h-full">
                      {preview.image}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Config */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Chi Name */}
            <div>
              <div className="text-[11px] font-bold mb-[3px]">Chi Name</div>
              <div className="flex items-center win98-bezel-inset bg-white">
                <span className="font-mono text-[11px] text-[#808080] pl-1.5 select-none">
                  {"{"}
                </span>
                <input
                  type="text"
                  value={chiName}
                  onChange={(e) => handleChiNameChange(e.target.value)}
                  maxLength={64}
                  placeholder="your-gotchi-name"
                  disabled={isSummoning}
                  className={`flex-1 border-none outline-none font-mono text-[11px] px-0.5 py-1 bg-transparent ${
                    (hasNameValue && (nameError || isNameTaken)) ? "text-[#cc0000]" : "text-black"
                  }`}
                />
                <span className="font-mono text-[11px] pr-1.5 select-none">
                  <span className="text-[#4DE8C2] font-bold">.chi</span>
                  <span className="text-[#808080]">{"}"}</span>
                </span>
              </div>
              <div className="text-[11px] mt-0.5 flex flex-col gap-0">
                {/* Normalized preview */}
                {showNormalizedHint && (
                  <span className="text-[#000080]">
                    Normalized: {normalizedName}
                  </span>
                )}
                {/* Status line */}
                <span className={
                  hasNameValue && !isValidName
                    ? "text-[#cc0000]"
                    : "text-[#808080]"
                }>
                  {!hasNameValue
                    ? "Supports Unicode (CJK, Latin, etc). Min 5 characters."
                    : nameError
                      ? nameError
                      : isNameTaken
                        ? `${normalizedName}.chi is already taken`
                        : isCheckingAvailability && debouncedName
                          ? `Checking ${normalizedName}.chi...`
                          : isValidName
                            ? `${normalizedName}.chi`
                            : "Invalid name"}
                </span>
              </div>
            </div>

            {/* Stake Amount */}
            <div>
              <div className="text-[11px] font-bold mb-[3px]">Stake Amount</div>
              <div className="flex gap-0.5 items-center">
                <div className="flex-1 win98-bezel-inset bg-white flex items-center">
                  <input
                    type="text"
                    value={stakeAmount}
                    onChange={(e) => handleStakeAmountChange(e.target.value)}
                    placeholder="0.0"
                    disabled={isSummoning}
                    className={`flex-1 border-none outline-none font-mono text-[11px] px-1.5 py-1 bg-transparent ${
                      isInsufficientBalance ? "text-[#cc0000]" : "text-black"
                    }`}
                  />
                </div>
                <button
                  onClick={() => {
                    setStakeAmount(walletStore.formattedPharos(18));
                    setIsInsufficientBalance(false);
                  }}
                  className="px-2 py-0.5 bg-win98-face win98-bezel text-[10px] font-bold cursor-pointer"
                >
                  MAX
                </button>
                <div className="win98-bezel-inset bg-white px-2 py-0.5 flex items-center gap-1">
                  <img src="/tokens/pros.png" alt="PROS" className="w-3 h-3" />
                  <span className="text-[10px] font-bold">PROS</span>
                </div>
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  isInsufficientBalance ? "text-[#cc0000]" : "text-[#808080]"
                }`}
              >
                {isInsufficientBalance
                  ? "Insufficient balance"
                  : `Balance: ${walletStore.formattedPharos()} PROS`}
              </div>
              {/* Soul & Legendary bonus indicator */}
              {stakeAmount && Number(stakeAmount) > 0 && !isInsufficientBalance && (() => {
                const soul = Math.floor(Number(stakeAmount) * 40000000 / 10000);
                const bonus = Math.min(Math.floor(soul / 500), 5);
                return (
                  <div className="text-[11px] mt-0.5 flex items-center gap-1.5">
                    <span className="text-[#000080]">
                      Soul: <span className="font-bold">{soul.toLocaleString()}</span>
                    </span>
                    <span className="text-[#808080]">|</span>
                    <span style={{ color: bonus > 0 ? "#cc7a00" : "#808080" }}>
                      Legendary: <span className="font-bold">{3 + bonus}%</span>
                      {bonus > 0 && <span className="font-bold text-[#008000]"> (+{bonus}%)</span>}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* TBA Preview */}
            {tbaDisplay && (
              <div className="win98-bezel-inset bg-[#f0f0f0] px-1.5 py-1 flex justify-between items-center">
                <span className="text-[11px] text-[#808080]">Predicted TBA</span>
                <span className="font-mono text-[11px] font-bold">{tbaDisplay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 pb-2 pt-1 flex gap-1 justify-end">
          <button
            onClick={onClose}
            className="min-w-[70px] py-1 px-3 bg-win98-face win98-bezel text-xs cursor-pointer"
          >
            Cancel
          </button>
          {!walletStore.isConnected ? (
            <div className="min-w-[120px] py-1 px-3 bg-win98-face win98-bezel flex justify-center">
              <CustomConnectButton />
            </div>
          ) : (
            <button
              disabled={!canSummon}
              onClick={handleSummon}
              className={`min-w-[120px] py-1 px-3 bg-win98-face win98-bezel text-xs font-bold flex items-center justify-center gap-1 ${
                !canSummon
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {isSummoning ? (
                <Win98Loading text={t("pharos.summoningProgress")} />
              ) : (
                <span>Summon Gotchipus</span>
              )}
            </button>
          )}
        </div>

        {/* Summon Rules - collapsible */}
        <div className="border-t border-[#808080]">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-[#000080] hover:bg-[#d4d0c8] transition-colors cursor-pointer"
          >
            <span>Summon Rules</span>
            {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showRules && (
            <div className="px-3 pb-3 flex flex-col gap-2.5">
              {/* Rarity Rates */}
              <div className="win98-bezel-inset bg-[#f0f0f0] p-2.5">
                <div className="text-xs font-bold text-[#000080] mb-2">Rarity Rates</div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { name: "Common", pct: 60, color: "#808080" },
                    { name: "Rare", pct: 25, color: "#0066cc" },
                    { name: "Epic", pct: 12, color: "#9933cc" },
                    { name: "Legendary", pct: 3, color: "#ff9900" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-2">
                      <span className="text-xs w-[70px] font-bold" style={{ color: r.color }}>{r.name}</span>
                      <div className="flex-1 h-[10px] bg-white border border-[#808080]">
                        <div className="h-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                      </div>
                      <span className="text-xs text-[#808080] w-[32px] text-right">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pity Guarantee */}
              <div className="win98-bezel-inset bg-[#f0f0f0] p-2.5">
                <div className="text-xs font-bold text-[#000080] mb-2">Pity Guarantee</div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold" style={{ color: "#0066cc" }}>15</span>
                    <span className="text-[#333]">pulls without upgrade</span>
                    <span className="text-[#808080]">&rarr;</span>
                    <span className="font-bold" style={{ color: "#0066cc" }}>Rare</span>
                    <span className="text-[#333]">guaranteed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold" style={{ color: "#9933cc" }}>30</span>
                    <span className="text-[#333]">pulls without upgrade</span>
                    <span className="text-[#808080]">&rarr;</span>
                    <span className="font-bold" style={{ color: "#9933cc" }}>Epic</span>
                    <span className="text-[#333]">guaranteed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold" style={{ color: "#ff9900" }}>60</span>
                    <span className="text-[#333]">pulls without upgrade</span>
                    <span className="text-[#808080]">&rarr;</span>
                    <span className="font-bold" style={{ color: "#ff9900" }}>Legendary</span>
                    <span className="text-[#333]">guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Stake Bonus */}
              <div className="win98-bezel-inset bg-[#f0f0f0] p-2.5">
                <div className="text-xs font-bold text-[#000080] mb-1.5">Stake Bonus</div>
                <p className="text-xs text-[#333] leading-relaxed">
                  Higher stake increases <span className="font-bold" style={{ color: "#ff9900" }}>Legendary</span> rate:
                  +1% per 500 soul points (max +5%). Base 3% &rarr; up to 8%.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SummonModal;
