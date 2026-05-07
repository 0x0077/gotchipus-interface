"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"

// ── Configuration ──

const STORAGE_KEY = "gotchipus-announce-dismissed"
const EXPIRY_DAYS = 7

interface Slide {
  icon: string
  accentColor: string
  title: string
  desc: string
  items?: { icon: string; borderColor: string }[]
  mediaPlaceholder?: string
}

const SLIDES: Slide[] = [
  {
    icon: "🐙",
    accentColor: "#4DE8C2",
    title: "AI Agent v2.0",
    desc: "Your Gotchipus now speaks with the voice of an ancient cyber-Cthulhu. 28 skills loaded across core, onchain, wallet, memory, and game modules.",
    mediaPlaceholder: "▶ VIDEO WOULD PLAY HERE",
  },
  {
    icon: "",
    accentColor: "#9B7CF0",
    title: "85 Wearables Marketplace",
    desc: "Browse 8 categories across 4 rarity tiers. Live try-on preview before you buy. Set bonuses included.",
    items: [
      { icon: "🎩", borderColor: "#4DE8C2" },
      { icon: "⚔️", borderColor: "#9B7CF0" },
      { icon: "🛡️", borderColor: "#E8B84D" },
    ],
    mediaPlaceholder: "▶ VIDEO WOULD PLAY HERE",
  },
  {
    icon: "🔒",
    accentColor: "#E8B84D",
    title: "Session Security System",
    desc: "ERC-6551 tokenbound accounts with session keys, whitelist/blacklist, and bitmap-based permissions.",
    mediaPlaceholder: "▶ VIDEO WOULD PLAY HERE",
  },
  {
    icon: "🌊",
    accentColor: "#4DE8C2",
    title: "Gotchipus World Preview",
    desc: "Screeps-inspired ocean strategy with up to 20,000 AI agents. Coming soon to Base Network.",
    mediaPlaceholder: "▶ VIDEO WOULD PLAY HERE",
  },
]

// ── Helpers ──

function isDismissed(): boolean {
  if (typeof window === "undefined") return true
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false
  try {
    const { expiry } = JSON.parse(raw)
    if (Date.now() > expiry) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

function dismiss() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ expiry: Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000 })
  )
}

// ── Component ──

export default function AnnounceModal() {
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(0)

  // useEffect(() => {
  //   // TODO: restore `if (!isDismissed())` check after development
  //   setOpen(true)
  // }, [])

  const close = useCallback(() => {
    setOpen(false)
    // TODO: restore `dismiss()` after development
  }, [])

  const goTo = useCallback((i: number) => setCur(i), [])

  const navigate = useCallback(
    (dir: number) => {
      if (dir === 1 && cur === SLIDES.length - 1) {
        close()
        return
      }
      setCur((prev) => prev + dir)
    },
    [cur, close]
  )

  if (!open) return null

  const slide = SLIDES[cur]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/50">
      <div
        className="win98-bezel shadow-win98-outer bg-win98-face w-[720px] max-w-[calc(100vw-32px)] animate-window-appear font-win98"
      >
        {/* ── Title Bar ── */}
        <div className="h-7 flex items-center justify-between pl-3 pr-1.5 bg-uni-bg-02">
          <div className="flex items-center gap-2">
            <span className="text-[12px]">🐙</span>
            <span className="text-white text-[13px] font-bold">{"What's New - Gotchipus"}</span>
          </div>
          <button
            onClick={close}
            className="flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] w-[18px] h-[18px] transition-colors"
          >
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-2">
          {/* ── Slide Area ── */}
          <div
            className="w-full h-[420px] flex items-center justify-center overflow-hidden border border-[#808080] shadow-win98-inner"
            style={{ background: "#0a0a1a" }}
          >
            <div className="flex flex-col items-center gap-2 px-4">
              {/* Icon */}
              {slide.items ? (
                <div className="flex gap-3">
                  {slide.items.map((item, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 flex items-center justify-center text-xl"
                      style={{
                        background: "#1a1a2e",
                        border: `1px solid ${item.borderColor}`,
                      }}
                    >
                      {item.icon}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ border: `2px solid ${slide.accentColor}` }}
                >
                  <span className="text-4xl">{slide.icon}</span>
                </div>
              )}

              {/* Title */}
              <div
                className="text-[14px] font-bold"
                style={{ color: slide.accentColor }}
              >
                {slide.title}
              </div>

              {/* Description */}
              <div className="text-[11px] text-[#999] text-center max-w-[320px] leading-[1.5]">
                {slide.desc}
              </div>

              {/* Media placeholder */}
              {slide.mediaPlaceholder && (
                <div className="mt-1 px-2 py-0.5 border border-[#333] text-[#555] text-[10px]">
                  {slide.mediaPlaceholder}
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Controls ── */}
          <div className="pt-2 pb-1 text-center">
            {/* Title + Desc */}
            <div className="font-bold text-[13px] text-[#000080] mb-0.5">
              {slide.title}
            </div>
            <div className="text-[11px] text-[#444] leading-[1.4] max-w-[400px] mx-auto mb-2">
              {slide.desc}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mb-2.5">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  onClick={() => goTo(i)}
                  className="w-2 h-2 rounded-full cursor-pointer transition-colors"
                  style={{
                    background: i === cur ? "#000080" : "#888",
                  }}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(-1)}
                disabled={cur === 0}
                className="bg-win98-face border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] py-0.5 px-4 text-[11px] font-bold text-black cursor-pointer shadow-win98-outer active:shadow-win98-inner disabled:text-[#808080] disabled:cursor-not-allowed"
              >
                Back
              </button>

              <span className="text-[10px] text-[#808080]">
                {cur + 1} / {SLIDES.length}
              </span>

              <button
                onClick={() => navigate(1)}
                className="bg-win98-face border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] py-0.5 px-4 text-[11px] font-bold text-black cursor-pointer shadow-win98-outer active:shadow-win98-inner"
              >
                {cur === SLIDES.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
