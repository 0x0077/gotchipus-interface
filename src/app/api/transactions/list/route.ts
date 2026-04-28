import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api-config";

export const runtime = 'edge';

/** Transaction history — forwards to gotchi-rs `/transactions/list`, which
 *  reads the chain-indexer Supabase `tba_transactions` table directly. */
const TIMEOUT_MS = 30000;

export async function POST(req: NextRequest) {
  const target = `${getBackendUrl()}/transactions/list`;

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { code: 1, status: "error", data: { error: "invalid request body", reason: String(err).slice(0, 200) } },
      { status: 400 },
    );
  }

  try {
    const resp = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const isTimeout = name === "TimeoutError" || name === "AbortError";
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        code: 1,
        status: "error",
        data: {
          error: isTimeout ? "transactions proxy timeout" : "transactions proxy error",
          reason: reason.slice(0, 200),
        },
      },
      { status: isTimeout ? 504 : 502 },
    );
  }
}
