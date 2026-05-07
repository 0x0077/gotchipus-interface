'use client';

import { http, createConfig } from 'wagmi'
import { Chain } from '@rainbow-me/rainbowkit'
import { connectors } from './walletConfig'


const baseMainnetCustomChain = {
  id: 8453,
  name: 'Base Mainnet',
  iconUrl: '',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: typeof window !== 'undefined' && window.location?.origin
        ? [`${window.location.origin}/api/rpc`]
        : ['https://mainnet.base.org']
    },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
  testnet: true,
} as const satisfies Chain;


export const config = createConfig({
  chains: [baseMainnetCustomChain],
  multiInjectedProviderDiscovery: true,
  connectors,
  transports: {
    [baseMainnetCustomChain.id]: http(),
  },
  ssr: true
})
