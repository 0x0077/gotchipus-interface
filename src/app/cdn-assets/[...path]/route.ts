import { NextRequest } from 'next/server';

export const runtime = 'edge';

const UPSTREAM = 'https://assets.gotchi.ai';

async function proxy(request: NextRequest, path: string[]) {
  const target = `${UPSTREAM}/${path.join('/')}`;

  const forwardHeaders = new Headers();
  const range = request.headers.get('range');
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');
  if (range) forwardHeaders.set('range', range);
  if (ifNoneMatch) forwardHeaders.set('if-none-match', ifNoneMatch);
  if (ifModifiedSince) forwardHeaders.set('if-modified-since', ifModifiedSince);

  const upstreamRes = await fetch(target, {
    method: request.method,
    headers: forwardHeaders,
  });

  const headers = new Headers();
  const passthrough = ['content-type', 'content-length', 'etag', 'last-modified', 'accept-ranges', 'content-range'];
  for (const name of passthrough) {
    const v = upstreamRes.headers.get(name);
    if (v) headers.set(name, v);
  }

  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD');

  if (upstreamRes.ok || upstreamRes.status === 304) {
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
  } else {
    headers.set('Cache-Control', 'no-store');
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers,
  });
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}

export async function HEAD(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path);
}
