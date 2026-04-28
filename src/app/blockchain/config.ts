import { defineChain } from "viem";

export const pharos = defineChain({
  id: 1672,
  name: 'Pharos Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Pharos',
    symbol: 'PROS',
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
    default: { name: 'PharosScan', url: 'https://pharosscan.xyz' },
  },
  contracts: {
    multicall3: undefined,
  },
});
