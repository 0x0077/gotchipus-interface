import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address } = body;
    const backendUrl = getBackendUrl();

    if (!wallet_address) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'wallet_address is required' },
        { status: 400 }
      );
    }

    const payload = {
      wallet_address,
    };

    const response = await fetch(`${backendUrl}/user/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          code: 1,
          status: 'error',
          message: errorData.message || 'Failed to get user'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 1,
        status: 'error',
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
