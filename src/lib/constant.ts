import { Token } from "@/lib/types"

export const WINDOW_SIZE = {
  "marketplace": {
    "width": 500,
    "height": 400
  },
  "nft": {
    "width": 500,
    "height": 400
  },
  "ai": {
    "width": 1200,
    "height": 800
  },
  "dashboard": {
    "width": 1200,
    "height": 800
  },
  "about": {
    "width": 800,
    "height": 800
  },
  "farm": {
    "width": 1200,
    "height": 800
  },
  "hooks": {
    "width": 800,
    "height": 600
  },
  "dna": {
    "width": 1200,
    "height": 800
  },
  "mint": {
    "width": 960,
    "height": 620
  },
  "wearable": {
    "width": 1200,
    "height": 800
  },
  "wallet-connect-tba": {
    "width": 600,
    "height": 800
  },
  "all-gotchi": {
    "width": 1200,
    "height": 800
  },
  "hook-rank": {
    "width": 1300,
    "height": 800
  },
  "terminal": {
    "width": 1300,
    "height": 800
  },
  "pharos-world": {
    "width": 1300,
    "height": 800
  }
};


export const CHAIN_ID = 1672;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const BG_BYTES32 = "0x676f746368697075732d62670000000000000000000000000000000000000000";
export const BODY_BYTES32 = "0x676f746368697075732d626f6479000000000000000000000000000000000000";
export const EYE_BYTES32 = "0x676f746368697075732d65796500000000000000000000000000000000000000";
export const HAND_BYTES32 = "0x676f746368697075732d68616e64000000000000000000000000000000000000";
export const FACE_BYTES32 = "0x676f746368697075732d66616365000000000000000000000000000000000000";
export const MOUTH_BYTES32 = "0x676f746368697075732d6d6f7574680000000000000000000000000000000000";
export const HEAD_BYTES32 = "0x676f746368697075732d68656164000000000000000000000000000000000000";
export const CLOTHES_BYTES32 = "0x676f746368697075732d636c6f74686573000000000000000000000000000000";

export const Tokens: Token[] = [
  { name: "Pharos", symbol: "PROS", icon: "/tokens/pros.png", contract: "0x0000000000000000000000000000000000000000", balance: "0", decimals: 18, popular: false },
  { name: "USD Coin", symbol: "USDC", icon: "/tokens/usdc.png", contract: "0xC879C018dB60520F4355C26eD1a6D572cdAC1815", balance: "0", decimals: 6, popular: false },
  { name: "Wrapped Ether", symbol: "WETH", icon: "/tokens/eth.png", contract: "0x1f4b7011Ee3d53969bb67F59428a9ec0477856E9", balance: "0", decimals: 18, popular: false },
  { name: "Tether USD", symbol: "USDT", icon: "/tokens/usdt.png", contract: "0xE7E84B8B4f39C507499c40B4ac199B050e2882d5", balance: "0", decimals: 6, popular: false },
  { name: "Wrapped BTC", symbol: "WBTC", icon: "/tokens/wbtc.png", contract: "0x0c64F03EEa5c30946D5c55B4b532D08ad74638a4", balance: "0", decimals: 8, popular: false },
  { name: "Wrapped PROS", symbol: "WPROS", icon: "/tokens/pros.png", contract: "0x52c48d4213107b20bc583832b0d951fb9ca8f0b0", balance: "0", decimals: 8, popular: false },
];

export const WINDOW_BREAKPOINTS = {
  MOBILE: 640,
  MAX_CONTENT_WIDTH: 1200
};

export const WINDOW_MAX_CONTENT_WIDTH: Record<string, number> = {
  "dashboard": 1200,
  "wearable": 1200,
  "ai": 9999,
  "mint": 960,
  "all-gotchi": 1200,
  "hook-rank": 1200,
  "terminal": 9999,
  "pharos-world": 9999,
  "default": 1200
};