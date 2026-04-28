'use client'

import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useStores } from "@stores/context"
import { observer } from "mobx-react-lite"
import useSWR from "swr"
import EnhancedGotchiSvg from "@/components/gotchiSvg/EnhancedGotchiSvg"
import { useSvgLayers, WearableIndices } from "@/hooks/useSvgLayers"
import { TOKEN_ID_TO_LOCAL_INDEX } from "@/components/gotchiSvg/config"
import { getWearablePngUrl } from "@/src/utils/wearableMapping"
import { GotchipusInfo } from "@/lib/types"
import { WearableItem, RARITY } from "./types"

/* ─── types ─── */
interface ListApiData {
  balance: string;
  ids: string[];
  gotchipusInfo?: GotchipusInfo[];
}

const RARITY_NAMES: Record<number, string> = { 0: 'Common', 1: 'Rare', 2: 'Epic', 3: 'Legendary' };
const FACTION_NAMES: Record<number, string> = { 0: 'NONE', 1: 'COMBAT', 2: 'SUPPORT', 3: 'DEFENSE', 4: 'TECH' };

/** Map WearableItem.category to WearableIndices key */
const CATEGORY_TO_INDEX_KEY: Record<string, keyof WearableIndices> = {
  head: 'headIndex',
  hand: 'handIndex',
  clothes: 'clothesIndex',
  face: 'faceIndex',
  mouth: 'mouthIndex',
};

/** Map WearableItem.category to TOKEN_ID_TO_LOCAL_INDEX key */
const CATEGORY_TO_CONFIG_KEY: Record<string, string> = {
  head: 'head',
  hand: 'hand',
  clothes: 'clothes',
  face: 'face',
  mouth: 'mouth',
};

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed');
  return res.json();
});

/** Apply multiple try-on items to base wearableIndices */
function applyTryOnItems(base: WearableIndices, items: WearableItem[]): WearableIndices {
  if (items.length === 0) return base;
  const result = { ...base };
  for (const item of items) {
    const indexKey = CATEGORY_TO_INDEX_KEY[item.category];
    const configKey = CATEGORY_TO_CONFIG_KEY[item.category];
    if (!indexKey || !configKey) continue;
    const localIndex = TOKEN_ID_TO_LOCAL_INDEX[configKey]?.[item.id];
    if (localIndex != null) {
      result[indexKey] = localIndex;
    }
  }
  return result;
}

