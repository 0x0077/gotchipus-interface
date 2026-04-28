"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { PUS_ABI, PUS_ADDRESS } from "@/src/app/blockchain";
import { X, Plus, Trash2, PowerOff, Zap, Loader2 } from "lucide-react";

// ── Win98 style constants ──

const CLS = {
  raised: "win98-bezel",
  sunken: "win98-bezel-inset",
  input: "win98-bezel-inset bg-white px-2 py-1 text-xs focus:outline-none font-mono",
  inputError: "border-2 border-t-[#ff0000] border-l-[#ff0000] border-r-[#aa0000] border-b-[#aa0000] bg-[#fff0f0] px-2 py-1 text-xs focus:outline-none font-mono",
};

interface HookWizardProps {
  tokenId: string;
  onClose: () => void;
}

const truncAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function HookWizard({ tokenId, onClose }: HookWizardProps) {
  const bigTokenId = BigInt(tokenId);

  // ── Read on-chain hooks ──
  const { data: beforeHooks, refetch: refetchBefore, isLoading: loadingBefore } = useReadContract({
    address: PUS_ADDRESS,
    abi: PUS_ABI,
    functionName: "getActiveHooks",
    args: [bigTokenId, 0],
  });

  const { data: afterHooks, refetch: refetchAfter, isLoading: loadingAfter } = useReadContract({
    address: PUS_ADDRESS,
    abi: PUS_ABI,
    functionName: "getActiveHooks",
    args: [bigTokenId, 1],
  });

  const refetchAll = () => { refetchBefore(); refetchAfter(); };
  const isLoading = loadingBefore || loadingAfter;

  // Build hook list
  type HookEntry = { address: string; events: string[] };
  const hookMap = new Map<string, HookEntry>();

  for (const addr of (beforeHooks as string[] || [])) {
    const lower = addr.toLowerCase();
    if (!hookMap.has(lower)) hookMap.set(lower, { address: addr, events: ["Before"] });
  }
  for (const addr of (afterHooks as string[] || [])) {
    const lower = addr.toLowerCase();
    if (!hookMap.has(lower)) {
      hookMap.set(lower, { address: addr, events: ["After"] });
    } else {
      const e = hookMap.get(lower)!;
      if (!e.events.includes("After")) e.events.push("After");
    }
  }
  const hooks = Array.from(hookMap.values());

  return (
    <div className="bg-win98-face border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-lg w-[420px] max-h-[500px] flex flex-col select-none">
      {/* Title bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-sm font-bold">Hook Manager — Gotchi #{tokenId}</span>
        </div>
        <button onClick={onClose} className="bg-win98-face border border-white border-r-[#808080] border-b-[#808080] w-5 h-4 flex items-center justify-center hover:brightness-110">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-auto space-y-3">
        {/* Registered hooks */}
        <fieldset className={`${CLS.sunken} p-2`}>
          <legend className="text-xs font-bold px-1">Registered Hooks ({hooks.length}/10)</legend>

          {isLoading ? (
            <div className="text-xs text-[#808080] text-center py-3 flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading hooks...
            </div>
          ) : hooks.length === 0 ? (
            <div className="text-xs text-[#808080] text-center py-3">
              No hooks registered on this Gotchi
            </div>
          ) : (
            <div className="space-y-1 max-h-[160px] overflow-auto">
              {hooks.map(hook => (
                <HookRow
                  key={hook.address}
                  tokenId={tokenId}
                  address={hook.address}
                  events={hook.events}
                  onSuccess={refetchAll}
                />
              ))}
            </div>
          )}
        </fieldset>

        {/* Add hook */}
        <AddHookForm tokenId={tokenId} onSuccess={refetchAll} />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#808080] flex justify-end">
        <button
          onClick={onClose}
          className={`${CLS.raised} bg-win98-face text-[#000000] px-4 py-1 text-xs font-bold cursor-pointer`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Hook Row (with disable / remove) ──

function HookRow({
  tokenId,
  address,
  events,
  onSuccess,
}: {
  tokenId: string;
  address: string;
  events: string[];
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [action, setAction] = useState<"disable" | "remove" | null>(null);
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  const isWorking = isPending || (hash && !isSuccess && !receiptError);

  useEffect(() => {
    if (isSuccess && action) {
      toast({ title: t("toast.txConfirmed"), description: t("toast.txConfirmedDesc") });
      setAction(null);
      reset();
      onSuccess();
    }
  }, [isSuccess]);

  useEffect(() => {
    const err = writeError || receiptError;
    if (err && action) {
      toast({
        title: t("toast.txCancelled"),
        description: t("toast.txCancelledDesc"),
        variant: "destructive",
      });
      setAction(null);
      reset();
    }
  }, [writeError, receiptError]);

  const handleDisable = () => {
    setAction("disable");
    toast({ title: t("toast.txSubmitted"), description: t("toast.txSubmittedDesc") });
    writeContract({
      address: PUS_ADDRESS,
      abi: PUS_ABI,
      functionName: "setHookApproval",
      args: [BigInt(tokenId), address, false],
    });
  };

  const handleRemove = () => {
    setAction("remove");
    toast({ title: t("toast.txSubmitted"), description: t("toast.txSubmittedDesc") });
    writeContract({
      address: PUS_ADDRESS,
      abi: PUS_ABI,
      functionName: "removeHookCompletely",
      args: [BigInt(tokenId), address],
    });
  };

  const disabledAll = !!isWorking;

  return (
    <div className="flex items-center gap-2 bg-white px-2 py-1.5 border border-win98-face">
      <div className="w-2.5 h-2.5 bg-[#00ff00] border border-[#000000] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono font-bold text-[#000000] truncate">{truncAddr(address)}</div>
        <div className="text-[10px] text-[#808080]">{events.join(" + ")}</div>
      </div>
      <button
        onClick={handleDisable}
        disabled={disabledAll}
        title={action === "disable" ? "Processing..." : "Disable"}
        className={`${CLS.raised} p-1 bg-[#ffff00] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {action === "disable" && isWorking ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <PowerOff className="w-3 h-3" />
        )}
      </button>
      <button
        onClick={handleRemove}
        disabled={disabledAll}
        title={action === "remove" ? "Processing..." : "Remove"}
        className={`${CLS.raised} p-1 bg-[#ff6666] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {action === "remove" && isWorking ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}

// ── Add Hook Form ──

function AddHookForm({
  tokenId,
  onSuccess,
}: {
  tokenId: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [addr, setAddr] = useState("");
  const [forBefore, setForBefore] = useState(true);
  const [forAfter, setForAfter] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  const isWaitingReceipt = !!hash && !isSuccess && !receiptError;
  const isBusy = submitting && (isPending || isWaitingReceipt);

  useEffect(() => {
    if (isSuccess && submitting) {
      toast({ title: t("toast.txConfirmed"), description: t("toast.txConfirmedDesc") });
      setAddr("");
      setSubmitting(false);
      reset();
      onSuccess();
    }
  }, [isSuccess]);

  useEffect(() => {
    const err = writeError || receiptError;
    if (err && submitting) {
      toast({
        title: t("toast.txCancelled"),
        description: t("toast.txCancelledDesc"),
        variant: "destructive",
      });
      setSubmitting(false);
      reset();
    }
  }, [writeError, receiptError]);

  const isValidAddr = /^0x[a-fA-F0-9]{40}$/.test(addr);
  const hasInvalidAddr = addr.length > 0 && !isValidAddr;
  const hasEventSelected = forBefore || forAfter;
  const canSubmit = isValidAddr && hasEventSelected && !isBusy;

  const handleAdd = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    toast({ title: t("toast.txSubmitted"), description: t("toast.txSubmittedDesc") });
    writeContract({
      address: PUS_ADDRESS,
      abi: PUS_ABI,
      functionName: "addHookToEvents",
      args: [BigInt(tokenId), addr as `0x${string}`, forBefore, forAfter],
    });
  };

  const buttonLabel = isPending
    ? "Submitting..."
    : isWaitingReceipt
    ? "Confirming..."
    : "Add Hook";

  return (
    <fieldset className={`${CLS.sunken} p-2`}>
      <legend className="text-xs font-bold px-1 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Hook
      </legend>

      <div className="space-y-2">
        {/* Address input */}
        <div>
          <label className="text-xs text-[#000000] block mb-0.5">Hook Contract Address</label>
          <input
            type="text"
            value={addr}
            onChange={e => setAddr(e.target.value.trim())}
            placeholder="0x..."
            disabled={isBusy}
            className={`${hasInvalidAddr ? CLS.inputError : CLS.input} w-full text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {hasInvalidAddr && (
            <div className="text-[10px] text-[#aa0000] mt-0.5">Invalid address format</div>
          )}
        </div>

        {/* Event type checkboxes */}
        <div className="flex gap-4">
          <label className={`flex items-center gap-1.5 cursor-pointer text-xs ${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}>
            <input
              type="checkbox"
              checked={forBefore}
              onChange={e => setForBefore(e.target.checked)}
              disabled={isBusy}
            />
            BeforeExecute
          </label>
          <label className={`flex items-center gap-1.5 cursor-pointer text-xs ${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}>
            <input
              type="checkbox"
              checked={forAfter}
              onChange={e => setForAfter(e.target.checked)}
              disabled={isBusy}
            />
            AfterExecute
          </label>
        </div>

        {!hasEventSelected && (
          <div className="text-[10px] text-[#aa0000]">Select at least one event type</div>
        )}

        {/* Submit */}
        <button
          onClick={handleAdd}
          disabled={!canSubmit}
          className={`${CLS.raised} w-full bg-[#000080] text-white text-xs font-bold py-1.5 cursor-pointer hover:bg-[#0000aa] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5`}
        >
          {isBusy && <Loader2 className="w-3 h-3 animate-spin" />}
          {buttonLabel}
        </button>
      </div>
    </fieldset>
  );
}
