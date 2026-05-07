import { NextResponse } from 'next/server';
import { createPublicClient, http, formatGwei } from 'viem';
import { chain } from '@/src/app/blockchain/config';

export const runtime = 'edge';

const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

interface NetworkStats {
  price: number;
  gasFee: string | null;
  medianGasPrice: string | null;
}

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC!),
});

async function fetchPrice(): Promise<number> {
  try {
    const res = await fetch(PRICE_URL, { next: { revalidate: 30 } });
    if (!res.ok) return 0;
    const data = await res.json();
    const price = Number(data?.ethereum?.usd);
    return Number.isFinite(price) ? price : 0;
  } catch {
    return 0;
  }
}

async function fetchGasPrice(): Promise<string | null> {
  try {
    const wei = await publicClient.getGasPrice();
    return `${formatGwei(wei)} Gwei`;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [price, gasFee] = await Promise.all([fetchPrice(), fetchGasPrice()]);
    const stats: NetworkStats = { price, gasFee, medianGasPrice: gasFee };
    return NextResponse.json({ code: 0, status: 'ok', data: stats }, { status: 200 });
  } catch {
    return NextResponse.json({ code: 1, status: 'error' }, { status: 500 });
  }
}
