"use client";

import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { useStores } from "@stores/context";
import { Win98GroupBox } from "./GotchiDetailHelpers";
import { useContractRead } from "@/hooks/useContract";

function StatBar({ label, value, max = 100, color = "#000080" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className="text-xs text-[#000000] w-7 text-right font-normal">{label}</span>
      <div className="flex-1 h-3 bg-white border-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] p-px">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs text-[#000000] w-5 text-right font-normal font-courier">{value}</span>
    </div>
  );
}

interface AttributesPanelProps {
  tokenId: string;
}

export const AttributesPanel = observer(({ tokenId }: AttributesPanelProps) => {
  const { t } = useTranslation();
  const { wearableStore } = useStores();
  const { data: rawAttrs, refetch } = useContractRead("getAttributes", [tokenId], { enabled: !!tokenId });

  useEffect(() => {
    if (wearableStore.isRefreshing) {
      refetch();
    }
  }, [wearableStore.isRefreshing, refetch]);

  const attrs = useMemo(() => {
    if (!rawAttrs) return [0, 0, 0, 0, 0, 0];
    return (rawAttrs as bigint[]).map((v) => Math.round(Number(v) / 100));
  }, [rawAttrs]);

  const barMax = useMemo(() => {
    const highest = Math.max(...attrs);
    return Math.max(100, Math.ceil(highest / 100) * 100);
  }, [attrs]);

  // Order: strength, mind, defense, vitality, agility, luck
  return (
    <Win98GroupBox label={t('terminal.detail.attributes')}>
      <div className="grid grid-cols-2 gap-x-3">
        <StatBar label="STR" value={attrs[0]} max={barMax} color="#cc0000" />
        <StatBar label="INT" value={attrs[1]} max={barMax} color="#0000cc" />
        <StatBar label="DEF" value={attrs[2]} max={barMax} color="#cc6600" />
        <StatBar label="VIT" value={attrs[3]} max={barMax} color="#008080" />
        <StatBar label="AGI" value={attrs[4]} max={barMax} color="#800080" />
        <StatBar label="LUK" value={attrs[5]} max={barMax} color="#aa6600" />
      </div>
    </Win98GroupBox>
  );
});