/* ─── gotchi SVG with try-on support ─── */
function GotchiSvgPreview({
  tokenId,
  tryOnItems,
  size = 120,
}: {
  tokenId: string;
  tryOnItems: WearableItem[];
  size?: number;
}) {
  const { wearableIndices, isLoading } = useSvgLayers(tokenId);

  const previewIndices = useMemo(
    () => applyTryOnItems(wearableIndices, tryOnItems),
    [wearableIndices, tryOnItems],
  );

  const bgUrl = previewIndices.backgroundIndex > 0
    ? getWearablePngUrl('backgrounds', previewIndices.backgroundIndex - 1)
    : null;
  const bgStyle: React.CSSProperties = bgUrl
    ? { backgroundImage: `url("${bgUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: '#000040', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '16px 16px' };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#000040]">
        <span className="text-[#8080ff] text-[10px]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={bgStyle}>
      <EnhancedGotchiSvg wearableIndices={previewIndices} width={size} height={size} />
    </div>
  );
}

/* ─── small thumbnail for dropdown ─── */
function GotchiThumb({ tokenId }: { tokenId: string }) {
  const { wearableIndices, isLoading } = useSvgLayers(tokenId);
  if (isLoading) return <div className="w-6 h-6 bg-[#d0d0d0]" />;
  return (
    <div className="w-6 h-6">
      <EnhancedGotchiSvg wearableIndices={wearableIndices} width={24} height={24} />
    </div>
  );
}

/* ─── main panel ─── */
interface GotchiPreviewPanelProps {
  tryOnItems: WearableItem[];
  onClearTryOn: () => void;
  onRemoveTryOn: (id: number) => void;
  items: WearableItem[];
}

export const GotchiPreviewPanel = observer(({ tryOnItems, onClearTryOn, onRemoveTryOn, items }: GotchiPreviewPanelProps) => {
  const { t } = useTranslation();
  const { walletStore } = useStores();
  const [showList, setShowList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listApiUrl = walletStore.address
    ? `/api/tokens/gotchipus?owner=${walletStore.address}&includeGotchipusInfo=true`
    : null;
  const { data: listData, isLoading } = useSWR<ListApiData>(listApiUrl, fetcher, {
    refreshInterval: 30000,
    keepPreviousData: true,
  });

  const ids = listData?.ids || [];
  const gotchipusInfo = listData?.gotchipusInfo || [];

  const activeId = selectedId && ids.includes(selectedId) ? selectedId : ids[0] || null;
  const activeIndex = activeId ? ids.indexOf(activeId) : -1;
  const activeInfo = activeIndex >= 0 ? gotchipusInfo[activeIndex] : null;

  const currentExp = Number(activeInfo?.currentExp || 0);
  const level = Math.floor(currentExp / 100);
  const expInLevel = Math.floor(((currentExp / 100) % 1) * 100);
  const rarityName = RARITY_NAMES[activeInfo?.rarity ?? 0] || 'Common';
  const factionName = FACTION_NAMES[activeInfo?.faction ?? 0] || 'NONE';
  const pusName = activeInfo?.name || (activeId ? `Gotchipus #${activeId}` : 'No Gotchi');

  const factionColor =
    factionName === 'COMBAT' ? '#cc0000' :
    factionName === 'SUPPORT' ? '#008000' :
    factionName === 'DEFENSE' ? '#0000cc' :
    factionName === 'TECH' ? '#800080' : '#808080';

  const rarityColor =
    rarityName === 'Rare' ? '#0000aa' :
    rarityName === 'Epic' ? '#800080' :
    rarityName === 'Legendary' ? '#aa6600' : '#808080';

  // Not connected or no gotchis
  if (!walletStore.isConnected || ids.length === 0) {
    return (
      <div className="shadow-win98-outer bg-win98-face">
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-[6px] py-[2px] text-[11px] font-bold text-white tracking-[0.3px] text-shadow-win98">
          Gotchi Preview
        </div>
        <div className="m-[3px] h-[170px] shadow-win98-inner bg-[#000040] flex items-center justify-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}>
          <span className="text-[#8080ff] text-[10px]">
            {!walletStore.isConnected ? 'Connect wallet to preview' : isLoading ? 'Loading...' : 'No Gotchi found'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-win98-outer bg-win98-face flex flex-col">
      {/* Title bar with gotchi selector */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-1 py-[2px] flex items-center gap-1 relative">
        <button onClick={() => setShowList(!showList)} className="flex-1 flex items-center justify-between bg-white/[0.12] border border-white/20 py-[1px] pr-[6px] pl-1 cursor-pointer min-w-0">
          <span className="text-white text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{pusName}</span>
          <span className="text-white text-[8px] ml-1 shrink-0">▼</span>
        </button>
        <span className="text-white/60 text-[9px] shrink-0">({ids.length})</span>

        {/* Dropdown */}
        {showList && (
          <div className="absolute top-full left-0 right-0 z-[100] shadow-win98-outer bg-win98-face max-h-[160px] overflow-auto"
            style={{ boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 2px 2px 0 #000' }}>
            {ids.map((id, i) => {
              const info = gotchipusInfo[i];
              const name = info?.name || `Gotchipus #${id}`;
              const exp = Number(info?.currentExp || 0);
              const lv = Math.floor(exp / 100);
              const rar = RARITY_NAMES[info?.rarity ?? 0] || 'Common';
              const isSelected = id === activeId;
              return (
                <div
                  key={id}
                  onClick={() => { setSelectedId(id); setShowList(false); }}
                  className="px-[6px] py-1 flex items-center gap-[6px] cursor-pointer border-b border-win98-highlight"
                  style={{
                    background: isSelected ? '#000080' : 'transparent',
                    color: isSelected ? '#fff' : '#000',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#d0d0ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? '#000080' : 'transparent'; }}
                >
                  <GotchiThumb tokenId={id} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{name}</div>
                    <div className="text-[9px] flex gap-[6px]"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#808080' }}>
                      <span>LVL {lv}</span>
                      <span>{rar}</span>
                    </div>
                  </div>
                  {isSelected && <span className="text-[10px]">&#10003;</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Character preview */}
      <div className="m-[3px] h-[170px] relative shadow-win98-inner overflow-hidden">
        {activeId && <GotchiSvgPreview tokenId={activeId} tryOnItems={tryOnItems} size={120} />}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 bg-[rgba(0,0,40,0.7)] px-[6px] py-[2px] flex justify-between items-center">
          <span className="text-[9px] text-[#8080ff] font-mono tracking-[0.5px]">
            LVL {level} · EXP {expInLevel}/100
          </span>
          <span className="text-[8px] font-bold tracking-[0.8px] uppercase bg-black/30 px-1 py-0"
            style={{ color: factionColor }}>{factionName}</span>
        </div>

        {/* Try-on banner */}
        {tryOnItems.length > 0 && (
          <div className="absolute top-0 left-0 right-0 bg-[rgba(0,0,128,0.85)] px-[6px] py-[2px] flex items-center justify-between z-10">
            <span className="text-[9px] text-white font-bold flex items-center gap-1">
              <span className="text-[11px]">&#9673;</span>
              Preview ({tryOnItems.length})
            </span>
            <button onClick={onClearTryOn} className="bg-white/20 border border-white/30 text-white text-[8px] px-[5px] py-0 cursor-pointer font-bold">
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Info line */}
      <div className="px-[6px] pt-[2px] pb-1 flex gap-[6px] items-center">
        <span className="text-[9px] font-bold" style={{ color: rarityColor }}>{rarityName}</span>
        <div className="flex-1 flex items-center gap-[2px]">
          <span className="text-[9px] font-bold font-courier">Lv.{level}</span>
          <div className="flex-1 h-[6px] bg-white border border-[#808080] p-[1px] overflow-hidden"
            style={{ boxShadow: 'inset 1px 1px 0 #404040' }}>
            <div className="h-full bg-[#000080]" style={{ width: `${expInLevel}%` }} />
          </div>
        </div>
      </div>

      {/* Try-on items list */}
      {tryOnItems.length > 0 && (
        <div className="px-1 pb-1 flex flex-col gap-[1px]">
          {tryOnItems.map(item => {
            const r = RARITY[item.rarity];
            return (
              <div key={item.id} className="flex items-center gap-1 px-1 py-[2px] bg-white shadow-win98-inner"
                style={{ borderLeft: `2px solid ${r?.color || '#808080'}` }}>
                <span className="text-[8px] text-[#808080] uppercase w-9 shrink-0">{item.category}</span>
                <span className="text-[9px] font-bold flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                <button onClick={() => onRemoveTryOn(item.id)} className="bg-transparent border-none text-[8px] text-[#cc0000] cursor-pointer font-bold px-[2px] py-0 shrink-0">&#10005;</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
