import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender, signature, timestamp } = body;

    if (!sender || !signature || !timestamp) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'sender, signature and timestamp are required' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/chi/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, signature, timestamp }),
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
