"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WearableIndices } from "@/hooks/useSvgLayers";
import { WearableType, getWearableFileName } from "@/src/utils/wearableMapping";
import { GotchipusInfo } from "@/lib/types";
import { generateShareQuote } from "./ShareCardQuotes";

// ── Types ──

interface ShareCardModalProps {
  wearableIndices: WearableIndices;
  pusName: string;
  tokenId: string;
  tokenInfo: GotchipusInfo;
  tbaAddress: string;
  /** Real on-chain attributes [STR, INT, DEF, VIT, AGI, LUK] already divided by 100 */
  attributes?: number[];
  onClose: () => void;
}

interface PetData {
  id: number;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  cls: "support" | "attack" | "defense" | "speed";
  level: number;
  xp: number;
  xpMax: number;
  gen: number;
  attrs: Record<string, number>;
  tba: string;
}

// ── Theme system ──

interface CardTheme {
  id: string;
  label: string;
  // Background
  bgGradient: [string, string, string]; // [start, mid, end]
  usesRarityBg: boolean; // blend rarity bg color into mid stop
  gridAlpha: number;
  gridColor: string | null; // null = use rarity glow
  particleAlpha: number;
  watermarkAlpha: number;
  // Text
  titleColor: string;
  subtitleColor: string;
  labelColor: string;
  font: string;
  // Bars
  barBgColor: string;
  barRadius: number; // 0 = square/pixel
  // Card (PFP)
  cardBg: [string, string];
  cardBorderAlpha: number;
  cardRadius: number;
  cardGlowAlpha: number;
  imgRadius: number;
  // Bottom bar
  bottomBgAlpha: number;
  bottomTextColor: string;
  // Special
  scanlines: boolean;
  pixelBorders: boolean;
  crtVignette: boolean;
}

const THEMES: CardTheme[] = [
  {
    id: "cyber", label: "Cyber",
    bgGradient: ["#08080f", "", "#06060c"], usesRarityBg: true,
    gridAlpha: 0.03, gridColor: null, particleAlpha: 0.08, watermarkAlpha: 0.06,
    titleColor: "#fff", subtitleColor: "rgba(255,255,255,0.35)", labelColor: "rgba(255,255,255,0.5)",
    font: "-apple-system, 'Segoe UI', sans-serif",
    barBgColor: "rgba(255,255,255,0.06)", barRadius: 5,
    cardBg: ["#141420", "#0c0c18"], cardBorderAlpha: 0.4, cardRadius: 18, cardGlowAlpha: 0.5, imgRadius: 14,
    bottomBgAlpha: 0.04, bottomTextColor: "rgba(255,255,255,0.3)",
    scanlines: false, pixelBorders: false, crtVignette: false,
  },
  {
    id: "retro", label: "Retro",
    bgGradient: ["#1a0a20", "#2d1b3d", "#0f0818"], usesRarityBg: false,
    gridAlpha: 0, gridColor: null, particleAlpha: 0.12, watermarkAlpha: 0.04,
    titleColor: "#ffe4f0", subtitleColor: "rgba(255,200,230,0.4)", labelColor: "rgba(255,200,230,0.5)",
    font: "'Courier New', 'SF Mono', monospace",
    barBgColor: "rgba(255,150,200,0.08)", barRadius: 0,
    cardBg: ["#220e2e", "#180a1e"], cardBorderAlpha: 0.5, cardRadius: 4, cardGlowAlpha: 0.6, imgRadius: 2,
    bottomBgAlpha: 0.06, bottomTextColor: "rgba(255,200,230,0.35)",
    scanlines: true, pixelBorders: false, crtVignette: true,
  },
  {
    id: "pixel", label: "Pixel",
    bgGradient: ["#1a1c2e", "#263238", "#1a1c2e"], usesRarityBg: false,
    gridAlpha: 0.06, gridColor: "#4fc3f7", particleAlpha: 0, watermarkAlpha: 0.03,
    titleColor: "#e0f7fa", subtitleColor: "rgba(200,240,255,0.4)", labelColor: "rgba(200,240,255,0.55)",
    font: "'Courier New', 'SF Mono', monospace",
    barBgColor: "rgba(100,200,255,0.08)", barRadius: 0,
    cardBg: ["#263040", "#1a2030"], cardBorderAlpha: 0.6, cardRadius: 0, cardGlowAlpha: 0, imgRadius: 0,
    bottomBgAlpha: 0.08, bottomTextColor: "rgba(200,240,255,0.35)",
    scanlines: false, pixelBorders: true, crtVignette: false,
  },
  {
    id: "minimal", label: "Minimal",
    bgGradient: ["#f5f5f0", "#e8e8e0", "#f0f0ea"], usesRarityBg: false,
    gridAlpha: 0, gridColor: null, particleAlpha: 0, watermarkAlpha: 0.03,
    titleColor: "#1a1a1a", subtitleColor: "rgba(0,0,0,0.35)", labelColor: "rgba(0,0,0,0.45)",
    font: "-apple-system, 'Segoe UI', sans-serif",
    barBgColor: "rgba(0,0,0,0.06)", barRadius: 5,
    cardBg: ["#ffffff", "#f8f8f5"], cardBorderAlpha: 0.2, cardRadius: 16, cardGlowAlpha: 0.15, imgRadius: 12,
    bottomBgAlpha: 0.04, bottomTextColor: "rgba(0,0,0,0.3)",
    scanlines: false, pixelBorders: false, crtVignette: false,
  },
];

