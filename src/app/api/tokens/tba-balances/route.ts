import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatEther, isAddress } from 'viem';
import { chain } from '@/src/app/blockchain/config';

export const runtime = 'edge';
// Balance values must NEVER be cached — every request reads fresh state from RPC.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://mainnet.base.org';
const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tbaAddressesParam = searchParams.get('tbaAddresses');

    if (!tbaAddressesParam) {
      return NextResponse.json({ error: 'tbaAddresses is required' }, { status: 400 });
    }

    const addresses = tbaAddressesParam
      .split(',')
      .map(a => a.trim())
      .filter(a => isAddress(a));

    if (addresses.length === 0) {
      return NextResponse.json({ balances: {} });
    }

    const balanceResults = await Promise.all(
      addresses.map(address =>
        publicClient.getBalance({ address: address as `0x${string}` }).catch(() => BigInt(0))
      )
    );

    const balances: Record<string, string> = {};
    addresses.forEach((address, i) => {
      balances[address] = formatEther(balanceResults[i]);
    });

    // Defense vs. Cloudflare Pages edge cache — `dynamic = 'force-dynamic'` alone
    // does not always prevent CF from holding the response.
    return NextResponse.json({ balances }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
