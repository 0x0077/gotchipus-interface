"use client";

import { useTranslation } from "react-i18next";
import { useStores } from "@stores/context";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useWindowMode } from "@/hooks/useWindowMode";
import { Win98Loading } from "@/components/ui/win98-loading";
import Image from "next/image";
import { GotchipusInfo } from "@/lib/types";
import { useSvgLayers } from "@/hooks/useSvgLayers";
import EnhancedGotchiSvg from "@/components/gotchiSvg/EnhancedGotchiSvg";
import { getWearablePngUrl } from "@/src/utils/wearableMapping";
import { dispatchWindowOpenEvent } from "@/lib/windowEvents";
import { PharosBanner } from "../pharos/PharosBanner";

type SessionStatus = "none" | "active" | "expired" | null;

export interface GotchiSessionInfo {
  status: SessionStatus;
  daysLeft: number;
  expiresAt: number; // Unix timestamp ms
}

export type SessionMap = Record<string, GotchiSessionInfo>;

interface GotchiCollectionProps {
  onSelectGotchi: (tokenId: string) => void;
  sessionMap: SessionMap;
  pharosBalances?: Record<string, string>;
  pharosIds: string[];
  pharosLoading: boolean;
  onSummonPharos: (id: string) => void;
}

interface GotchiThumbnailProps {
  id: string;
}