// ── Constants ──

const RARITY: Record<string, { glow: string; label: string; bg: string }> = {
  common:    { glow: "#8899aa", label: "COMMON",    bg: "#2a3040" },
  rare:      { glow: "#a855f7", label: "RARE",      bg: "#1a1030" },
  epic:      { glow: "#ec4899", label: "EPIC",      bg: "#1a0a1a" },
  legendary: { glow: "#f59e0b", label: "LEGENDARY", bg: "#1a1400" },
};

const CLASS: Record<string, { color: string; label: string }> = {
  support: { color: "#4ade80", label: "SUPPORT" },
  attack:  { color: "#f87171", label: "ATTACK" },
  defense: { color: "#60a5fa", label: "DEFENSE" },
  speed:   { color: "#fbbf24", label: "SPEED" },
};

const ATTRS: Record<string, { color: string; full: string }> = {
  STR: { color: "#f87171", full: "Strength" },
  DEF: { color: "#fb923c", full: "Defense" },
  AGI: { color: "#c084fc", full: "Agility" },
  INT: { color: "#60a5fa", full: "Intelligence" },
  VIT: { color: "#34d399", full: "Vitality" },
  LUK: { color: "#fbbf24", full: "Luck" },
};

const MAX_ATTR = 40;

const RARITY_MAP: Record<number, "common" | "rare" | "epic" | "legendary"> = {
  0: "common", 1: "rare", 2: "epic", 3: "legendary",
};

const FACTION_MAP: Record<number, "support" | "attack" | "defense" | "speed"> = {
  0: "support", 1: "attack", 2: "support", 3: "defense", 4: "speed",
};

// ── Canvas helpers ──

const CDN_BASE = "https://assets.gotchi.ai";
const R2_DIRECTORY: Record<WearableType, string> = {
  backgrounds: "backgrounds", bodys: "body_close", eyes: "eyes",
  hands: "hands", heads: "heads", clothes: "clothes",
  faces: "faces", mouths: "mouths",
};

const LAYER_ORDER: { type: WearableType; indexKey: keyof WearableIndices }[] = [
  { type: "backgrounds", indexKey: "backgroundIndex" },
  { type: "bodys", indexKey: "bodyIndex" },
  { type: "eyes", indexKey: "eyeIndex" },
  { type: "mouths", indexKey: "mouthIndex" },
  { type: "clothes", indexKey: "clothesIndex" },
  { type: "faces", indexKey: "faceIndex" },
  { type: "heads", indexKey: "headIndex" },
  { type: "hands", indexKey: "handIndex" },
];

