"use client"

import { useState } from "react"
import { X } from "lucide-react"

export default function MigrationModal() {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 backdrop-blur-sm">
      <div className="win98-bezel shadow-win98-outer bg-win98-face w-[560px] max-w-[calc(100vw-32px)] animate-window-appear font-win98">
        <div className="h-7 flex items-center justify-between pl-3 pr-1.5 bg-uni-bg-02">
          <div className="flex items-center gap-2">
            <span className="text-white text-[13px] font-bold tracking-wide">
              Gotchipus — Migration Notice
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] w-[18px] h-[18px] transition-colors"
          >
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3">
          <div
            className="relative overflow-hidden border border-[#808080] shadow-win98-inner"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%, #142036 0%, #0a0a1a 55%, #06060f 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #4DE8C2 1px, transparent 1px), linear-gradient(to bottom, #4DE8C2 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[260px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(77,232,194,0.25), transparent 70%)",
              }}
            />

            <div className="relative px-8 pt-10 pb-7 flex flex-col items-center gap-5">
              <div className="flex items-center gap-2 px-3 py-1 border border-[#4DE8C2]/40 bg-[#4DE8C2]/5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#4DE8C2] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4DE8C2]" />
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[#4DE8C2] font-bold">
                  MIGRATION IN PROGRESS
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 mt-2">
                <span className="text-[#cfcfcf] text-[13px] font-light tracking-[0.4em] uppercase">
                  A New Era on
                </span>
                <div
                  className="text-[56px] font-extrabold tracking-tight leading-none"
                  style={{
                    background:
                      "linear-gradient(180deg, #4DE8C2 0%, #2bb89a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 40px rgba(77,232,194,0.25)",
                  }}
                >
                  BASE
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="w-10 h-px bg-[#4DE8C2]/30" />
                <span className="w-1 h-1 rotate-45 bg-[#4DE8C2]/60" />
                <span className="w-10 h-px bg-[#4DE8C2]/30" />
              </div>

              <p className="text-[#d4d4d4] text-[12px] leading-[1.7] text-center max-w-[400px]">
                Gotchipus is migrating to{" "}
                <span className="text-[#4DE8C2] font-semibold">Base</span>. All
                features are temporarily unavailable while we move the
                tentacles to their new home.
              </p>
              <p className="text-[#888] text-[11px] leading-[1.6] text-center max-w-[380px] -mt-1">
                Stay tuned — your Gotchipus will surface again soon.
              </p>
            </div>

            <div className="relative h-1 w-full overflow-hidden bg-[#0a0a1a] border-t border-[#4DE8C2]/20">
              <div
                className="h-full w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #4DE8C2 50%, transparent)",
                  animation: "migration-shimmer 2.4s linear infinite",
                }}
              />
              <style>{`
                @keyframes migration-shimmer {
                  0%   { transform: translateX(-100%); }
                  100% { transform: translateX(400%); }
                }
              `}</style>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between">
            <span className="text-[10px] text-[#666] tracking-wide">
              v2.0 · Base Migration
            </span>
            <button
              onClick={() => setOpen(false)}
              className="bg-win98-face border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] py-1 px-8 text-[12px] font-bold text-black cursor-pointer shadow-win98-outer active:shadow-win98-inner"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
