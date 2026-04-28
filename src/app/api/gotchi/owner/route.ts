import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner } = body;

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();

    const response = await fetch(`${backendUrl}/gotchi/owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ owner }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.code === 0 && result.data) {
      return NextResponse.json(
        { data: result.data },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      );
    } else {
      throw new Error('Invalid response from backend API');
    }

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Backend API is not available',
        message: 'Please ensure the backend service is running',
        details: error.message
      },
      { status: 503 }
    );
  }
}
