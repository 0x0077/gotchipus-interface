import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '30');
    const tokenId = searchParams.get('token_id');

    const sortBy = searchParams.get('sort_by');
    const rarity = searchParams.get('rarity');
    const minLevel = searchParams.get('min_level');
    const maxLevel = searchParams.get('max_level');
    const traits = searchParams.get('traits');

    const backendUrl = getBackendUrl();

    const page = Math.floor(offset / 30);

    let endpoint = '/gotchi/list';
    let requestBody: any = { page };

    if (rarity) {
      endpoint = '/gotchi/rarity_list';
      requestBody = {
        page,
        rarity: rarity
      };
    }
    else if (minLevel || maxLevel) {
      endpoint = '/gotchi/level_list';
      const minExpValue = minLevel ? (parseInt(minLevel) * 100).toString() : "0";
      const maxExpValue = maxLevel ? (parseInt(maxLevel) * 100).toString() : "999999";
      requestBody = {
        page,
        min_value: minExpValue,
        max_value: maxExpValue
      };
    }
    else {
      if (sortBy) requestBody.sort_by = sortBy;
      if (traits) requestBody.traits = traits.split(',');
    }

    if (tokenId) {
      const response = await fetch(`${backendUrl}/gotchi/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token_id: tokenId }),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.code === 0 && result.data) {
        return NextResponse.json(
          { data: [result.data] },
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        );
      }
    }

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
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
            'Cache-Control': 'no-store',
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
