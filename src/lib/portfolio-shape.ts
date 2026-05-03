import type { PortfolioApiData } from '@/components/window-content/terminal/gotchi/GotchiDetailHelpers';

export interface BatchBalanceEntry {
  address: string;
  token_address: string;
  token_id: number;
  balance: string;
  updated_block: number;
  updated_tx_hash: string;
  created_at: string;
  updated_at: string;
  token_type?: string;       // "ERC20" | "ERC721" | "ERC1155"
  name?: string;
  symbol?: string;
  decimals?: number | null;  // null for NFTs
}

export interface BatchBalanceResponse {
  code: number;
  status: string;
  data: {
    total: number;
    balances: Record<string, BatchBalanceEntry[]>;
  };
}

export const KNOWN_TOKENS: Record<string, {
  symbol: string;
  name: string;
  decimals: number;
  type: 'erc20' | 'nft';
  logo?: string;
  nftType?: string;
}> = {
  '0x5a3afa97584fa8cdec4be2a6ab86ceed05600c5e': { symbol: 'GOTCHI', name: 'Gotchipus', type: 'nft', decimals: 0, nftType: 'ERC1155' },
  '0x2b441dbb56d0ee547718d4966781750e8e9df4f1': { symbol: 'CHI', name: '.chi Names', type: 'nft', decimals: 0, nftType: 'ERC721' },
  '0xc879c018db60520f4355c26ed1a6d572cdac1815': { symbol: 'USDC', name: 'USD Coin', type: 'erc20', decimals: 6, logo: '/tokens/usdc.png' },
  '0x52c48d4213107b20bc583832b0d951fb9ca8f0b0': { symbol: 'WPROS', name: 'Wrapped Pharos', type: 'erc20', decimals: 18, logo: '/tokens/pros.png' },
};

export function batchEntriesToPortfolio(
  entries: BatchBalanceEntry[],
  tbaAddress: string,
): PortfolioApiData {
  const erc20s: PortfolioApiData['erc20s'] = [];
  const nfts: PortfolioApiData['nfts'] = [];

  for (const entry of entries) {
    const addr = entry.token_address.toLowerCase();
    const known = KNOWN_TOKENS[addr];
    const isNftFromBackend = entry.token_type === 'ERC721' || entry.token_type === 'ERC1155';

    const isNft = known
      ? known.type === 'nft'
      : entry.token_type
      ? isNftFromBackend
      : entry.token_id > 0;

    if (isNft) {
      nfts.push({
        token_address: entry.token_address,
        token_type: known?.nftType || entry.token_type || 'ERC721',
        name: known?.name || entry.name || 'Unknown',
        symbol: known?.symbol || entry.symbol || '???',
        token_id: entry.token_id,
        amount: entry.balance,
      });
    } else {
      const decimals = known?.decimals ?? entry.decimals ?? 18;
      const formatted = (Number(entry.balance) / Math.pow(10, decimals)).toString();
      erc20s.push({
        token_address: entry.token_address,
        name: known?.name || entry.name || 'Unknown Token',
        symbol: known?.symbol || entry.symbol || addr.slice(0, 6),
        balance: formatted,
        balance_raw: entry.balance,
        decimals,
        usd: 0,
        logo: known?.logo,
      });
    }
  }

  return {
    tba_address: tbaAddress || entries[0]?.address || '',
    token_contract: '',
    token_id: 0,
    total_usd: 0,
    native: { symbol: 'PHRS', balance: '0', balance_raw: '0', decimals: 18, usd: 0 },
    erc20s,
    nfts,
  };
}
