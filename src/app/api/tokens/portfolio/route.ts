import { type NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const tba = req.nextUrl.searchParams.get('tba')?.trim();
  if (!tba || !isAddress(tba)) {
    return NextResponse.json(
      { code: 1, status: 'error', data: 'invalid tba address' },
      { status: 400 },
    );
  }

  const upstream = `${getBackendUrl().replace(/\/+$/, '')}/portfolio/${tba}`;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    const auth = req.headers.get('authorization');
    if (auth) headers.authorization = auth;
    const res = await fetch(upstream, { headers, cache: 'no-store' });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { code: 1, status: 'error', data: 'upstream unreachable' },
      { status: 502 },
    );
  }
}
