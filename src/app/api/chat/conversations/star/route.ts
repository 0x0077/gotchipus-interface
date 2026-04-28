import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversation_id, starred } = body;

    if (!conversation_id || starred === undefined) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'conversation_id and starred are required' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/chat/conversations/star`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversation_id, starred }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { code: 1, status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
