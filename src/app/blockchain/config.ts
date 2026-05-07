import { defineChain } from "viem";

export const chain = defineChain({
  id: 8453,
  name: 'Base Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC!],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC!],
    },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://mainnet.basescan.org' },
  },
  testnet: true,
});
