"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/* ─────────────── Helpers ─────────────── */

function truncAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="ml-1 inline-flex items-center text-[#606060] hover:text-[#000080]"
      title="Copy"
    >
      {copied ? (
        <Check className="w-[9px] h-[9px] text-[#008000]" />
      ) : (
        <Copy className="w-[9px] h-[9px]" />
      )}
    </button>
  );
}

function TxLink({ hash, url }: { hash: string; url?: string }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#000080] underline hover:text-[#0000cc] inline-flex items-center gap-0.5"
      >
        {truncAddr(hash)}
        <ExternalLink className="w-[8px] h-[8px]" />
      </a>
    );
  }
  return (
    <span>
      {truncAddr(hash)}
      <CopyBtn text={hash} />
    </span>
  );
}

/** Shared rx-data shell: light amber background, dotted header separator. */
function DataCard({
  title,
  children,
  warning,
}: {
  title: string;
  children: React.ReactNode;
  warning?: string;
}) {
  return (
    <div className="w-full mt-1.5 mb-0.5" style={{ background: "#f0edd8" }}>
      <div
        className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold tracking-wide text-[#000080]"
        style={{ borderBottom: "1px dotted #c0b890" }}
      >
        {title}
      </div>
      {warning && (
        <div
          className="px-2.5 py-1 text-[10px] font-bold"
          style={{ background: "#3a2a0a", color: "#ffd98a" }}
        >
          ⚠ {warning}
        </div>
      )}
      <div className="px-2.5 py-1.5">{children}</div>
    </div>
  );
}

/** k/v row — key left (muted), value right (mono, right-aligned). `big` for headline numbers. */
function DataRow({
  k,
  v,
  big,
}: {
  k: string;
  v: React.ReactNode;
  big?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 py-[2px]">
      <span className="text-[11px] text-[#606060]">{k}</span>
      <span
        className={`font-mono text-right ${big ? "text-[12px] font-bold text-[#000080]" : "text-[11px] text-[#000]"}`}
      >
        {v}
      </span>
    </div>
  );
}

/* ─────────────── Swap Quote ─────────────── */

interface SwapQuoteData {
  _type: "swap_quote";
  quote_id: string;
  from: { symbol: string; amount: string };
  to: { symbol: string; estimated: string };
  route: string;
  hops?: { from: string; to: string; dex: string; amount_out: string; fee_bps: number }[];
  total_fee_bps: number;
  slippage_pct: number;
  min_amount_out: string;
  alternatives?: { route: string; estimated_out: string; fee_bps: number }[];
}

export function SwapQuoteCard({ data }: { data: SwapQuoteData }) {
  return (
    <DataCard
      title="SWAP QUOTE"
      warning="Next tool executes immediately — review before agent continues"
    >
      <DataRow k="Route" v={data.route} />
      <DataRow k="Input" v={`${data.from.amount} ${data.from.symbol}`} big />
      <DataRow k="Est. out" v={`${data.to.estimated} ${data.to.symbol}`} big />
      <DataRow k="Min. out" v={`${data.min_amount_out} ${data.to.symbol}`} />
      <DataRow k="Slippage" v={`${data.slippage_pct}%`} />
      <DataRow k="Fee" v={`${data.total_fee_bps} bps`} />

      {data.hops && data.hops.length > 1 && (
        <div className="mt-1.5 pt-1" style={{ borderTop: "1px dotted #c0b890" }}>
          <div className="text-[9px] text-[#606060] tracking-wide mb-0.5">HOPS</div>
          {data.hops.map((h, i) => (
            <div key={i} className="text-[10px] font-mono text-[#303030] ml-2">
              {i + 1}. {h.from} → {h.to} via {h.dex} ({h.fee_bps} bps)
            </div>
          ))}
        </div>
      )}

      {data.alternatives && data.alternatives.length > 0 && (
        <div className="mt-1.5 pt-1" style={{ borderTop: "1px dotted #c0b890" }}>
          <div className="text-[9px] text-[#606060] tracking-wide mb-0.5">ALTERNATIVES</div>
          {data.alternatives.map((alt, i) => (
            <div key={i} className="text-[10px] font-mono text-[#606060] ml-2">
              {alt.route} → {alt.estimated_out} ({alt.fee_bps} bps)
            </div>
          ))}
        </div>
      )}
    </DataCard>
  );
}

/* ─────────────── Swap Result ─────────────── */

interface SwapResultData {
  _type: "swap_result";
  status: string;
  route: string;
  from: string;
  to: string;
  fee_bps: number;
  slippage_pct: number;
  transactions: { hop: number; from: string; to: string; tx_hash: string; explorer_url?: string }[];
}

export function SwapResultCard({ data }: { data: SwapResultData }) {
  const isSuccess = data.status === "SUCCESS";
  return (
    <DataCard title={isSuccess ? "SWAP EXECUTED" : "SWAP FAILED"}>
      <DataRow k="Route" v={data.route} />
      <DataRow k="From" v={data.from} big />
      <DataRow k="To" v={data.to} big />
      <DataRow k="Fee" v={`${data.fee_bps} bps`} />
      {data.transactions.map((tx, i) => (
        <DataRow
          key={i}
          k={data.transactions.length === 1 ? "Tx" : `Hop ${tx.hop}`}
          v={<TxLink hash={tx.tx_hash} url={tx.explorer_url} />}
        />
      ))}
    </DataCard>
  );
}

/* ─────────────── TBA Balances ─────────────── */

interface TbaBalancesData {
  _type: "tba_balances";
  tba_address: string;
  native_balance: string;
  tokens: { symbol: string; address: string; decimals: number; balance: string }[];
  nfts?: { name: string; type: string; amount: number }[];
  lp_positions: { dex: string; pair: string; pool: string; lp_balance: string; value_a: string; value_b: string; position_id?: number }[];
  summary: string;
}

export function TbaBalancesCard({ data }: { data: TbaBalancesData }) {
  return (
    <DataCard title={`TBA BALANCES · ${data.summary}`}>
      {/* Native */}
      <DataRow k="Native" v={data.native_balance} big />

      {data.tokens.length > 0 && (
        <div className="mt-1.5 pt-1" style={{ borderTop: "1px dotted #c0b890" }}>
          <div className="text-[9px] text-[#606060] tracking-wide mb-0.5">TOKENS</div>
          {data.tokens.map((t, i) => (
            <DataRow key={i} k={t.symbol} v={t.balance} />
          ))}
        </div>
      )}

      {data.nfts && data.nfts.length > 0 && (
        <div className="mt-1.5 pt-1" style={{ borderTop: "1px dotted #c0b890" }}>
          <div className="text-[9px] text-[#606060] tracking-wide mb-0.5">NFTS</div>
          {data.nfts.map((nft, i) => (
            <DataRow
              key={i}
              k={`${nft.name} · ${nft.type}`}
              v={`×${nft.amount}`}
            />
          ))}
        </div>
      )}

      {data.lp_positions.length > 0 && (
        <div className="mt-1.5 pt-1" style={{ borderTop: "1px dotted #c0b890" }}>
          <div className="text-[9px] text-[#606060] tracking-wide mb-0.5">LP POSITIONS</div>
          {data.lp_positions.map((lp, i) => (
            <DataRow
              key={i}
              k={`${lp.dex} · ${lp.pair}`}
              v={lp.position_id != null ? `#${lp.position_id}` : `${lp.value_a} + ${lp.value_b}`}
            />
          ))}
        </div>
      )}
    </DataCard>
  );
}

/* ─────────────── Liquidity Result ─────────────── */

interface LiquidityResultData {
  _type: "liquidity_result";
  operation: string;
  status: string;
  dex: string;
  pool_type: string;
  token_a?: string;
  token_b?: string;
  detail?: string;
  tx_hash: string;
  explorer_url?: string;
}

export function LiquidityResultCard({ data }: { data: LiquidityResultData }) {
  const isSuccess = data.status === "SUCCESS";
  const isAdd = data.operation === "add";
  const title = `${isAdd ? "LIQUIDITY ADDED" : "LIQUIDITY REMOVED"}${isSuccess ? "" : " — FAILED"}`;
  return (
    <DataCard title={title}>
      <DataRow k="DEX" v={data.dex} />
      <DataRow k="Pool" v={data.pool_type.toUpperCase()} />
      {data.token_a && <DataRow k="Token A" v={data.token_a} />}
      {data.token_b && <DataRow k="Token B" v={data.token_b} />}
      {data.detail && <DataRow k="Detail" v={data.detail} />}
      {data.tx_hash && <DataRow k="Tx" v={<TxLink hash={data.tx_hash} url={data.explorer_url} />} />}
    </DataCard>
  );
}