function getLayerCdnUrl(type: WearableType, localIndex: number, bodyVariant?: 'body_close' | 'body_open'): string | null {
  if (localIndex === 0) return null;
  const fileId = getWearableFileName(type, localIndex - 1);
  let dir = R2_DIRECTORY[type];
  let actualFileId = fileId;
  if (type === 'bodys' && bodyVariant === 'body_open') {
    dir = 'body_open';
    actualFileId = fileId.replace('body_close', 'body_open');
  }
  return `${CDN_BASE}/png/${dir}/${actualFileId}.png`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const CROP_X = 14;
const CROP_Y = 0;
const CROP_SIZE = 100;

async function composePfpImage(wearableIndices: WearableIndices): Promise<HTMLImageElement | null> {
  const hasHand = wearableIndices.handIndex !== 0;
  const layerUrls = LAYER_ORDER.map(({ type, indexKey }) => {
    if (type === "bodys") {
      return getLayerCdnUrl(type, wearableIndices[indexKey], hasHand ? 'body_open' : 'body_close');
    }
    return getLayerCdnUrl(type, wearableIndices[indexKey]);
  });
  const images = await Promise.all(
    layerUrls.map((url) => (url ? loadImage(url) : Promise.resolve(null)))
  );

  const firstImg = images.find((img) => img !== null);
  const sourceSize = firstImg ? firstImg.naturalWidth : 32;

  const raw = document.createElement("canvas");
  raw.width = sourceSize;
  raw.height = sourceSize;
  const rawCtx = raw.getContext("2d")!;
  for (const img of images) {
    if (img) rawCtx.drawImage(img, 0, 0);
  }

  const pfp = document.createElement("canvas");
  pfp.width = 512;
  pfp.height = 512;
  const pfpCtx = pfp.getContext("2d")!;
  pfpCtx.imageSmoothingEnabled = false;
  pfpCtx.drawImage(raw, CROP_X, CROP_Y, CROP_SIZE, CROP_SIZE, 0, 0, 512, 512);

  return loadImage(pfp.toDataURL("image/png"));
}

/** Pre-load static assets (favicon logo + gotchipus wordmark for background) */
async function loadStaticAssets(): Promise<{
  logoImg: HTMLImageElement | null;
  wordmarkImg: HTMLImageElement | null;
}> {
  const [logoImg, wordmarkImg] = await Promise.all([
    loadImage("/favicon.png"),
    loadImage("/gotchipus.png"),
  ]);
  return { logoImg, wordmarkImg };
}

// ── Drawing utilities ──

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, txt: string, mw: number): string[] {
  const words = txt.split(" "), lines: string[] = [];
  let line = "";
  words.forEach(x => {
    const t = line ? line + " " + x : x;
    if (ctx.measureText(t).width > mw && line) { lines.push(line); line = x; }
    else line = t;
  });
  if (line) lines.push(line);
  return lines;
}

