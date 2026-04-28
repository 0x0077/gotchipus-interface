import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gotchi_ids } = body;

    if (!gotchi_ids || !Array.isArray(gotchi_ids) || gotchi_ids.length === 0) {
      return NextResponse.json(
        { code: 1, status: 'error', message: 'Missing or invalid gotchi_ids' },
        { status: 400 }
      );
    }

    const backendUrl = getBackendUrl();

    // Query session status for all specified gotchi IDs
    const response = await fetch(`${backendUrl}/chain/session_get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gotchi_ids }),
    });

    if (!response.ok) {
      // If 404, it means no session exists - that's okay
      if (response.status === 404) {
        return NextResponse.json({
          code: 0,
          status: 'success',
          data: null,
          message: 'No session found'
        });
      }

      return NextResponse.json(
        { code: 1, status: 'error', message: 'Failed to query session' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      code: 0,
      status: 'success',
      data: data.data || null,
      message: 'Session retrieved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { code: 1, status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
