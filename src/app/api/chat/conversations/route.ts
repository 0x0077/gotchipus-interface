import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page = 0 } = body;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/chat/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'Failed to fetch conversations' },
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