function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Draw blurred gotchipus.png as background watermark */
function drawBlurredWatermark(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  s: number,
  glowColor: string,
) {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.filter = `blur(${12 * s}px)`;

  // Draw centred, scaled up to fill ~60% of height
  const targetH = H * 0.7;
  const aspect = img.naturalWidth / img.naturalHeight;
  const targetW = targetH * aspect;
  const dx = W * 0.25 - targetW / 2;
  const dy = (H - targetH) / 2;
  ctx.drawImage(img, dx, dy, targetW, targetH);

  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Main render ──

interface RenderAssets {
  pfpImage: HTMLImageElement | null;
  logoImg: HTMLImageElement | null;
  wordmarkImg: HTMLImageElement | null;
}

function renderCard(pet: PetData, targetW: number, targetH: number, assets: RenderAssets, theme: CardTheme): HTMLCanvasElement {
  const W = targetW, H = targetH, s = targetW / 1200;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const rc = RARITY[pet.rarity];
  const cc = CLASS[pet.cls];
  const ft = theme.font;

  // === BACKGROUND ===
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.bgGradient[0]);
  bg.addColorStop(0.4, theme.usesRarityBg ? rc.bg : theme.bgGradient[1]);
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

  // ambient glows
  const rg = ctx.createRadialGradient(W * 0.72, H * 0.5, 0, W * 0.72, H * 0.5, H * 0.7);
  rg.addColorStop(0, hexAlpha(rc.glow, 0.12)); rg.addColorStop(0.5, hexAlpha(rc.glow, 0.04)); rg.addColorStop(1, "transparent");
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

  const rg2 = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, H * 0.5);
  rg2.addColorStop(0, hexAlpha(cc.color, 0.06)); rg2.addColorStop(1, "transparent");
  ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);

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

  // blurred gotchipus.png watermark
  if (assets.wordmarkImg && theme.watermarkAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = theme.watermarkAlpha;
    ctx.filter = `blur(${12 * s}px)`;
    const targetHh = H * 0.7;
    const aspect = assets.wordmarkImg.naturalWidth / assets.wordmarkImg.naturalHeight;
    const targetWw = targetHh * aspect;
    ctx.drawImage(assets.wordmarkImg, W * 0.25 - targetWw / 2, (H - targetHh) / 2, targetWw, targetHh);
    ctx.filter = "none"; ctx.globalAlpha = 1;
    ctx.restore();
  }

  // CRT scanlines (retro theme)
  if (theme.scanlines) {
    ctx.save(); ctx.globalAlpha = 0.04;
    for (let y = 0; y < H; y += 3 * s) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, y, W, 1 * s);
    }
    ctx.restore();
  }

  // === LEFT SIDE ===
  const LX = 56 * s, LW = W * 0.44;

  // brand mark
  ctx.save();
  const logoSize = 48 * s;
  const logoR = theme.pixelBorders ? 0 : 10 * s;
  rr(ctx, LX, 40 * s, logoSize, logoSize, logoR);
  ctx.fillStyle = hexAlpha(cc.color, 0.15); ctx.fill();
  ctx.strokeStyle = hexAlpha(cc.color, 0.3); ctx.lineWidth = 1 * s; ctx.stroke();
  if (assets.logoImg) {
    ctx.save();
    rr(ctx, LX + 4 * s, 44 * s, logoSize - 8 * s, logoSize - 8 * s, theme.pixelBorders ? 0 : 6 * s);
    ctx.clip();
    ctx.drawImage(assets.logoImg, LX + 4 * s, 44 * s, logoSize - 8 * s, logoSize - 8 * s);
    ctx.restore();
  }
  ctx.restore();

  ctx.font = `700 ${22 * s}px ${ft}`;
  ctx.fillStyle = hexAlpha(cc.color, 0.8);
  ctx.textBaseline = "middle";
  ctx.fillText("GOTCHIPUS", LX + logoSize + 14 * s, 40 * s + logoSize / 2);

  // pet name — render ".chi" suffix in a distinct accent color
  ctx.font = `700 ${64 * s}px ${ft}`;
  ctx.textBaseline = "alphabetic";
  if (pet.name.endsWith(".chi")) {
    const baseName = pet.name.slice(0, -4);
    ctx.fillStyle = theme.titleColor;
    ctx.fillText(baseName, LX, 148 * s);
    const baseW = ctx.measureText(baseName).width;
    ctx.fillStyle = hexAlpha(rc.glow, 0.6);
    ctx.fillText(".chi", LX + baseW, 148 * s);
  } else {
    ctx.fillStyle = theme.titleColor;
    ctx.fillText(pet.name, LX, 148 * s);
  }

  // token id (plain text, no badge bg)
  const badgeY = 210 * s;
  ctx.font = `600 ${16 * s}px ${ft}`;
  ctx.fillStyle = theme.id === "minimal" ? "#555" : "rgba(255,255,255,0.7)";
  ctx.textBaseline = "middle";
  const idText = `#${pet.id}`;
  ctx.fillText(idText, LX, badgeY + 16 * s);
  let bx = LX + ctx.measureText(idText).width + 14 * s;

  // badges
  const badges = [
    { text: rc.label, color: rc.glow },
    { text: cc.label, color: cc.color },
    { text: `LV ${pet.level}`, color: theme.id === "minimal" ? "#333" : "#ffffff" },
  ];
  const badgeR = theme.pixelBorders ? 0 : 6 * s;
  badges.forEach(b => {
    const tw = ctx.measureText(b.text).width + 24 * s;
    rr(ctx, bx, badgeY, tw, 32 * s, badgeR);
    ctx.fillStyle = hexAlpha(b.color, 0.12); ctx.fill();
    ctx.strokeStyle = hexAlpha(b.color, 0.3); ctx.lineWidth = 1 * s;
    rr(ctx, bx, badgeY, tw, 32 * s, badgeR); ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.fillText(b.text, bx + 12 * s, badgeY + 18 * s);
    bx += tw + 10 * s;
  });

  // divider
  let ly = 262 * s;
  ctx.fillStyle = hexAlpha(rc.glow, 0.15);
  ctx.fillRect(LX, ly, LW * 0.7, 1.5 * s);
  ly += 28 * s;

  // stats bars
  const attrKeys = Object.keys(pet.attrs);
  const barW = 260 * s, barH = 10 * s, barGap = 38 * s;
  attrKeys.forEach((k, i) => {
    const by = ly + i * barGap;
    const attr = ATTRS[k];
    const pct = Math.min(1, pet.attrs[k] / MAX_ATTR);

    ctx.font = `700 ${16 * s}px ${ft}`;
    ctx.fillStyle = theme.labelColor; ctx.textBaseline = "middle";
    ctx.fillText(k, LX, by + barH / 2);

    const bsx = LX + 52 * s;
    rr(ctx, bsx, by, barW, barH, theme.barRadius * s);
    ctx.fillStyle = theme.barBgColor; ctx.fill();

    if (pct > 0) {
      const grd = ctx.createLinearGradient(bsx, 0, bsx + barW * pct, 0);
      grd.addColorStop(0, hexAlpha(attr.color, 0.8));
      grd.addColorStop(1, hexAlpha(attr.color, 0.4));
      rr(ctx, bsx, by, barW * pct, barH, theme.barRadius * s);
      ctx.fillStyle = grd; ctx.fill();
    }

    ctx.beginPath(); ctx.arc(bsx + barW * pct, by + barH / 2, 5 * s, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(attr.color, 0.6); ctx.fill();

    ctx.font = `700 ${17 * s}px ${ft}`;
    ctx.fillStyle = attr.color;
    ctx.fillText(String(pet.attrs[k]), bsx + barW + 16 * s, by + barH / 2 + 1 * s);
  });

  ly += 6 * barGap + 16 * s;

  // Share quote (generated from stats)
  const quote = generateShareQuote(pet);
  {
    ctx.font = `italic 400 ${15 * s}px ${ft}`;
    ctx.fillStyle = theme.id === "minimal" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)";
    const maxQuoteW = LW - 20 * s;
    const fullText = `"${quote}"`;
    const lines = wrap(ctx, fullText, maxQuoteW);
    const maxLines = 2;
    lines.slice(0, maxLines).forEach((l, i) => {
      let text = l;
      if (i === maxLines - 1 && lines.length > maxLines) {
        while (ctx.measureText(text + "...\"").width > maxQuoteW && text.length > 0) {
          text = text.slice(0, -1);
        }
        text = text.trimEnd() + "...\"";
      }
      ctx.fillText(text, LX, ly + i * 20 * s);
    });
  }

  // === BOTTOM BAR ===
  const bottomY = H - 40 * s;
  ctx.fillStyle = theme.id === "minimal" ? "rgba(0,0,0,0.03)" : `rgba(255,255,255,${theme.bottomBgAlpha})`;
  ctx.fillRect(0, bottomY - 14 * s, W, 54 * s);
  ctx.fillStyle = hexAlpha(rc.glow, 0.08);
  ctx.fillRect(0, bottomY - 14 * s, W, 0.5 * s);

  ctx.font = `500 ${15 * s}px ${ft}`;
  ctx.fillStyle = theme.bottomTextColor; ctx.textBaseline = "middle";
  ctx.fillText("Pharos Network", LX, bottomY + 8 * s);
  const dotX = LX + ctx.measureText("Pharos Network").width + 8 * s;
  ctx.fillStyle = theme.id === "minimal" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)";
  ctx.fillText("·", dotX, bottomY + 8 * s);
  ctx.fillStyle = theme.bottomTextColor;
  const chain1W = ctx.measureText("Pharos Network").width + 18 * s;
  ctx.fillText("Account", LX + chain1W, bottomY + 8 * s);
  const chain2W = ctx.measureText("Account").width;
  ctx.fillStyle = theme.id === "minimal" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)";
  ctx.font = `400 ${13 * s}px 'SF Mono', 'Courier New', monospace`;
  if (pet.tba) {
    ctx.fillText(pet.tba.slice(0, 6) + "..." + pet.tba.slice(-4), LX + chain1W + chain2W + 12 * s, bottomY + 8 * s);
  }

  ctx.font = `600 ${16 * s}px ${ft}`;
  ctx.fillStyle = theme.bottomTextColor;
  ctx.textAlign = "right";
  ctx.fillText("gotchipus.com", W - 56 * s, bottomY + 8 * s);
  ctx.textAlign = "left";

  // === RIGHT SIDE: PFP CARD ===
  const cardPad = 18 * s;
  const pfpSize = H - 220 * s;
  const pfpW = pfpSize + cardPad * 2;
  const pfpH = pfpSize + cardPad * 2;
  const pfpX = W - pfpW - 50 * s;
  const pfpY = (H - pfpH) / 2 - 10 * s;
  const cR = theme.cardRadius * s;

  // card glow
  if (theme.cardGlowAlpha > 0) {
    ctx.save();
    ctx.shadowColor = hexAlpha(rc.glow, theme.cardGlowAlpha);
    ctx.shadowBlur = 80 * s;
    rr(ctx, pfpX, pfpY, pfpW, pfpH, cR);
    ctx.fillStyle = "rgba(0,0,0,0.01)"; ctx.fill();
    ctx.restore();
  }

  // card bg
  rr(ctx, pfpX, pfpY, pfpW, pfpH, cR);
  const cardBgGrad = ctx.createLinearGradient(pfpX, pfpY, pfpX + pfpW, pfpY + pfpH);
  cardBgGrad.addColorStop(0, theme.cardBg[0]); cardBgGrad.addColorStop(1, theme.cardBg[1]);
  ctx.fillStyle = cardBgGrad; ctx.fill();

  // card border
  ctx.strokeStyle = hexAlpha(rc.glow, theme.cardBorderAlpha); ctx.lineWidth = 2 * s;
  rr(ctx, pfpX, pfpY, pfpW, pfpH, cR); ctx.stroke();
  if (!theme.pixelBorders) {
    ctx.strokeStyle = hexAlpha(rc.glow, 0.08); ctx.lineWidth = 0.5 * s;
    rr(ctx, pfpX + 5 * s, pfpY + 5 * s, pfpW - 10 * s, pfpH - 10 * s, Math.max(0, cR - 4 * s)); ctx.stroke();
  }

  // PFP image
  const imgX = pfpX + cardPad, imgY = pfpY + cardPad;
  const imgW = pfpSize, imgH = pfpSize;
  const iR = theme.imgRadius * s;
  ctx.save();
  rr(ctx, imgX, imgY, imgW, imgH, iR); ctx.clip();
  ctx.fillStyle = theme.id === "minimal" ? "#e8e8e0" : "#0a0a16";
  ctx.fillRect(imgX, imgY, imgW, imgH);

  if (assets.pfpImage) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(assets.pfpImage, imgX, imgY, imgW, imgH);
  }

  const pfpGlow = ctx.createRadialGradient(imgX + imgW / 2, imgY + imgH * 0.4, 0, imgX + imgW / 2, imgY + imgH * 0.4, imgW * 0.5);
  pfpGlow.addColorStop(0, hexAlpha(cc.color, 0.08)); pfpGlow.addColorStop(1, "transparent");
  ctx.fillStyle = pfpGlow; ctx.fillRect(imgX, imgY, imgW, imgH);
  ctx.restore();

  ctx.strokeStyle = hexAlpha(rc.glow, 0.2); ctx.lineWidth = 1 * s;
  rr(ctx, imgX, imgY, imgW, imgH, iR); ctx.stroke();

  // Pixel border double-line effect
  if (theme.pixelBorders) {
    ctx.strokeStyle = hexAlpha(rc.glow, 0.15); ctx.lineWidth = 3 * s;
    rr(ctx, pfpX - 3 * s, pfpY - 3 * s, pfpW + 6 * s, pfpH + 6 * s, 0); ctx.stroke();
  }

  // CRT vignette (retro theme)
  if (theme.crtVignette) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, "transparent"); vig.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  return c;
}

