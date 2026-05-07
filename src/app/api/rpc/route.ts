import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const MAINNET_BASE_URL = process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://mainnet.base.org';
const REQUEST_TIMEOUT = 30000;

function buildTargetUrl(request: NextRequest): { targetUrl: string; path: string } {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/rpc', '');
  const search = url.searchParams.toString();
  const targetUrl = `${MAINNET_BASE_URL}${path}${search ? `?${search}` : ''}`;
  return { targetUrl, path };
}

function errorResponse(err: unknown, path: string, method: string) {
  const message =
    err instanceof Error ? err.message :
    typeof err === 'string' ? err :
    'Unknown error';
  const name = err instanceof Error ? err.name : 'Error';

  const isAbort = name === 'AbortError' || message.includes('aborted');
  const status = isAbort ? 504 : 502;
  const label = isAbort ? 'Request timeout' : 'Proxy request failed';

  return NextResponse.json(
    {
      error: label,
      details: { message, name, path, method, timestamp: new Date().toISOString() },
    },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const { targetUrl, path } = buildTargetUrl(request);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return errorResponse(err, path, 'GET');
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const { targetUrl, path } = buildTargetUrl(request);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const body = await request.text();
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return errorResponse(err, path, 'POST');
  } finally {
    clearTimeout(timeout);
  }
}
