"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WearableItem, RARITY } from "./types";

// ── Types ──

interface WearableShareCardModalProps {
  item: WearableItem;
  onClose: () => void;
}

// ── Theme system ──

interface CardTheme {
  id: string;
  label: string;
  bgGradient: [string, string, string];
  gridAlpha: number;
  gridColor: string | null;
  particleAlpha: number;
  titleColor: string;
  subtitleColor: string;
  labelColor: string;
  valueColor: string;
  font: string;
  barBgColor: string;
  barRadius: number;
  cardBg: [string, string];
  cardBorderAlpha: number;
  cardRadius: number;
  cardGlowAlpha: number;
  imgRadius: number;
  bottomBgAlpha: number;
  bottomTextColor: string;
  scanlines: boolean;
  pixelBorders: boolean;
  crtVignette: boolean;
}

const THEMES: CardTheme[] = [
  {
    id: "cyber", label: "Cyber",
    bgGradient: ["#08080f", "#0e0e1a", "#06060c"],
    gridAlpha: 0.03, gridColor: null, particleAlpha: 0.08,
    titleColor: "#fff", subtitleColor: "rgba(255,255,255,0.35)", labelColor: "rgba(255,255,255,0.5)", valueColor: "#fff",
    font: "-apple-system, 'Segoe UI', sans-serif",
    barBgColor: "rgba(255,255,255,0.06)", barRadius: 5,
    cardBg: ["#141420", "#0c0c18"], cardBorderAlpha: 0.4, cardRadius: 18, cardGlowAlpha: 0.5, imgRadius: 14,
    bottomBgAlpha: 0.04, bottomTextColor: "rgba(255,255,255,0.3)",
    scanlines: false, pixelBorders: false, crtVignette: false,
  },
  {
    id: "retro", label: "Retro",
    bgGradient: ["#1a0a20", "#2d1b3d", "#0f0818"],
    gridAlpha: 0, gridColor: null, particleAlpha: 0.12,
    titleColor: "#ffe4f0", subtitleColor: "rgba(255,200,230,0.4)", labelColor: "rgba(255,200,230,0.5)", valueColor: "#ffe4f0",
    font: "'Courier New', 'SF Mono', monospace",
    barBgColor: "rgba(255,150,200,0.08)", barRadius: 0,
    cardBg: ["#220e2e", "#180a1e"], cardBorderAlpha: 0.5, cardRadius: 4, cardGlowAlpha: 0.6, imgRadius: 2,
    bottomBgAlpha: 0.06, bottomTextColor: "rgba(255,200,230,0.35)",
    scanlines: true, pixelBorders: false, crtVignette: true,
  },
  {
    id: "pixel", label: "Pixel",
    bgGradient: ["#1a1c2e", "#263238", "#1a1c2e"],
    gridAlpha: 0.06, gridColor: "#4fc3f7", particleAlpha: 0,
    titleColor: "#e0f7fa", subtitleColor: "rgba(200,240,255,0.4)", labelColor: "rgba(200,240,255,0.55)", valueColor: "#e0f7fa",
    font: "'Courier New', 'SF Mono', monospace",
    barBgColor: "rgba(100,200,255,0.08)", barRadius: 0,
    cardBg: ["#263040", "#1a2030"], cardBorderAlpha: 0.6, cardRadius: 0, cardGlowAlpha: 0, imgRadius: 0,
    bottomBgAlpha: 0.08, bottomTextColor: "rgba(200,240,255,0.35)",
    scanlines: false, pixelBorders: true, crtVignette: false,
  },
  {
    id: "minimal", label: "Minimal",
    bgGradient: ["#f5f5f0", "#e8e8e0", "#f0f0ea"],
    gridAlpha: 0, gridColor: null, particleAlpha: 0,
    titleColor: "#1a1a1a", subtitleColor: "rgba(0,0,0,0.35)", labelColor: "rgba(0,0,0,0.45)", valueColor: "#1a1a1a",
    font: "-apple-system, 'Segoe UI', sans-serif",
    barBgColor: "rgba(0,0,0,0.06)", barRadius: 5,
    cardBg: ["#ffffff", "#f8f8f5"], cardBorderAlpha: 0.2, cardRadius: 16, cardGlowAlpha: 0.15, imgRadius: 12,
    bottomBgAlpha: 0.04, bottomTextColor: "rgba(0,0,0,0.3)",
    scanlines: false, pixelBorders: false, crtVignette: false,
  },
];

// ── Constants ──

