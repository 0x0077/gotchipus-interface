"use client";

export interface EquipSlotData {
  name: string;
  fullName: string;
  type: string;
  canEquip: boolean;
  equipped: { tokenId: number; imagePath: string | null; name: string | null } | null;
}

export interface TokenItem {
  symbol: string;
  name: string;
  amount: number;
  usd: number;
  logoPath: string;
  contract: string;
}

export interface NftItem {
  tokenId: number;
  name: string;
  imagePath: string | null;
}

export interface NftCollection {
  type: string;
  label: string;
  items: NftItem[];
}

export interface PortfolioApiData {
  tba_address: string;
  token_contract: string;
  token_id: number;
  total_usd: number;
  native: {
    symbol: string;
    balance: string;
    balance_raw: string;
    decimals: number;
    usd: number;
  };
  erc20s: Array<{
    token_address: string;
    name: string;
    symbol: string;
    balance: string;
    balance_raw: string;
    decimals: number;
    usd: number;
    logo?: string;
  }>;
  nfts: Array<{
    token_address: string;
    token_type: string;
    name: string;
    symbol: string;
    token_id: number;
    amount: string;
  }>;
}

export function Win98GroupBox({ label, children, className = "" }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={`border border-[#808080] m-0 p-3 pb-2 relative ${className}`}>
      {label && <legend className="text-xs text-[#000000] px-1 font-normal">{label}</legend>}
      {children}
    </fieldset>
  );
}
