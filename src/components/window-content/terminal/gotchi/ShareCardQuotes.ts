/**
 * Generates a share-card quote based on the Gotchi's stats.
 *
 * The quote highlights the dominant attribute or rarity, giving each card
 * a unique flavour text without relying on user-authored stories.
 */

type Rarity = "common" | "rare" | "epic" | "legendary";
type Faction = "support" | "attack" | "defense" | "speed";

interface QuoteInput {
  name: string;
  rarity: Rarity;
  cls: Faction;
  level: number;
  attrs: Record<string, number>; // STR, INT, DEF, VIT, AGI, LUK
}

// ── Quote pools ──────────────────────────────────────────

const ATTR_QUOTES: Record<string, string[]> = {
  STR: [
    "Raw power flows through every tentacle.",
    "Strength isn't everything — but it sure helps in the deep.",
    "Built different. Built stronger.",
  ],
  INT: [
    "A mind sharper than any coral reef.",
    "Knowledge is the real treasure of the abyss.",
    "Outsmart, outthink, outlast.",
  ],
  DEF: [
    "An unbreakable shell forged by the tides.",
    "Nothing gets through this armor — nothing.",
    "Stand firm. The ocean bends around the rock.",
  ],
  VIT: [
    "Overflowing with life force from the deep.",
    "Endurance is the truest form of strength.",
    "The pulse of the ocean runs strong in this one.",
  ],
  AGI: [
    "Swift as a current, silent as the deep.",
    "Speed is the art of arriving before trouble does.",
    "Try to catch the tide.",
  ],
  LUK: [
    "Fortune favors the brave — and this Gotchi is both.",
    "Some call it luck. Some call it destiny.",
    "Every coin flip lands the right way up.",
  ],
};

const RARITY_QUOTES: Record<Rarity, string[]> = {
  common: [
    "Every legend starts somewhere.",
    "Common by birth, uncommon by choice.",
  ],
  rare: [
    "One of the few. One of the finest.",
    "Rarity isn't given — it's earned.",
  ],
  epic: [
    "Legends whisper this name across the abyss.",
    "Epic by nature, unstoppable by design.",
  ],
  legendary: [
    "A living legend of the Pharos depths.",
    "Born once in a thousand tides.",
  ],
};

const FACTION_QUOTES: Record<Faction, string[]> = {
  support: [
    "The tide that lifts all ships.",
    "Strength through unity.",
  ],
  attack: [
    "Strike first. Strike true.",
    "The ocean's fury, concentrated.",
  ],
  defense: [
    "The last line between chaos and calm.",
    "Immovable as the deep-sea bedrock.",
  ],
  speed: [
    "Faster than light through water.",
    "Velocity is a language of its own.",
  ],
};

// ── Generator ────────────────────────────────────────────

function seededIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return ((h % len) + len) % len;
}

export function generateShareQuote(input: QuoteInput): string {
  const { name, rarity, cls, attrs } = input;

  // Find the dominant attribute
  let maxKey = "STR";
  let maxVal = 0;
  for (const [k, v] of Object.entries(attrs)) {
    if (v > maxVal) { maxVal = v; maxKey = k; }
  }

  // Deterministic pick based on name so the same Gotchi always gets the same quote
  const seed = name.toLowerCase();

  // Legendary/Epic → rarity quote 40%, attr 40%, faction 20%
  // Rare → attr 50%, rarity 30%, faction 20%
  // Common → attr 60%, faction 20%, rarity 20%
  const roll = seededIndex(seed + "roll", 100);

  let pool: string[];
  if (rarity === "legendary" || rarity === "epic") {
    if (roll < 40) pool = RARITY_QUOTES[rarity];
    else if (roll < 80) pool = ATTR_QUOTES[maxKey] || ATTR_QUOTES.STR;
    else pool = FACTION_QUOTES[cls] || FACTION_QUOTES.support;
  } else if (rarity === "rare") {
    if (roll < 50) pool = ATTR_QUOTES[maxKey] || ATTR_QUOTES.STR;
    else if (roll < 80) pool = RARITY_QUOTES[rarity];
    else pool = FACTION_QUOTES[cls] || FACTION_QUOTES.support;
  } else {
    if (roll < 60) pool = ATTR_QUOTES[maxKey] || ATTR_QUOTES.STR;
    else if (roll < 80) pool = FACTION_QUOTES[cls] || FACTION_QUOTES.support;
    else pool = RARITY_QUOTES[rarity];
  }

  return pool[seededIndex(seed + "pick", pool.length)];
}
