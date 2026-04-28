'use client';

import { http, createConfig } from 'wagmi'
import { Chain } from '@rainbow-me/rainbowkit'
import { connectors } from './walletConfig'


const pharosMainnetCustomChain = {
  id: 1672,
  name: 'Pharos Mainnet',
  iconUrl: '',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Pharos', symbol: 'PROS', decimals: 18 },
  rpcUrls: {
    default: {
      http: typeof window !== 'undefined' && window.location?.origin
        ? [`${window.location.origin}/api/rpc`]
        : ['https://rpc.pharos.xyz']
    },
  },
  blockExplorers: {
    default: { name: 'Pharosscan', url: 'https://pharosscan.xyz' },
  },
} as const satisfies Chain;


export const config = createConfig({
  chains: [pharosMainnetCustomChain],
  multiInjectedProviderDiscovery: true,
  connectors,
  transports: {
    [pharosMainnetCustomChain.id]: http(),
  },
  ssr: true
})
