import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/testnet', '');
  const searchParams = url.searchParams.toString();
  
  try {
    const response = await fetch(`https://testnet.dplabs-internal.com${path}${searchParams ? `?${searchParams}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to testnet:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/testnet', '');
  const searchParams = url.searchParams.toString();
  
  try {
    const body = await request.json();
    
    const response = await fetch(`https://testnet.dplabs-internal.com${path}${searchParams ? `?${searchParams}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to testnet:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
} 