// ── Build PetData from GotchipusInfo ──

function buildPetData(tokenId: string, pusName: string, tokenInfo: GotchipusInfo, tbaAddress: string, attributes?: number[]): PetData {
  const currentExp = Number(tokenInfo.currentExp || 0);
  const level = Math.floor(currentExp / 100);
  const xp = Math.floor(((currentExp / 100) % 1) * 100);

  // Use on-chain attributes when available; order: [STR, INT, DEF, VIT, AGI, LUK]
  const useOnChain = attributes && attributes.length >= 6;

  return {
    id: Number(tokenId),
    name: pusName ? `${pusName}.chi` : `Gotchipus #${tokenId}`,
    rarity: RARITY_MAP[tokenInfo.rarity ?? 0] || "common",
    cls: FACTION_MAP[tokenInfo.faction ?? 0] || "support",
    level,
    xp,
    xpMax: 100,
    gen: 0,
    attrs: {
      STR: useOnChain ? attributes[0] : Math.round(Number(tokenInfo.core?.strength || 0) / 100),
      INT: useOnChain ? attributes[1] : Math.round(Number(tokenInfo.core?.mind || 0) / 100),
      DEF: useOnChain ? attributes[2] : Math.round(Number(tokenInfo.core?.defense || 0) / 100),
      VIT: useOnChain ? attributes[3] : Math.round(Number(tokenInfo.core?.vitality || 0) / 100),
      AGI: useOnChain ? attributes[4] : Math.round(Number(tokenInfo.core?.agility || 0) / 100),
      LUK: useOnChain ? attributes[5] : Math.round(Number(tokenInfo.core?.luck || 0) / 100),
    },
    tba: tbaAddress,
  };
}

