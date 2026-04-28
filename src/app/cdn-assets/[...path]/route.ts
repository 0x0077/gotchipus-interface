export const runtime = 'edge';

const UPSTREAM = 'https://assets.gotchi.ai';

async function proxy(request: Request, path: string[] | undefined): Promise<Response> {
  try {
    const safePath = (path ?? []).map(encodeURIComponent).join('/');
    const target = `${UPSTREAM}/${safePath}`;

    const forwardHeaders = new Headers();
    for (const name of ['range', 'if-none-match', 'if-modified-since']) {
      const v = request.headers.get(name);
      if (v) forwardHeaders.set(name, v);
    }

    const upstreamRes = await fetch(target, {
      method: request.method,
      headers: forwardHeaders,
      redirect: 'follow',
    });

    const headers = new Headers();
    for (const name of ['content-type', 'content-length', 'etag', 'last-modified', 'accept-ranges', 'content-range']) {
      const v = upstreamRes.headers.get(name);
      if (v) headers.set(name, v);
    }
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD');
    headers.set(
      'Cache-Control',
      upstreamRes.ok || upstreamRes.status === 304
        ? 'public, max-age=86400, s-maxage=86400, immutable'
        : 'no-store'
    );

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers,
    });
  } catch (e: any) {
    const detail = `${e?.name ?? 'Error'}: ${e?.message ?? String(e)}`.slice(0, 200);
    return new Response('Bad Gateway', {
      status: 502,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
        'x-proxy-error': detail,
      },
    });
  }
}

export async function GET(request: Request, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx.params?.path);
}

export async function HEAD(request: Request, ctx: { params: { path?: string[] } }) {
  return proxy(request, ctx.params?.path);
}
