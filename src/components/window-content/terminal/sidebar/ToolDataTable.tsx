"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface ToolDataTableProps {
  title: string;
  columns: string[];
  rows: Record<string, any>[];
}

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 inline-flex items-center text-[#808080] hover:text-[#000080]"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-[9px] h-[9px] text-[#008000]" />
      ) : (
        <Copy className="w-[9px] h-[9px]" />
      )}
    </button>
  );
}

/** Column key aliases for mapping display column names to row data keys */
const COL_KEY_MAP: Record<string, string[]> = {
  dex: ["dex"],
  address: ["address", "token_address"],
  fee: ["fee_bps"],
  token: ["token", "symbol"],
  balance: ["balance"],
  name: ["name"],
  type: ["type", "token_type"],
  amount: ["amount"],
};

/** Map a row object to cell values matching column order */
function rowCells(row: Record<string, any>, columns: string[]): string[] {
  return columns.map((col, idx) => {
    const key = col.toLowerCase();
    // Try alias map first
    const aliases = COL_KEY_MAP[key];
    if (aliases) {
      for (const alias of aliases) {
        if (row[alias] !== undefined) {
          // Format fee specially
          if (alias === "fee_bps") return `${row[alias]} bps`;
          return String(row[alias]);
        }
      }
    }
    // Try direct key match (case-insensitive)
    if (row[key] !== undefined) return String(row[key]);
    if (row[col] !== undefined) return String(row[col]);
    // Positional fallback for dynamic columns (e.g. token reserves)
    const positionalKeys = ["reserve_a", "reserve_b"];
    const dynamicIdx = idx - (columns.length - positionalKeys.length);
    if (dynamicIdx >= 0 && dynamicIdx < positionalKeys.length && row[positionalKeys[dynamicIdx]] !== undefined) {
      return String(row[positionalKeys[dynamicIdx]]);
    }
    return "";
  });
}

export default function ToolDataTable({ title, columns, rows }: ToolDataTableProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-[3px] border border-[#a0a0a0] bg-[#fffff0] overflow-hidden w-full">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-1.5 py-[2px] bg-[#d4d0c8] border-b border-[#b0b0b0] hover:bg-[#ccc8c0] text-left"
      >
        {open ? (
          <ChevronDown className="w-[10px] h-[10px] text-[#555]" />
        ) : (
          <ChevronRight className="w-[10px] h-[10px] text-[#555]" />
        )}
        <span className="text-[10px] font-bold text-[#333] flex-1">{title}</span>
        <span className="text-[9px] text-[#808080]">{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
      </button>

      {/* Table */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-[#000080]">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border border-[#000060] px-1.5 py-[2px] text-left font-bold text-white whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const cells = rowCells(row, columns);
                return (
                  <tr key={i} className={i % 2 === 0 ? "bg-[#fffff0]" : "bg-[#f5f5e0]"}>
                    {cells.map((cell, j) => {
                      const isAddr = columns[j]?.toLowerCase() === "address" && cell.startsWith("0x");
                      return (
                        <td
                          key={j}
                          className="border border-win98-face px-1.5 py-[2px] whitespace-nowrap"
                        >
                          {isAddr ? (
                            <span className="font-mono flex items-center">
                              {truncateAddr(cell)}
                              <CopyButton text={cell} />
                            </span>
                          ) : (
                            cell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
