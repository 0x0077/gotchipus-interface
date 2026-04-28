import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function POST() {
  try {
    const backendUrl = getBackendUrl();

    const response = await fetch(`${backendUrl}/chain/session_keygen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    if (!response.ok) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'Failed to generate session key' },
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
