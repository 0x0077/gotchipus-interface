export interface WearableItem {
  id: number;
  name: string;
  imagePath: string;
  category: 'head' | 'hand' | 'clothes' | 'face' | 'mouth';
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  stats: Record<string, number>;
  wearableId?: string;
  totalSupply?: number;
  remainingSupply?: number;
  soldCount?: number;
  currency?: string;
}

export interface CartItem extends WearableItem {
  quantity: number;
}

export interface RarityConfig {
  color: string;
  bg: string;
  glow: string;
  border: string;
  tier: number;
}

export const RARITY: Record<string, RarityConfig> = {
  common:    { color: '#808080', bg: '#e0e0e0', glow: 'rgba(128,128,128,0.15)', border: '#808080', tier: 1 },
  rare:      { color: '#0000CC', bg: '#d0d8ff', glow: 'rgba(0,0,204,0.12)',     border: '#0000CC', tier: 2 },
  epic:      { color: '#8B008B', bg: '#f0d0f0', glow: 'rgba(139,0,139,0.12)',   border: '#8B008B', tier: 3 },
  legendary: { color: '#CC8800', bg: '#fff0c0', glow: 'rgba(204,136,0,0.15)',   border: '#CC8800', tier: 4 },
};

export const RARITY_COLORS = {
  common: '#808080',
  rare: '#0000CC',
  epic: '#8B008B',
  legendary: '#CC8800'
} as const;

export const RARITY_BG = {
  common: '#e0e0e0',
  rare: '#d0d8ff',
  epic: '#f0d0f0',
  legendary: '#fff0c0'
} as const;

export const RARITY_TIER = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
} as const;

export const RARITY_MULTIPLIER = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 5
} as const;

export type SortOption = 'price-asc' | 'price-desc' | 'rarity' | 'latest';

export const CATEGORY_ORDER = ['head', 'face', 'clothes', 'hand', 'mouth'] as const;

export interface CategoryOption {
  value: string;
  label: string;
  icon: string;
}

export interface RarityOption {
  value: string;
  label: string;
  color: string;
}
