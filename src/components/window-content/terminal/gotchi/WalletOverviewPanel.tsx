"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { Win98GroupBox, TokenItem } from "./GotchiDetailHelpers";
import { SessionWizardData } from "../session/SessionWizard";
import { formatTokenAmount } from "@/src/utils/formatTokenAmount";

type TimeRange = "24H" | "7D" | "30D";

// Flat line data — placeholder until a price history API is available
function generateChartData(range: TimeRange, baseValue: number) {
  const points = { "24H": 48, "7D": 56, "30D": 60 }[range];
  const val = baseValue > 0 ? baseValue : 0;
  const data: { index: number; value: number }[] = [];
  for (let i = 0; i <= points; i++) {
    data.push({ index: i, value: parseFloat(val.toFixed(6)) });
  }
  return data;
}

function MiniChart({ baseValue = 0 }: { baseValue?: number }) {
  const [range, setRange] = useState<TimeRange>("7D");
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const data = useMemo(() => generateChartData(range, baseValue), [range, baseValue]);

  const lastVal = data[data.length - 1]?.value ?? 0;
  const displayVal = hoveredValue ?? lastVal;
  const lineColor = "#808080";
  const gradientId = `chartGrad-${range}`;

  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.[0]) {
      setHoveredValue(state.activePayload[0].value);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredValue(null);
  }, []);

  const ranges: TimeRange[] = ["24H", "7D", "30D"];

  return (
    <div className="bg-black select-none">
      {/* Value + change indicator */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
        {hoveredValue !== null ? (
          <span className="text-[10px] text-[#c0c0c0] font-courier">
            {formatTokenAmount(displayVal)} ETH
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs font-bold font-courier text-[#808080]">
          --%
        </span>
      </div>

      {/* Chart area */}
      <ResponsiveContainer width="100%" height={64}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis domain={[(baseValue * 0.99) || 0, (baseValue * 1.01) || 1]} hide />
          <Tooltip content={() => null} cursor={{ stroke: "#ffffff30", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            fill={`url(#${gradientId})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Time range tabs */}
      <div className="flex items-center justify-center gap-0.5 px-2 pb-1.5 pt-0.5">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2.5 py-0.5 text-[10px] font-bold border transition-colors ${
              range === r
                ? "bg-[#333333] text-white border-[#555555]"
                : "bg-transparent text-[#666666] border-transparent hover:text-[#999999]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

type SessionStatus = "none" | "active" | "expired" | null;

interface WalletOverviewPanelProps {
  totalValue: number;
  totalUsd: number;
  tokens: TokenItem[];
  nftCount: number;
  sessionStatus?: SessionStatus;
  sessionDaysLeft?: number;
  sessionInfo?: SessionWizardData | null;
  onOpenSetup?: () => void;
  onOpenHooks?: () => void;
}

const SUNKEN = "border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080]";
const RAISED = "border border-t-white border-l-white border-r-[#808080] border-b-[#808080]";

// ── Win98 progress bar ──
function UsageBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className={`${SUNKEN} bg-white h-[14px] flex-1`}>
      <div className="h-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Session overlay panel ──
function SessionOverlay({
  sessionInfo,
  sessionDaysLeft,
  onClose,
  onEdit,
}: {
  sessionInfo: SessionWizardData;
  sessionDaysLeft: number;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const expiresDate = sessionInfo.expiresAt
    ? new Date(sessionInfo.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const usedValue = sessionInfo.usedValue ?? 0;
  const usedToday = sessionInfo.usedToday ?? 0;

  const fmtUsage = (n: number) => {
    if (n === 0) return "0";
    if (Number.isInteger(n)) return n.toLocaleString();
    // Show up to 6 decimal places, trim trailing zeros
    return parseFloat(n.toFixed(6)).toString();
  };

  return (
    <div
      ref={overlayRef}
      className={`absolute z-50 top-0 left-0 right-0 bg-win98-face ${RAISED} shadow-[2px_2px_8px_rgba(0,0,0,0.3)]`}
    >
      {/* Title bar */}
      <div
        onClick={onClose}
        className="px-2.5 py-1 flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#000080] to-[#1084d0] text-white select-none"
      >
        <span className="text-xs font-bold text-[#00ff88]">●</span>
        <span className="text-xs font-bold flex-1 font-courier">
          AI Session — Active
        </span>
        <span
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="text-xs underline cursor-pointer"
        >
          {t('terminal.session.edit')}
        </span>
        <span className="text-xs font-courier">▲</span>
      </div>

      <div className="p-2 space-y-1.5">
        {/* Session usage */}
        <fieldset className="border border-[#808080] px-2.5 pb-2 pt-0 relative m-0">
          <legend className="text-xs text-[#000000] px-1">Session usage</legend>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#000000] w-[90px] shrink-0">Session spent</span>
              <UsageBar used={usedValue} total={sessionInfo.maxPerSession} color="#008000" />
              <span className="font-bold text-[#000000] shrink-0 text-right font-courier whitespace-nowrap">
                {fmtUsage(usedValue)} / {fmtUsage(sessionInfo.maxPerSession)}
              </span>
            </div>
            {sessionInfo.enabledOptions?.dailyTransferLimit && sessionInfo.dailyLimit > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#000000] w-[90px] shrink-0">Daily spent</span>
                <UsageBar used={usedToday} total={sessionInfo.dailyLimit} color="#cc8800" />
                <span className="font-bold text-[#000000] shrink-0 text-right font-courier whitespace-nowrap">
                  {fmtUsage(usedToday)} / {fmtUsage(sessionInfo.dailyLimit)}
                </span>
              </div>
            )}
          </div>
        </fieldset>

        {/* Spending limits */}
        <fieldset className="border border-[#808080] px-2.5 pb-2 pt-0 relative m-0">
          <legend className="text-xs text-[#000000] px-1">Spending limits</legend>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs py-px border-b border-dotted border-win98-face">
              <span className="text-[#000000]"><span className="text-[#000080] mr-1">◆</span>Max per transaction</span>
              <span className="font-bold text-[#000080] font-courier">{sessionInfo.maxPerTx.toLocaleString()} ETH</span>
            </div>
            <div className="flex items-center justify-between text-xs py-px border-b border-dotted border-win98-face">
              <span className="text-[#000000]"><span className="text-[#000080] mr-1">◆</span>Max per session (total)</span>
              <span className="font-bold text-[#000080] font-courier">{sessionInfo.maxPerSession.toLocaleString()} ETH</span>
            </div>
            {sessionInfo.enabledOptions?.dailyTransferLimit && (
              <div className="flex items-center justify-between text-xs py-px border-b border-dotted border-win98-face">
                <span className="text-[#000000]"><span className="text-[#cc8800] mr-1">◆</span>Max daily spending</span>
                <span className="font-bold text-[#000080] font-courier">{sessionInfo.dailyLimit.toLocaleString()} ETH</span>
              </div>
            )}
            {sessionInfo.enabledOptions?.singleTxLimit && (
              <div className="flex items-center justify-between text-xs py-px">
                <span className="text-[#000000]"><span className="text-[#cc8800] mr-1">◆</span>Cumulative tx limit</span>
                <span className="font-bold text-[#000080] font-courier">{sessionInfo.singleTxLimit.toLocaleString()} ETH</span>
              </div>
            )}
          </div>
        </fieldset>

        {/* Security */}
        <fieldset className="border border-[#808080] px-2.5 pb-2 pt-0 relative m-0">
          <legend className="text-xs text-[#000000] px-1">Security</legend>
          <div className="space-y-0.5">
            {sessionInfo.enabledOptions?.blockInfiniteApproval && (
              <div className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked readOnly className="accent-[#000080]" />
                <span className="text-[#000000]">Block unlimited token approvals</span>
              </div>
            )}
            {sessionInfo.enabledOptions?.restrictTarget && (
              <div className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked readOnly className="accent-[#000080]" />
                <span className="text-[#000000]">
                  {sessionInfo.whitelistMode ? "Whitelist" : "Blacklist"} mode ({sessionInfo.whitelistMode ? (sessionInfo.whitelist?.length ?? 0) : (sessionInfo.blacklist?.length ?? 0)} contracts)
                </span>
              </div>
            )}
            {!sessionInfo.enabledOptions?.blockInfiniteApproval && !sessionInfo.enabledOptions?.restrictTarget && (
              <div className="text-xs text-[#808080]">No restrictions</div>
            )}
          </div>
        </fieldset>

        {/* Risk preset */}
        {sessionInfo.risk_preference && (
          <div>
            <div className="text-xs text-[#808080] mb-1 font-courier">Risk preset:</div>
            <div className="flex gap-px">
              {(["Conservative", "Balanced", "Aggressive"] as const).map(r => (
                <div
                  key={r}
                  className={`px-3 py-0.5 text-xs ${RAISED} ${
                    sessionInfo.risk_preference === r
                      ? "bg-white font-bold border-b-0 relative z-10 -mb-px"
                      : "bg-win98-face text-[#808080]"
                  }`}
                >
                  {r}
                </div>
              ))}
              {sessionInfo.slippage != null && (
                <div className={`px-3 py-0.5 text-xs ${RAISED} bg-win98-face text-[#808080] ml-auto`}>
                  Slip: {sessionInfo.slippage}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer status bar */}
        <div className={`${SUNKEN} bg-win98-face px-2.5 py-1 flex items-center justify-between`}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#008000] font-bold">●</span>
            <span className="text-[#000000] font-courier">Session active</span>
          </div>
          <span className="text-xs text-[#808080] font-courier">
            Expires: {expiresDate}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
export function WalletOverviewPanel({
  totalValue,
  totalUsd,
  tokens,
  nftCount,
  sessionStatus,
  sessionDaysLeft = 0,
  sessionInfo,
  onOpenSetup,
  onOpenHooks,
}: WalletOverviewPanelProps) {
  const { t } = useTranslation();
  const [sessionExpanded, setSessionExpanded] = useState(false);

  return (
    <Win98GroupBox label="Wallet Overview">
      {/* Total Value */}
      <div className="mb-1">
        <div className="text-xs text-[#444444] font-medium mb-0.5">{t('terminal.detail.totalValue')}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#000000] font-courier">
            {formatTokenAmount(totalValue)}
          </span>
          <span className="text-sm font-bold text-[#000080]">ETH</span>
          <span className="text-xs text-[#444444]">
            ≈ ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className={`${SUNKEN} mb-2 overflow-hidden`}>
        <MiniChart baseValue={totalValue} />
      </div>

      {/* Asset Breakdown */}
      <div className="flex gap-3 mb-2">
        <div className={`flex-1 ${SUNKEN} bg-white px-2 py-1.5`}>
          <div className="text-xs font-bold text-[#006633] mb-0.5">■ {t('terminal.detail.tokens')}</div>
          <div className="text-base font-bold text-[#000000] font-courier">
            {tokens.length}
            <span className="text-xs font-normal text-[#444444] ml-1">{t('terminal.detail.assets')}</span>
          </div>
        </div>
        <div className={`flex-1 ${SUNKEN} bg-white px-2 py-1.5`}>
          <div className="text-xs font-bold text-[#6600aa] mb-0.5">■ {t('terminal.detail.nfts')}</div>
          <div className="text-base font-bold text-[#000000] font-courier">
            {nftCount}
            <span className="text-xs font-normal text-[#444444] ml-1">{t('terminal.detail.items')}</span>
          </div>
        </div>
      </div>

      {/* ── AI Session trigger ── */}
      <div className="relative">
        {/* None */}
        {(sessionStatus === "none" || sessionStatus === null) && (
          <div
            onClick={onOpenSetup}
            className={`${SUNKEN} bg-white px-2.5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-[#f0f0f8]`}
          >
            <span className="text-xs text-[#808080] flex-1">{t('terminal.session.noSession')}</span>
            <span className="text-xs text-[#0000ff] underline">{t('terminal.session.create')}</span>
          </div>
        )}

        {/* Expired */}
        {sessionStatus === "expired" && (
          <div
            onClick={onOpenSetup}
            className={`${SUNKEN} bg-[#fff8f0] px-2.5 py-1.5 flex items-center gap-2 cursor-pointer hover:brightness-95`}
          >
            <span className="text-xs text-[#aa6600] flex-1">
              {t('terminal.session.expired')}
              {sessionInfo && ` — ${sessionInfo.maxPerTx} ETH/tx`}
            </span>
            <span className="text-xs text-[#0000ff] underline">{t('terminal.session.renew')}</span>
          </div>
        )}

        {/* Active — always show collapsed bar */}
        {sessionStatus === "active" && (
          <div className={`${SUNKEN} bg-white`}>
            <div
              onClick={() => setSessionExpanded(v => !v)}
              className="px-2.5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-[#f0f0f8]"
            >
              <span className="text-xs font-bold text-[#008000]">●</span>
              <span className="text-xs text-[#000000]">{t('terminal.session.aiSession')}</span>
              {sessionInfo && (
                <span className="text-xs font-bold text-[#000080] font-courier">
                  {sessionInfo.maxPerTx}/{sessionInfo.maxPerSession} ETH
                </span>
              )}
              <span className="text-xs text-[#808080]">· {sessionDaysLeft}d</span>
              <div className="flex-1" />
              <span className="text-xs text-[#808080] font-courier">
                {sessionExpanded ? "▲" : "▼"} {t('terminal.session.details')}
              </span>
            </div>
          </div>
        )}

        {/* Overlay */}
        {sessionStatus === "active" && sessionExpanded && sessionInfo && (
          <SessionOverlay
            sessionInfo={sessionInfo}
            sessionDaysLeft={sessionDaysLeft}
            onClose={() => setSessionExpanded(false)}
            onEdit={onOpenSetup}
          />
        )}
      </div>

      {/* ── Hooks trigger ── */}
      {onOpenHooks && (
        <div
          onClick={onOpenHooks}
          className={`${SUNKEN} bg-white px-2.5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-[#f0f0f8]`}
        >
          <span className="text-xs text-[#808080] flex-1">Hooks</span>
          <span className="text-xs text-[#0000ff] underline">Manage</span>
        </div>
      )}
    </Win98GroupBox>
  );
}
