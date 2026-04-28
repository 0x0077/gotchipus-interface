import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ code: 1, status: 'error', data: 'name is required' }, { status: 400 });
    }

    const force = searchParams.get('force') === 'true';
    const owner = searchParams.get('owner');
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams();
    if (force) params.set('force', 'true');
    if (owner) params.set('owner', owner);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${backendUrl}/chi/resolve/${encodeURIComponent(name)}${queryStr}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ code: 1, status: 'error', data: error.message }, { status: 500 });
  }
}
