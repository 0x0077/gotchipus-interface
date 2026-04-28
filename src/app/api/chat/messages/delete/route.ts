import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message_id } = body;

    if (!message_id) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'message_id is required' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = req.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/chat/messages/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message_id }),
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
