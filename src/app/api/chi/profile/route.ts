import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'name query parameter is required' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/chi/profile/${encodeURIComponent(name)}`, {
      signal: AbortSignal.timeout(8000),
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

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'name query parameter is required' },
        { status: 400 }
      );
    }

    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/chi/profile/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
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
