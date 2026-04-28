import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wearable_ids, buyer_address } = body;

    if (!wearable_ids?.length || !buyer_address) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'wearable_ids and buyer_address are required' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/wearable/batch_purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wearable_ids, buyer_address }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json(
      { code: 1, status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
