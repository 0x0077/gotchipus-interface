// On-chain faction encoding — authoritative source: Solidity contract
// `LibFaction.sol` (`enum GotchiFaction { COMBAT, DEFENSE, TECHNOLOGY }`).
//
// uint8 values:
//   0 → COMBAT
//   1 → DEFENSE
//   2 → TECHNOLOGY
//
// There is no NONE / SUPPORT / TECH — older tables in this codebase that
// included those were stale. Always import this module instead of inlining
// a faction map.

export type FactionId = 0 | 1 | 2;

export type FactionKey = 'combat' | 'defense' | 'technology';
export type FactionLabel = 'COMBAT' | 'DEFENSE' | 'TECHNOLOGY';

export const FACTION_KEYS: Record<FactionId, FactionKey> = {
  0: 'combat',
  1: 'defense',
  2: 'technology',
};

export const FACTION_LABELS: Record<FactionId, FactionLabel> = {
  0: 'COMBAT',
  1: 'DEFENSE',
  2: 'TECHNOLOGY',
};

/** Stat bonuses per faction (from LibFaction.sol comment). */
export const FACTION_BONUSES: Record<FactionId, string> = {
  0: '+15% Strength · +8% Agility',
  1: '+15% Defense · +8% Vitality',
  2: '+15% Mind · +8% Luck',
};

/** Element/attribute groups per faction (from LibFaction.GotchiAttributes). */
export const FACTION_ELEMENTS: Record<FactionId, string[]> = {
  0: ['flame', 'storm', 'shadow'],
  1: ['ice', 'earth', 'light'],
  2: ['lightning', 'water', 'void'],
};

/** Returns true if the given number is a valid on-chain faction id. */
export function isValidFactionId(n: number | undefined | null): n is FactionId {
  return n === 0 || n === 1 || n === 2;
}

/** Get the lowercase key (`combat | defense | technology`) for a chain faction
 *  uint8. Returns null when the input is missing or out-of-range so callers
 *  must explicitly handle the unknown case rather than silently defaulting. */
export function factionKey(n: number | undefined | null): FactionKey | null {
  return isValidFactionId(n) ? FACTION_KEYS[n] : null;
}

/** Get the uppercase display label. */
export function factionLabel(n: number | undefined | null): FactionLabel | null {
  return isValidFactionId(n) ? FACTION_LABELS[n] : null;
}
