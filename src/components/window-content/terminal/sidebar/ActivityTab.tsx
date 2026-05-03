"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";

const EXPLORER_URL = "https://pharosscan.xyz";

const KNOWN_CONTRACTS: Record<string, string> = {
  // Diamond (Gotchipus)
  "0x5a3afa97584fa8cdec4be2a6ab86ceed05600c5e": "Gotchipus",
  // DEX - DODO
  "0x6f1142f4bf632e4877497c05818492824f540ad5": "DODO Swap",
  "0xbf105f4ffbd3825f5433d074008b9a76237d849c": "DODO Approve",
  "0xc3a335d1c83f9b92e36c0323c58809d19c9db63c": "DODO DSP",
  // DEX - UniswapV2
  "0xd285e37678f07631f33eb99927eb3ff0591a12d7": "UniV2 Router",
  "0x18fab7d7027e9fb33fa90ca607439449209f7b09": "UniV2 Factory",
  // DEX - UniswapV3
  "0xf38d34c8382b9079b0f85309578b43b8479cd875": "UniV3 Router",
  // Tokens (mainnet only — see comment above)
  "0xc879c018db60520f4355c26ed1a6d572cdac1815": "USDC",
  "0x52c48d4213107b20bc583832b0d951fb9ca8f0b0": "WPHRS",
};

interface Transaction {
  tx_hash: string;
  block_number: number;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  value: string;
  gas_used: number;
  status: number;
}

type TxCategory = "send" | "receive" | "swap" | "contract" | "all";

interface ClassifiedTx extends Transaction {
  category: TxCategory;
  label: string;
  contractName?: string;
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatValue(weiStr: string): string {
  if (!weiStr || weiStr === "0") return "";
  const eth = Number(weiStr) / 1e18;
  if (eth < 0.0001) return "<0.0001 PHRS";
  return `${eth.toFixed(4)} PHRS`;
}

function classifyTx(tx: Transaction, tba: string): ClassifiedTx {
  const from = tx.from_address.toLowerCase();
  const to = tx.to_address.toLowerCase();
  const account = tba.toLowerCase();
  const toName = KNOWN_CONTRACTS[to];

  // DEX swap
  if (toName?.includes("Swap") || toName?.includes("Router") || toName?.includes("DODO")) {
    return { ...tx, category: "swap", label: `Swap via ${toName}`, contractName: toName };
  }

  // Gotchipus contract interaction
  if (toName === "Gotchipus") {
    return { ...tx, category: "contract", label: "Gotchipus interaction", contractName: toName };
  }

  // Token contract (approve/transfer)
  if (toName && ["USDC", "WPHRS"].includes(toName)) {
    return { ...tx, category: "contract", label: `${toName} token`, contractName: toName };
  }

  // Known contract
  if (toName) {
    return { ...tx, category: "contract", label: toName, contractName: toName };
  }

  // Receive (from someone else to TBA)
  if (to === account && from !== account) {
    return { ...tx, category: "receive", label: `From ${truncAddr(tx.from_address)}` };
  }

  // Send (from TBA to someone)
  if (from === account) {
    return { ...tx, category: "send", label: `To ${truncAddr(tx.to_address)}` };
  }

  return { ...tx, category: "contract", label: `Contract ${truncAddr(tx.to_address)}` };
}

const CATEGORY_CONFIG: Record<TxCategory, { icon: typeof ArrowUpRight; color: string; label: string }> = {
  send:     { icon: ArrowUpRight, color: "#cc0000", label: "Send" },
  receive:  { icon: ArrowDownLeft, color: "#008000", label: "Receive" },
  swap:     { icon: RefreshCw,    color: "#000080", label: "Swap" },
  contract: { icon: FileText,     color: "#666",    label: "Contract" },
  all:      { icon: FileText,     color: "#000",    label: "All" },
};

const FILTERS: TxCategory[] = ["all", "send", "receive", "swap", "contract"];

interface ActivityTabProps {
  tbaAddress: string | null;
}

export function ActivityTab({ tbaAddress }: ActivityTabProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TxCategory>("all");
  const [transactions, setTransactions] = useState<ClassifiedTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!tbaAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: tbaAddress, page: 0, limit: 50 }),
      });
      const json = await res.json();
      if (json.code === 0 && json.data?.transactions) {
        const classified = json.data.transactions.map((tx: Transaction) =>
          classifyTx(tx, tbaAddress)
        );
        setTransactions(classified);
      } else {
        setError("Failed to load transactions");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [tbaAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = filter === "all"
    ? transactions
    : transactions.filter(tx => tx.category === filter);

  // Count per category
  const counts: Record<TxCategory, number> = { all: transactions.length, send: 0, receive: 0, swap: 0, contract: 0 };
  for (const tx of transactions) counts[tx.category]++;

  if (!tbaAddress) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-[11px] text-[#808080]">Select a Gotchi to view activity</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-7 px-2 border-b-2 border-[#808080] flex items-center justify-between bg-gradient-to-r from-[#000080] to-[#1084d0]">
        <span className="text-[11px] font-bold text-white">{t('terminal.activityTab.title', 'Activity')}</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/80">{transactions.length} tx</span>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="text-white hover:text-white/80 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-[10px] h-[10px] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-1.5 py-1 flex gap-0.5 flex-wrap border-b border-[#808080] bg-win98-face">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-1.5 py-[1px] text-[9px] uppercase font-bold border ${
              filter === f
                ? "border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white text-[#000080]"
                : "border-[#808080] bg-win98-face text-[#333] hover:bg-[#b0b0b0]"
            }`}
          >
            {f}{counts[f] > 0 ? ` (${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-auto bg-[#fffff0]">
        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 text-[#000080] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-[10px] text-[#cc0000]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-4 text-[10px] text-[#808080]">No transactions</div>
        ) : (
          filtered.map((tx) => {
            const config = CATEGORY_CONFIG[tx.category];
            const Icon = config.icon;
            const value = formatValue(tx.value);
            const failed = tx.status !== 1;
            return (
              <a
                key={tx.tx_hash}
                href={`${EXPLORER_URL}/tx/${tx.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-2 py-1.5 border-b border-[#e0e0d0] flex gap-1.5 items-center hover:bg-[#e6e2da] cursor-pointer ${failed ? "opacity-60" : ""}`}
              >
                <div
                  className="w-5 h-5 flex-shrink-0 border border-[#808080] bg-[#d4d0c8] flex items-center justify-center"
                  style={{ color: config.color }}
                >
                  <Icon className="w-[10px] h-[10px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-[#333] truncate">{tx.label}</span>
                    {failed && <span className="text-[8px] text-[#cc0000] font-bold">FAILED</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-[#808080]">{timeAgo(tx.block_timestamp)}</span>
                    {value && (
                      <span className="text-[9px] font-mono text-[#333]">{value}</span>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-[8px] h-[8px] text-[#808080] flex-shrink-0" />
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