const RARITY_THEME: Record<string, { glow: string; label: string; bg: string }> = {
  common:    { glow: "#8899aa", label: "COMMON",    bg: "#2a3040" },
  rare:      { glow: "#a855f7", label: "RARE",      bg: "#1a1030" },
  epic:      { glow: "#ec4899", label: "EPIC",      bg: "#1a0a1a" },
  legendary: { glow: "#f59e0b", label: "LEGENDARY", bg: "#1a1400" },
};

const ATTR_COLORS: Record<string, string> = {
  STR: "#f87171", DEF: "#fb923c", AGI: "#c084fc",
  INT: "#60a5fa", VIT: "#34d399", LUK: "#fbbf24",
};

const CATEGORY_LABELS: Record<string, string> = {
  head: "HEAD", hand: "HAND", clothes: "CLOTHES", face: "FACE", mouth: "MOUTH",
};

// ── Canvas helpers ──

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src + (src.includes("?") ? "&" : "?") + "_cors=1";
  });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Main render ──

interface RenderAssets {
  itemImg: HTMLImageElement | null;
  logoImg: HTMLImageElement | null;
}

function renderWearableCard(
  item: WearableItem,
  targetW: number,
  targetH: number,
  assets: RenderAssets,
  theme: CardTheme
): HTMLCanvasElement {
  const W = targetW, H = targetH, s = targetW / 1200;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const rc = RARITY_THEME[item.rarity] || RARITY_THEME.common;
  const ft = theme.font;

  // === BACKGROUND ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.bgGradient[0]);
  bg.addColorStop(0.4, theme.bgGradient[1]);
  bg.addColorStop(1, theme.bgGradient[2]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // grid overlay
  if (theme.gridAlpha > 0) {
    ctx.save(); ctx.globalAlpha = theme.gridAlpha;
    ctx.strokeStyle = theme.gridColor || rc.glow; ctx.lineWidth = (theme.pixelBorders ? 1 : 0.5) * s;
    const step = (theme.pixelBorders ? 32 : 40) * s;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  // ambient glow — centered on the item image area (left side)
  const rg = ctx.createRadialGradient(W * 0.28, H * 0.45, 0, W * 0.28, H * 0.45, H * 0.7);
  rg.addColorStop(0, hexAlpha(rc.glow, 0.18)); rg.addColorStop(0.5, hexAlpha(rc.glow, 0.06)); rg.addColorStop(1, "transparent");
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

  // floating particles
  if (theme.particleAlpha > 0) {
    ctx.save();
    for (let i = 0; i < 30; i++) {
      const px = ((i * 137 + 50) % 1200) * s, py = ((i * 89 + 30) % 675) * s;
      const pr = (1 + i % 3) * s;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(rc.glow, theme.particleAlpha + ((i % 5) * 0.03)); ctx.fill();
    }
    ctx.restore();
  }

  // CRT scanlines
  if (theme.scanlines) {
    ctx.save(); ctx.globalAlpha = 0.04;
    for (let y = 0; y < H; y += 3 * s) {
      ctx.fillStyle = "#000"; ctx.fillRect(0, y, W, 1 * s);
    }
    ctx.restore();
  }

  // === LEFT SIDE: ITEM IMAGE CARD ===
  const cardPad = 20 * s;
  const imgSize = H - 160 * s;
  const cardW = imgSize + cardPad * 2;
  const cardH = imgSize + cardPad * 2;
  const cardX = 50 * s;
  const cardY = (H - cardH) / 2 - 10 * s;
  const cR = theme.cardRadius * s;

  // card glow
  if (theme.cardGlowAlpha > 0) {
    ctx.save();
    ctx.shadowColor = hexAlpha(rc.glow, theme.cardGlowAlpha);
    ctx.shadowBlur = 80 * s;
    rr(ctx, cardX, cardY, cardW, cardH, cR);
    ctx.fillStyle = "rgba(0,0,0,0.01)"; ctx.fill();
    ctx.restore();
  }

  // card bg
  rr(ctx, cardX, cardY, cardW, cardH, cR);
  const cardBgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardBgGrad.addColorStop(0, theme.cardBg[0]); cardBgGrad.addColorStop(1, theme.cardBg[1]);
  ctx.fillStyle = cardBgGrad; ctx.fill();

  // rarity-tinted inner glow on card
  const innerGlow = ctx.createRadialGradient(cardX + cardW / 2, cardY + cardH / 2, 0, cardX + cardW / 2, cardY + cardH / 2, cardW * 0.6);
  innerGlow.addColorStop(0, hexAlpha(rc.glow, 0.08)); innerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = innerGlow; ctx.fillRect(cardX, cardY, cardW, cardH);

  // card border
  ctx.strokeStyle = hexAlpha(rc.glow, theme.cardBorderAlpha); ctx.lineWidth = 2 * s;
  rr(ctx, cardX, cardY, cardW, cardH, cR); ctx.stroke();
  if (!theme.pixelBorders) {
    ctx.strokeStyle = hexAlpha(rc.glow, 0.08); ctx.lineWidth = 0.5 * s;
    rr(ctx, cardX + 5 * s, cardY + 5 * s, cardW - 10 * s, cardH - 10 * s, Math.max(0, cR - 4 * s)); ctx.stroke();
  }

  // item image
  const imgX = cardX + cardPad, imgY = cardY + cardPad;
  const imgW = imgSize, imgH = imgSize;
  const iR = theme.imgRadius * s;
  ctx.save();
  rr(ctx, imgX, imgY, imgW, imgH, iR); ctx.clip();
  ctx.fillStyle = theme.id === "minimal" ? "#e8e8e0" : "#0a0a16";
  ctx.fillRect(imgX, imgY, imgW, imgH);

  if (assets.itemImg) {
    // center the item image with padding
    const pad = imgW * 0.08;
    const drawSize = imgW - pad * 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(assets.itemImg, imgX + pad, imgY + pad, drawSize, drawSize);
  }

  // subtle item glow overlay
  const itemGlow = ctx.createRadialGradient(imgX + imgW / 2, imgY + imgH * 0.4, 0, imgX + imgW / 2, imgY + imgH * 0.4, imgW * 0.5);
  itemGlow.addColorStop(0, hexAlpha(rc.glow, 0.06)); itemGlow.addColorStop(1, "transparent");
  ctx.fillStyle = itemGlow; ctx.fillRect(imgX, imgY, imgW, imgH);
  ctx.restore();

  ctx.strokeStyle = hexAlpha(rc.glow, 0.2); ctx.lineWidth = 1 * s;
  rr(ctx, imgX, imgY, imgW, imgH, iR); ctx.stroke();

  // pixel border double-line
  if (theme.pixelBorders) {
    ctx.strokeStyle = hexAlpha(rc.glow, 0.15); ctx.lineWidth = 3 * s;
    rr(ctx, cardX - 3 * s, cardY - 3 * s, cardW + 6 * s, cardH + 6 * s, 0); ctx.stroke();
  }

  // === RIGHT SIDE: ITEM INFO ===
  const RX = cardX + cardW + 50 * s;
  const RW = W - RX - 56 * s;

  // brand mark
  ctx.save();
  const logoSize = 40 * s;
  const logoR = theme.pixelBorders ? 0 : 8 * s;
  rr(ctx, RX, 40 * s, logoSize, logoSize, logoR);
  ctx.fillStyle = hexAlpha(rc.glow, 0.15); ctx.fill();
  ctx.strokeStyle = hexAlpha(rc.glow, 0.3); ctx.lineWidth = 1 * s; ctx.stroke();
  if (assets.logoImg) {
    ctx.save();
    rr(ctx, RX + 3 * s, 43 * s, logoSize - 6 * s, logoSize - 6 * s, theme.pixelBorders ? 0 : 5 * s);
    ctx.clip();
    ctx.drawImage(assets.logoImg, RX + 3 * s, 43 * s, logoSize - 6 * s, logoSize - 6 * s);
    ctx.restore();
  }
  ctx.restore();

  ctx.font = `700 ${18 * s}px ${ft}`;
  ctx.fillStyle = hexAlpha(rc.glow, 0.8);
  ctx.textBaseline = "middle";
  ctx.fillText("GOTCHIPUS", RX + logoSize + 12 * s, 40 * s + logoSize / 2);

  // Wearable label
  ctx.font = `500 ${16 * s}px ${ft}`;
  ctx.fillStyle = theme.subtitleColor;
  ctx.fillText("WEARABLE", RX + logoSize + 12 * s + ctx.measureText("GOTCHIPUS").width + 12 * s, 40 * s + logoSize / 2);

  // item name
  ctx.font = `700 ${52 * s}px ${ft}`;
  ctx.fillStyle = theme.titleColor;
  ctx.fillText(item.name, RX, 140 * s);

  // badges row: category + rarity + id
  const badgeY = 190 * s;
  ctx.font = `600 ${16 * s}px ${ft}`;
  ctx.textBaseline = "middle";
  const badgeR = theme.pixelBorders ? 0 : 6 * s;

  let bx = RX;

  // category badge
  const catText = CATEGORY_LABELS[item.category] || item.category.toUpperCase();
  const catColor = theme.id === "minimal" ? "#555" : "rgba(255,255,255,0.8)";
  const catW = ctx.measureText(catText).width + 24 * s;
  rr(ctx, bx, badgeY, catW, 32 * s, badgeR);
  ctx.fillStyle = theme.id === "minimal" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"; ctx.fill();
  ctx.strokeStyle = theme.id === "minimal" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)"; ctx.lineWidth = 1 * s;
  rr(ctx, bx, badgeY, catW, 32 * s, badgeR); ctx.stroke();
  ctx.fillStyle = catColor;
  ctx.fillText(catText, bx + 12 * s, badgeY + 18 * s);
  bx += catW + 10 * s;

  // rarity badge
  const rarW = ctx.measureText(rc.label).width + 24 * s;
  rr(ctx, bx, badgeY, rarW, 32 * s, badgeR);
  ctx.fillStyle = hexAlpha(rc.glow, 0.12); ctx.fill();
  ctx.strokeStyle = hexAlpha(rc.glow, 0.3); ctx.lineWidth = 1 * s;
  rr(ctx, bx, badgeY, rarW, 32 * s, badgeR); ctx.stroke();
  ctx.fillStyle = rc.glow;
  ctx.fillText(rc.label, bx + 12 * s, badgeY + 18 * s);
  bx += rarW + 10 * s;

  // id
  ctx.fillStyle = theme.subtitleColor;
  ctx.fillText(`#${item.id}`, bx, badgeY + 18 * s);

  // divider
  let ly = 242 * s;
  ctx.fillStyle = hexAlpha(rc.glow, 0.15);
  ctx.fillRect(RX, ly, RW * 0.8, 1.5 * s);
  ly += 30 * s;

  // stats bars
  const statEntries = Object.entries(item.stats);
  if (statEntries.length > 0) {
    ctx.font = `600 ${14 * s}px ${ft}`;
    ctx.fillStyle = theme.subtitleColor;
    ctx.textBaseline = "middle";
    ctx.fillText("ATTRIBUTE BONUSES", RX, ly);
    ly += 30 * s;

    const barW = Math.min(280 * s, RW - 80 * s);
    const barH = 12 * s;
    const barGap = 38 * s;

    statEntries.forEach(([k, v], i) => {
      const by = ly + i * barGap;
      const color = ATTR_COLORS[k] || rc.glow;
      const maxBonus = 10;
      const pct = Math.min(1, v / maxBonus);

      ctx.font = `700 ${16 * s}px ${ft}`;
      ctx.fillStyle = theme.labelColor; ctx.textBaseline = "middle";
      ctx.fillText(k, RX, by + barH / 2);

      const bsx = RX + 52 * s;
      rr(ctx, bsx, by, barW, barH, theme.barRadius * s);
      ctx.fillStyle = theme.barBgColor; ctx.fill();

      if (pct > 0) {
        const grd = ctx.createLinearGradient(bsx, 0, bsx + barW * pct, 0);
        grd.addColorStop(0, hexAlpha(color, 0.8));
        grd.addColorStop(1, hexAlpha(color, 0.4));
        rr(ctx, bsx, by, barW * pct, barH, theme.barRadius * s);
        ctx.fillStyle = grd; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(bsx + barW * pct, by + barH / 2, 5 * s, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(color, 0.6); ctx.fill();

      ctx.font = `700 ${17 * s}px ${ft}`;
      ctx.fillStyle = color;
      ctx.fillText(`+${v}`, bsx + barW + 16 * s, by + barH / 2 + 1 * s);
    });

    ly += statEntries.length * barGap + 16 * s;
  }

  // price
  if (item.price > 0) {
    ctx.font = `500 ${14 * s}px ${ft}`;
    ctx.fillStyle = theme.subtitleColor;
    ctx.textBaseline = "middle";
    ctx.fillText("PRICE", RX, ly);
    ly += 26 * s;

    ctx.font = `700 ${36 * s}px ${ft}`;
    ctx.fillStyle = theme.titleColor;
    ctx.fillText(`${item.price}`, RX, ly + 10 * s);

    const priceNumW = ctx.measureText(`${item.price}`).width;
    ctx.font = `500 ${18 * s}px ${ft}`;
    ctx.fillStyle = theme.subtitleColor;
    ctx.fillText(" USDC", RX + priceNumW + 4 * s, ly + 10 * s);
  }

  // === BOTTOM BAR ===
  const bottomY = H - 40 * s;
  ctx.fillStyle = theme.id === "minimal" ? "rgba(0,0,0,0.03)" : `rgba(255,255,255,${theme.bottomBgAlpha})`;
  ctx.fillRect(0, bottomY - 14 * s, W, 54 * s);
  ctx.fillStyle = hexAlpha(rc.glow, 0.08);
  ctx.fillRect(0, bottomY - 14 * s, W, 0.5 * s);

  ctx.font = `500 ${15 * s}px ${ft}`;
  ctx.fillStyle = theme.bottomTextColor; ctx.textBaseline = "middle";
  ctx.fillText("Base Network", 56 * s, bottomY + 8 * s);

  ctx.font = `600 ${16 * s}px ${ft}`;
  ctx.fillStyle = theme.bottomTextColor;
  ctx.textAlign = "right";
  ctx.fillText("gotchipus.com", W - 56 * s, bottomY + 8 * s);
  ctx.textAlign = "left";

  // CRT vignette
  if (theme.crtVignette) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, "transparent"); vig.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  return c;
}

// ── Win98 styles ──

const WIN98_BTN =
  "flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] transition-colors";
const WIN98_INSET =
  "border-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080]";

// ── Component ──

export function WearableShareCardModal({ item, onClose }: WearableShareCardModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const SIZE_OPTIONS = [
    { w: 1600, h: 900, label: "1600×900" },
    { w: 1600, h: 675, label: "1600×675" },
  ] as const;
  const [sizeIdx, setSizeIdx] = useState(0);
  const [themeIdx, setThemeIdx] = useState(0);
  const assetsRef = useRef<RenderAssets>({ itemImg: null, logoImg: null });

  const selectedSize = SIZE_OPTIONS[sizeIdx];
  const currentTheme = THEMES[themeIdx];

  // Load assets
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      item.imagePath ? loadImage(item.imagePath) : Promise.resolve(null),
      loadImage("/favicon.png"),
    ]).then(([itemImg, logoImg]) => {
      if (cancelled) return;
      assetsRef.current = { itemImg, logoImg };
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [item.imagePath]);

  // Draw preview
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;
    const c = renderWearableCard(item, 1200, 675, assetsRef.current, currentTheme);
    canvasRef.current.width = c.width;
    canvasRef.current.height = c.height;
    canvasRef.current.getContext("2d")!.drawImage(c, 0, 0);
  }, [isLoading, item, themeIdx]);

  const handleDownload = useCallback(() => {
    setBusy(true);
    setTimeout(() => {
      const c = renderWearableCard(item, selectedSize.w, selectedSize.h, assetsRef.current, currentTheme);
      const a = document.createElement("a");
      a.download = `gotchipus-wearable-${item.id}-${item.name.toLowerCase().replace(/\s+/g, '-')}-${currentTheme.id}-${selectedSize.w}x${selectedSize.h}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
      setBusy(false);
    }, 30);
  }, [item, selectedSize, currentTheme]);

  const handleCopy = useCallback(async () => {
    setBusy(true);
    try {
      const c = renderWearableCard(item, selectedSize.w, selectedSize.h, assetsRef.current, currentTheme);
      c.toBlob(async (b) => {
        if (b) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch { /* clipboard not available */ }
        }
        setBusy(false);
      }, "image/png");
    } catch {
      setBusy(false);
    }
  }, [item, selectedSize, currentTheme]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-win98-face border-2 border-[#808080] shadow-win98-outer w-[720px] max-w-[95vw] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="h-7 flex items-center justify-between pl-3 pr-1.5 bg-uni-bg-02 text-white">
          <span className="text-base font-bold truncate select-none">
            Share Card — {item.name}
          </span>
          <button onClick={onClose} className={`${WIN98_BTN} w-[18px] h-[18px]`}>
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <span className="text-xs text-[#808080]">Generating share card...</span>
            </div>
          ) : (
            <>
              {/* Preview */}
              <div className={`${WIN98_INSET} bg-[#1a1a2e] p-2 mb-3`}>
                <canvas ref={canvasRef} className="block w-full rounded-sm" />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* Theme selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#808080]">Theme</span>
                    {THEMES.map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeIdx(i)}
                        className={`px-2.5 py-0.5 text-[10px] ${WIN98_BTN} ${
                          themeIdx === i ? "border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#b0b0b0]" : ""
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {/* Size selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#808080]">Size</span>
                    {SIZE_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setSizeIdx(i)}
                        className={`px-2.5 py-0.5 text-[10px] ${WIN98_BTN} ${
                          sizeIdx === i ? "border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#b0b0b0]" : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={busy}
                    className={`px-4 py-1 text-xs ${WIN98_BTN} ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={busy}
                    className={`px-4 py-1 text-xs font-bold ${WIN98_BTN} ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {busy ? "Exporting..." : "Download PNG"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