// ── Win98 styles ──

const WIN98_BTN =
  "flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] transition-colors";
const WIN98_INSET =
  "border-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080]";

// ── Component ──

export function ShareCardModal({
  wearableIndices,
  pusName,
  tokenId,
  tokenInfo,
  tbaAddress,
  attributes,
  onClose,
}: ShareCardModalProps) {
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
  const assetsRef = useRef<RenderAssets>({ pfpImage: null, logoImg: null, wordmarkImg: null });

  const pet = buildPetData(tokenId, pusName, tokenInfo, tbaAddress, attributes);

  const selectedSize = SIZE_OPTIONS[sizeIdx];

  // Step 1: Load all assets (PFP + favicon + gotchipus.png)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      composePfpImage(wearableIndices),
      loadStaticAssets(),
    ]).then(([pfpImg, staticAssets]) => {
      if (cancelled) return;
      assetsRef.current = {
        pfpImage: pfpImg,
        logoImg: staticAssets.logoImg,
        wordmarkImg: staticAssets.wordmarkImg,
      };
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [wearableIndices]);

  const currentTheme = THEMES[themeIdx];

  // Step 2: Draw to canvas once loading is done and canvas is in DOM
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;
    const c = renderCard(pet, 1200, 675, assetsRef.current, currentTheme);
    canvasRef.current.width = c.width;
    canvasRef.current.height = c.height;
    canvasRef.current.getContext("2d")!.drawImage(c, 0, 0);
  }, [isLoading, tokenId, pusName, themeIdx]);

  const handleDownload = useCallback(() => {
    setBusy(true);
    setTimeout(() => {
      const c = renderCard(pet, selectedSize.w, selectedSize.h, assetsRef.current, currentTheme);
      const a = document.createElement("a");
      a.download = `gotchipus-${pet.id}-card-${currentTheme.id}-${selectedSize.w}x${selectedSize.h}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
      setBusy(false);
    }, 30);
  }, [pet, selectedSize]);

  const handleCopy = useCallback(async () => {
    setBusy(true);
    try {
      const c = renderCard(pet, selectedSize.w, selectedSize.h, assetsRef.current, currentTheme);
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
  }, [pet, selectedSize]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
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
            {t('shareCard.title', { defaultValue: `Share Card — Gotchipus #${tokenId}` })}
          </span>
          <button onClick={onClose} className={`${WIN98_BTN} w-[18px] h-[18px]`}>
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <span className="text-xs text-[#808080]">
                {t('shareCard.generating', { defaultValue: 'Generating share card...' })}
              </span>
            </div>
          ) : (
            <>
              {/* Preview */}
              <div className={`${WIN98_INSET} bg-[#1a1a2e] p-2 mb-3`}>
                <canvas
                  ref={canvasRef}
                  className="block w-full rounded-sm"
                />
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
                    {copied
                      ? t('shareCard.copied', { defaultValue: 'Copied!' })
                      : t('shareCard.copyClipboard', { defaultValue: 'Copy' })}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={busy}
                    className={`px-4 py-1 text-xs font-bold ${WIN98_BTN} ${busy ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {busy
                      ? t('shareCard.exporting', { defaultValue: 'Exporting...' })
                      : t('shareCard.downloadPng', { defaultValue: 'Download PNG' })}
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
