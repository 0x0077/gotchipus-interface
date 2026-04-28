"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ens_normalize } from "@adraffy/ens-normalize";
import { ethers } from "ethers";
import { useContractWrite, useChiRegistryRead } from "@/hooks/useContract";
import { useToast } from "@/hooks/use-toast";
import { chiNameSvgDataUri } from "@/src/utils/chiNameSvg";

const SUNKEN =
  "win98-bezel-inset shadow-win98-inner";
// Static raised bevel for the modal frame. `.win98-bezel`'s :active rule
// cascades from child clicks (e.g. pressing the input), which flickers
// the frame's border. `.win98-bezel-static` is the no-active variant.
const RAISED_STATIC =
  "win98-bezel-static shadow-win98-outer";
// Interactive raised bevel for buttons — keeps the press-down inversion.
const RAISED =
  "win98-bezel shadow-win98-outer";
const RAISED_ACTIVE =
  "active:shadow-win98-inner";
const INPUT =
  "win98-bezel-inset shadow-win98-inner bg-white px-1.5 py-1 text-sm focus:outline-none";

interface RenameModalProps {
  tokenId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RenameModal({ tokenId, currentName, onClose, onSuccess }: RenameModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [rawInput, setRawInput] = useState("");
  const [normalizedName, setNormalizedName] = useState("");
  const [nameError, setNameError] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>();

  const { contractWrite, isConfirmed, error: txError, isPending } = useContractWrite();

  // Name validation (same logic as SummonModal)
  const handleNameChange = useCallback((raw: string) => {
    setRawInput(raw);
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

  // On-chain availability check
  const { data: isAvailable, isLoading: isChecking } = useChiRegistryRead(
    "isNameAvailable",
    [debouncedName],
    { enabled: !!debouncedName }
  );

  // Tiered fee lookup. Fee depends on code-point length (5 chars = premium).
  const { data: registerFeeRaw, isLoading: isFeeLoading } = useChiRegistryRead(
    "getRegisterFee",
    [debouncedName],
    { enabled: !!debouncedName && !nameError }
  );
  const registerFee = registerFeeRaw as bigint | undefined;
  const feeDisplay = registerFee !== undefined
    ? ethers.formatEther(registerFee)
    : "…";

  const isNameTaken = debouncedName && isAvailable === false;
  const showNormalized = normalizedName && rawInput !== normalizedName && !nameError;
  const isValid = normalizedName.length > 0 && !nameError && !isNameTaken && normalizedName !== currentName;

  // Handle tx confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: t('toast.renameSuccess', { defaultValue: 'New name minted' }),
        description: t('toast.renameSuccessDesc', { defaultValue: 'Minted "{{name}}" and set as your primary', name: normalizedName }),
      });
      onSuccess();
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (txError) {
      toast({
        title: t('toast.renameFailed', { defaultValue: 'Mint failed' }),
        description: t('toast.renameFailedDesc', { defaultValue: 'Transaction failed' }),
        variant: "destructive",
      });
    }
  }, [txError]);

  const handleSubmit = () => {
    if (!isValid || isPending || registerFee === undefined) return;
    contractWrite("setName", [normalizedName, tokenId], registerFee);
    toast({
      title: t('toast.renameTxSubmitted', { defaultValue: 'Transaction submitted' }),
      description: t('toast.renameTxSubmittedDesc', { defaultValue: 'Waiting for confirmation...' }),
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`flex flex-col bg-win98-face ${RAISED_STATIC} w-[400px] max-w-[95vw] text-sm`}>

        {/* Title Bar */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gradient-to-r from-[#000080] to-[#1084d0] select-none">
          <span className="flex-1 text-white text-sm font-bold">
            New Chi Name
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`w-4 h-[14px] flex items-center justify-center text-xs font-bold font-mono cursor-pointer bg-win98-face ${RAISED} ${RAISED_ACTIVE}`}
          >x</button>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2.5">

          {/* Current primary name */}
          <div className={`${SUNKEN} bg-white p-2 flex items-center gap-3`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={chiNameSvgDataUri(currentName)}
              alt={`${currentName}.chi`}
              className="w-[56px] h-[56px] object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs text-[#808080]">Current primary</div>
              <div className="text-sm font-bold text-[#000080]">{currentName}.chi</div>
            </div>
          </div>

          {/* New name input */}
          <fieldset className="border border-[#808080] px-2.5 pb-2 pt-0 relative m-0">
            <legend className="text-xs text-[#000000] px-1">New Name</legend>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={rawInput}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter new chi name..."
                className={`${INPUT} flex-1 text-sm`}
                autoFocus
              />
              <span className="text-xs text-[#808080] shrink-0">.chi</span>
            </div>

            {/* Normalized hint */}
            {showNormalized && (
              <div className="mt-1 text-xs text-[#000080]">
                Normalized: {normalizedName}
              </div>
            )}

            {/* Validation error */}
            {nameError && (
              <div className="mt-1 text-xs text-[#cc0000]">{nameError}</div>
            )}

            {/* Availability status */}
            {debouncedName && !nameError && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {isChecking ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 border border-[#000080] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[#808080]">Checking availability...</span>
                  </>
                ) : isNameTaken ? (
                  <span className="text-[#cc0000]">{debouncedName}.chi is already taken</span>
                ) : (
                  <span className="text-[#008000]">{debouncedName}.chi is available</span>
                )}
              </div>
            )}

            {/* Same name warning */}
            {normalizedName === currentName && normalizedName && !nameError && (
              <div className="mt-1 text-xs text-[#808080]">Same as current name</div>
            )}
          </fieldset>

          {/* Preview */}
          {isValid && !isChecking && (
            <div className={`${SUNKEN} bg-white p-2 flex items-center gap-3`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chiNameSvgDataUri(normalizedName)}
                alt={`${normalizedName}.chi`}
                className="w-[56px] h-[56px] object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs text-[#808080]">New primary preview</div>
                <div className="text-sm font-bold text-[#000080]">{normalizedName}.chi</div>
              </div>
            </div>
          )}

          {/* Info: this mints a NEW NFT additive, not an in-place rename.
              Old name stays in the TBA and can be re-selected as primary. */}
          <div className="flex items-start gap-1.5 px-2 py-1.5 bg-[#ffffc0] border border-[#808080] text-xs text-[#444444]">
            <span className="shrink-0 font-bold text-[#808080]">[i]</span>
            <span>
              Mints a new <strong>.chi</strong> name NFT to your vault and sets it as primary.
              Your current name <strong>{currentName}.chi</strong> stays in the vault — you can switch back anytime.
              Cost: <strong>{feeDisplay} PROS</strong>{registerFee !== undefined && " (shorter names cost more)"}.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t-2 border-[#808080]">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center px-4 py-1 text-sm bg-win98-face cursor-pointer ${RAISED} ${RAISED_ACTIVE}`}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isPending || isChecking || isFeeLoading || registerFee === undefined}
            className={`inline-flex items-center justify-center px-6 py-1.5 text-sm font-bold bg-[#000080] text-white cursor-pointer ${RAISED} ${RAISED_ACTIVE} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPending
              ? t('common.confirming', { defaultValue: 'Confirming...' })
              : t('terminal.detail.rename', { defaultValue: 'Rename' }) + ` (${feeDisplay} PROS)`}
          </button>
        </div>
      </div>
    </div>
  );
}
