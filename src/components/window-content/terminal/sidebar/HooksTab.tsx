"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useReadContract } from "wagmi";
import { PUS_ABI, PUS_ADDRESS } from "@/src/app/blockchain";
import { ChevronDown, Zap } from "lucide-react";

interface HooksTabProps {
  selectedGotchi?: string | null;
}

const truncAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function HooksTab({ selectedGotchi }: HooksTabProps) {
  const { t } = useTranslation();
  const [expandedHook, setExpandedHook] = useState<string | null>(null);

  const tokenId = selectedGotchi ? BigInt(selectedGotchi) : BigInt(0);
  const enabled = !!selectedGotchi;

  const { data: beforeHooks } = useReadContract({
    address: PUS_ADDRESS,
    abi: PUS_ABI,
    functionName: "getActiveHooks",
    args: [tokenId, 0],
    query: { enabled },
  });

  const { data: afterHooks } = useReadContract({
    address: PUS_ADDRESS,
    abi: PUS_ABI,
    functionName: "getActiveHooks",
    args: [tokenId, 1],
    query: { enabled },
  });

  // Build hook list — deduplicate across event types
  type HookEntry = { address: string; events: string[] };
  const hookMap = new Map<string, HookEntry>();

  for (const addr of (beforeHooks as string[] || [])) {
    const lower = addr.toLowerCase();
    if (!hookMap.has(lower)) {
      hookMap.set(lower, { address: addr, events: ["Before"] });
    }
  }
  for (const addr of (afterHooks as string[] || [])) {
    const lower = addr.toLowerCase();
    if (!hookMap.has(lower)) {
      hookMap.set(lower, { address: addr, events: ["After"] });
    } else {
      const entry = hookMap.get(lower)!;
      if (!entry.events.includes("After")) entry.events.push("After");
    }
  }

  const hooks = Array.from(hookMap.values());
  const activeCount = hooks.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-7 px-2 border-b-2 border-[#808080] flex items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white">{t('terminal.hooksTab.title')}</span>
          <span className="text-xs px-1.5 py-0.5 bg-[#00ff00] text-[#000000] border border-[#00ff00] font-bold">
            {activeCount} {t('terminal.hooksTab.active')}
          </span>
        </div>
      </div>

      {/* Hook List */}
      <div className="flex-1 overflow-auto bg-white win98-bezel-inset mx-1 my-1 shadow-inner">
        {!enabled ? (
          <div className="p-4 text-xs text-[#808080] text-center">
            Select a Gotchi to view hooks
          </div>
        ) : hooks.length === 0 ? (
          <div className="p-4 text-xs text-[#808080] text-center">
            No hooks registered
          </div>
        ) : (
          hooks.map((hook, i) => {
            const isExpanded = expandedHook === hook.address;

            return (
              <div key={hook.address} className="border-b-2 border-win98-face" style={{ animation: `fadeIn 0.2s ease ${i * 0.05}s both` }}>
                <div
                  onClick={() => setExpandedHook(isExpanded ? null : hook.address)}
                  className={`px-2 py-2 cursor-pointer flex items-center gap-2 transition-colors ${isExpanded ? "bg-[#e6e2da]" : "hover:bg-[#f0f0f0]"}`}
                >
                  <div className="w-4 h-4 flex-shrink-0 border-2 border-[#000000] bg-[#00ff00]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-[#000000] font-bold truncate font-mono">{truncAddr(hook.address)}</span>
                      <span className="text-xs px-1.5 py-0.5 uppercase tracking-wide font-bold border border-[#000000] text-[#000000] bg-[#00ff00]">
                        LIVE
                      </span>
                    </div>
                    <div className="text-xs text-[#808080]">{hook.events.join(" + ")}</div>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-[#000000] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {isExpanded && (
                  <div className="px-2 pb-2 animate-[fadeIn_0.15s_ease]">
                    <div className="bg-[#ffffe1] win98-bezel p-2 shadow-sm">
                      <div className="bg-white win98-bezel-inset p-1.5 shadow-inner mb-1.5">
                        <div className="text-xs text-[#808080] uppercase tracking-wide font-bold">Address</div>
                        <div className="text-[10px] text-[#000080] font-bold mt-0.5 font-mono break-all">{hook.address}</div>
                      </div>
                      <div className="bg-white win98-bezel-inset p-1.5 shadow-inner">
                        <div className="text-xs text-[#808080] uppercase tracking-wide font-bold">Events</div>
                        <div className="text-xs text-[#000080] font-bold mt-0.5">{hook.events.join(", ")}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary */}
      <div className="px-2 py-1.5 border-t-2 border-t-white bg-win98-face flex justify-between items-center text-xs">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-white border border-[#808080]">
          <div className="w-2 h-2 bg-[#00ff00]" />
          <span className="font-bold text-[#000000]">{activeCount}</span>
        </div>
        <span className="text-[#000080] font-bold bg-white px-2 py-0.5 border border-[#808080] flex items-center gap-1">
          <Zap className="w-3 h-3" /> {activeCount}/10 slots
        </span>
      </div>
    </div>
  );
}
