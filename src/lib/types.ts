import type { JSX } from "react"

export interface GotchiMetadata {
  // Primary Key & Identifiers
  id: number;
  token_id: number;

  // Basic Info
  name?: string;
  uri?: string;
  owner?: string;
  collateral?: string;
  collateral_amount?: string;
  status: number;
  locked: boolean;
  birth_time?: number;
  rarity?: number;
  faction?: number;
  currentExp?: number;

  // Core
  core: GotchipusCore;

  // ERC6551
  singer?: string;
  nonces?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
  synced_at?: string;
  block_number?: number;

  // Equipped wearables (array from API)
  all_equip?: Array<{
    equipped: boolean;
    wearable_id: string;
    wearable_type: string;
  }>;
}

export interface WindowType {
  id: string
  title: string
  icon?: string
  content: JSX.Element
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  minimized: boolean
}

export interface DesktopIconProps {
  id: string
  title: string
  icon: string
  onClick: (id: string) => void
  isActive: boolean
  isMobile?: boolean
}

// ── Contract sub-structs ──

export interface SoulCore {
  balance: number;
  maxSoulCapacity: number;
  lastSoulUpdate: number;
  dormantSince: number;
}

export interface GotchipusCore {
  strength: number;
  defense: number;
  mind: number;
  vitality: number;
  agility: number;
  luck: number;
  soul: SoulCore;
}

// ── Main contract struct ──

export interface GotchipusInfo {
  name: string;
  uri: string;
  collateral: string;
  collateralAmount: string;
  status: number;
  locked: boolean;
  birthTime: number;
  rarity: number;
  faction: number;
  currentExp: number;
  core: GotchipusCore;
  singer: string;
  nonces: string;
}

export interface GotchiItem {
  id: string;
  info?: GotchipusInfo;
}

export interface NftParts {
  background?: number;
  body?: number;
  clothes?: number;
  head?: number;
  eye?: number;
  hand?: number;
}

export interface EquipWearableType {
  wearableType: string;
  wearableId: number;
  equiped: boolean;
}

export interface WearableDefinition {
  id: number;
  name: string;
  svg: string;
}

export interface Token {
  name: string;
  icon: string;
  symbol: string;
  contract: string;
  balance?: string;
  decimals: number;
  popular?: boolean;
}