const GotchiThumbnail = ({ id }: GotchiThumbnailProps) => {
  const { wearableIndices, isLoading } = useSvgLayers(id);

  if (isLoading) {
    return (
      <div className="w-8 h-8 border-2 border-[#808080] shadow-win98-outer bg-win98-face flex items-center justify-center">
        <span className="text-xs">...</span>
      </div>
    );
  }

  const bgUrl = wearableIndices.backgroundIndex > 0
    ? getWearablePngUrl('backgrounds', wearableIndices.backgroundIndex - 1)
    : null;
  const bgStyle = bgUrl
    ? { backgroundImage: `url("${bgUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  return (
    <div
      className="w-8 h-8 border-2 border-[#808080] shadow-win98-inner flex items-center justify-center p-0.5"
      style={bgStyle}
    >
      <EnhancedGotchiSvg
        wearableIndices={wearableIndices}
        className="w-full h-full"
      />
    </div>
  );
};

interface ListApiData {
  balance: string;
  ids: string[];
  gotchipusInfo?: GotchipusInfo[];
  tbaAddresses?: string[];
}

const RARITY_NAMES: Record<number, string> = {
  0: "Common",
  1: "Rare",
  2: "Epic",
  3: "Legendary",
};

const RARITY_COLORS: Record<number, string> = {
  0: "text-[#808080]",     // Common - Gray
  1: "text-[#0066cc]",     // Rare - Blue
  2: "text-[#9933cc]",     // Epic - Purple
  3: "text-[#ff9900]",     // Legendary - Orange
};

const FACTION_NAMES: Record<number, string> = {
  0: "COMBAT",
  1: "DEFENSE",
  2: "TECHNOLOGY",
};

const FACTION_COLORS: Record<number, string> = {
  0: "bg-[#cc0000] text-white",
  1: "bg-[#0000cc] text-white",
  2: "bg-[#800080] text-white",
};

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export const GotchiCollection = observer(({ onSelectGotchi, sessionMap, pharosBalances, pharosIds, pharosLoading, onSummonPharos }: GotchiCollectionProps) => {
  const { t } = useTranslation();
  const { walletStore } = useStores();
  const walletAddress = walletStore.address;
  const { width } = useWindowMode();
  const compact = width !== null && width < 720;

  const listApiUrl = walletAddress ? `/api/tokens/gotchipus?owner=${walletAddress}&includeGotchipusInfo=true` : null;

  const { data: listData, isLoading } = useSWR<ListApiData>(listApiUrl, fetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
  });

  const ids = listData?.ids || [];
  const gotchipusInfo = listData?.gotchipusInfo || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-win98-face">
        <Win98Loading />
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-win98-face p-2">
        <PharosBanner pharosIds={pharosIds} isLoading={pharosLoading} onSummon={onSummonPharos} />
        <div className="flex-1 flex items-center justify-center relative">
          {/* Arrow guide pointing to PharosBanner */}
          {pharosIds.length > 0 && (
            <div className="absolute top-2 left-4 flex flex-col items-start pointer-events-none select-none">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-1">
                {/* Arrowhead pointing up-left */}
                <polygon points="18,2 10,18 22,14" fill="#ff3366" />
                {/* Curvy line */}
                <path d="M16 12 C10 30, 8 40, 20 55 C30 68, 42 72, 55 75" stroke="#ff3366" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
              <span className="text-[#ff3366] text-sm font-bold border-2 border-[#ff3366] rounded px-3 py-1 bg-white/80">
                {t('terminal.collection.clickSummonHint', 'click summon ↑')}
              </span>
            </div>
          )}
          <div className="text-center win98-bezel-inset p-8 bg-win98-face max-w-md">
            <div className="mb-4">
              <Image src="/not-any.png" alt="No Gotchipus" width={120} height={120} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-[#000080] mb-3">{t('terminal.collection.readyToSummon')}</h2>
            <p className="text-sm text-[#000080] mb-6">
              {t('terminal.collection.noGotchi')}
            </p>
            {pharosIds.length > 0 ? (
              <button
                onClick={() => onSummonPharos(pharosIds[0])}
                className="win98-bezel shadow-[2px_2px_0_#000] bg-[#000080] text-white px-6 py-2 text-sm font-bold hover:bg-[#1a3a99] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {t('terminal.collection.goToSummon')}
              </button>
            ) : (
              <button
                onClick={() => dispatchWindowOpenEvent("mint")}
                className="win98-bezel shadow-[2px_2px_0_#000] bg-[#000080] text-white px-6 py-2 text-sm font-bold hover:bg-[#1a3a99] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {t('terminal.collection.goToMint')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-win98-face">
      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        <div className="win98-group-box bg-win98-face mb-2">
          <div className="win98-group-title text-xs font-bold text-[#000080]">{t('terminal.collection.title')}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#808080]">
              {t('terminal.collection.subtitle')}
            </span>
            <span className="px-2 py-0.5 bg-white border-2 border-[#808080] shadow-win98-inner text-xs text-[#000080] font-bold">
              {ids.length} GOTCHI
            </span>
          </div>
        </div>
        <PharosBanner pharosIds={pharosIds} isLoading={pharosLoading} onSummon={onSummonPharos} />

        <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-win98-inner overflow-hidden">
          {/* Table Header — desktop only; compact rows label themselves
              inline via the stacked layout below. */}
          {!compact && (
            <div className="grid grid-cols-[40px_2fr_1fr_100px_100px_90px_80px_60px] px-2 py-2 border-b-2 border-[#808080] bg-win98-face text-[#000000] text-xs uppercase tracking-wide font-bold">
              <span></span>
              <span>{t('terminal.collection.headers.gotchipus')}</span>
              <span>{t('terminal.collection.headers.levelXp')}</span>
              <span className="text-center">{t('terminal.collection.headers.faction')}</span>
              <span className="text-center">{t('terminal.collection.headers.rarity')}</span>
              <span className="text-center">{t('terminal.collection.headers.session')}</span>
              <span className="text-right">{t('terminal.collection.headers.phrs')}</span>
              <span className="text-center">{t('terminal.collection.headers.id')}</span>
            </div>
          )}

          {/* Rows */}
          {ids.slice(0, 10).map((id, i) => {
            const info = gotchipusInfo[i];
            const currentExp = Number(info?.currentExp || 0);
            const level = Math.floor(currentExp / 100);
            const expInLevel = Math.floor(((currentExp / 100) % 1) * 100);
            const rarity = info?.rarity ?? 0;
            const rarityName = RARITY_NAMES[rarity] || "Common";
            const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS[0];
            const name = info?.name || `Gotchipus #${id}`;
            const primaryFaction = info?.faction ?? -1;
            const factionName = FACTION_NAMES[primaryFaction] ?? "—";
            const factionColor = FACTION_COLORS[primaryFaction] ?? "bg-[#808080] text-white";
            const sessionLabel =
              sessionMap[id]?.status === "active"
                ? <span className="text-xs font-bold text-[#008000]">{t('terminal.collection.sessionActive')}</span>
                : sessionMap[id]?.status === "expired"
                ? <span className="text-xs font-bold text-[#cc6600]">{t('terminal.collection.sessionExpired')}</span>
                : <span className="text-xs text-[#808080]">{t('terminal.collection.sessionNone')}</span>
            const phrsLabel = pharosBalances?.[id] !== undefined
              ? parseFloat(pharosBalances[id]).toFixed(4)
              : "--"

            if (compact) {
              return (
                <div
                  key={id}
                  onClick={() => onSelectGotchi(id)}
                  className="px-2 py-2 border-b border-[#808080] cursor-pointer hover:bg-[#e6e2da] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GotchiThumbnail id={id} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-xs font-bold text-[#000080] truncate">{name}</span>
                        <span className="text-[10px] text-[#808080] font-mono ml-auto flex-shrink-0">#{id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] font-bold text-[#000080] flex-shrink-0">Lv.{level}</span>
                        <div className="w-[120px] h-2.5 win98-bezel-inset shadow-win98-inner bg-white p-px flex-shrink-0">
                          <div className="h-full bg-[#000080]" style={{ width: `${expInLevel}%` }} />
                        </div>
                        <span className="text-[10px] text-[#808080] flex-shrink-0">{expInLevel}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 border border-[#808080] shadow-win98-outer font-bold ${factionColor}`}>
                      {factionName}
                    </span>
                    <span className={`text-[10px] font-bold ${rarityColor}`}>{rarityName}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {sessionLabel}
                      <span className="text-[10px] text-[#000080] font-bold font-mono">{phrsLabel}</span>
                    </span>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={id}
                onClick={() => onSelectGotchi(id)}
                className="grid grid-cols-[40px_2fr_1fr_100px_100px_90px_80px_60px] items-center px-2 py-2.5 border-b border-win98-face cursor-pointer hover:bg-[#e6e2da] transition-colors"
              >
                <GotchiThumbnail id={id} />
                <div>
                  <span className="text-xs font-bold text-[#000080]">{name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs font-bold text-[#000080] shrink-0">Lv.{level}</span>
                  <div className="flex-1 h-3 win98-bezel-inset shadow-win98-inner bg-white p-px">
                    <div
                      className="h-full bg-[#000080]"
                      style={{ width: `${expInLevel}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#808080] shrink-0">{expInLevel}/100</span>
                </div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 border-2 border-[#808080] shadow-win98-outer font-bold ${factionColor}`}>
                    {factionName}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-xs font-bold ${rarityColor}`}>{rarityName}</span>
                </div>
                <div className="text-center">
                  {sessionLabel}
                </div>
                <div className="text-right text-xs text-[#000080] font-bold font-mono">{phrsLabel}</div>
                <div className="text-center text-xs text-[#808080] font-bold">#{id}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
