import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SOCIALSCAN_STATS_URL = 'https://api.socialscan.io/pharos-mainnet/v1/explorer/stats';

interface NetworkStats {
  price: number;
  gasFee: string | null;
  medianGasPrice: string | null;
}

export async function GET() {
  try {
    const res = await fetch(SOCIALSCAN_STATS_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 5 },
    });

    if (!res.ok) {
      return NextResponse.json({ code: 1, status: 'error' }, { status: res.status });
    }

    const data = await res.json();
    const rawPrice = data?.native_token_price;
    const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

    if (!Number.isFinite(price)) {
      return NextResponse.json({ code: 1, status: 'error' }, { status: 502 });
    }

    const stats: NetworkStats = {
      price,
      gasFee: typeof data?.gas_fee === 'string' ? data.gas_fee : null,
      medianGasPrice: typeof data?.median_gas_price === 'string' ? data.median_gas_price : null,
    };

    return NextResponse.json({ code: 0, status: 'ok', data: stats }, { status: 200 });
  } catch {
    return NextResponse.json({ code: 1, status: 'error' }, { status: 500 });
  }
}
