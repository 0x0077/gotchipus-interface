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
  '0x000000007B5758541e9d94a487B83e11Cd052437': { symbol: 'GOTCHI', name: 'Gotchipus', type: 'nft', decimals: 0, nftType: 'ERC1155' },
  '0x0F5e523eBB5861F7d2Acf4e4744B08358022720B': { symbol: 'CHI', name: '.chi Names', type: 'nft', decimals: 0, nftType: 'ERC721' },
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', name: 'USD Coin', type: 'erc20', decimals: 6, logo: '/tokens/usdc.png' },
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', name: 'Wrapped Ether', type: 'erc20', decimals: 18, logo: '/tokens/eth.png' },
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
    native: { symbol: 'ETH', balance: '0', balance_raw: '0', decimals: 18, usd: 0 },
    erc20s,
    nfts,
  };
}
