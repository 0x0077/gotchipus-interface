import { NextRequest } from 'next/server';
import { getBackendUrl } from '@/lib/api-config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const upstream = `${getBackendUrl()}/lighthaven/move`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const originResp = await fetch(upstream, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await originResp.text();
  return new Response(text, {
    status: originResp.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
