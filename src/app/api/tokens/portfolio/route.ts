import { type NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getBackendUrl } from '@/lib/api-config';
import {
  batchEntriesToPortfolio,
  type BatchBalanceResponse,
} from '@/lib/portfolio-shape';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const tba = req.nextUrl.searchParams.get('tba')?.trim();
  if (!tba || !isAddress(tba)) {
    return NextResponse.json(
      { code: 1, status: 'error', data: 'invalid tba address' },
      { status: 400 },
    );
  }

  const upstream = `${getBackendUrl().replace(/\/+$/, '')}/balances/batch`;
  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json',
    };
    const auth = req.headers.get('authorization');
    if (auth) headers.authorization = auth;

    const res = await fetch(upstream, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accounts: [tba] }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { code: 1, status: 'error', data: 'upstream error' },
        { status: res.status === 404 ? 502 : res.status },
      );
    }

    const json = (await res.json()) as BatchBalanceResponse;
    if (json.code !== 0 || !json.data?.balances) {
      return NextResponse.json(
        { code: 1, status: 'error', data: 'upstream returned no balances' },
        { status: 502 },
      );
    }

    const entries =
      json.data.balances[tba] ??
      json.data.balances[tba.toLowerCase()] ??
      [];
    const portfolio = batchEntriesToPortfolio(entries, tba);

    return NextResponse.json(
      { code: 0, status: 'success', data: portfolio },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (err) {
    return NextResponse.json(
      { code: 1, status: 'error', data: 'upstream unreachable' },
      { status: 502 },
    );
  }
}
