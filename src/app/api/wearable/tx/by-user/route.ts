import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, page = 0 } = body;

    if (!address) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'address is required' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/wearable/tx/by_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, page }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'Failed to fetch transactions' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { code: 1, status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
