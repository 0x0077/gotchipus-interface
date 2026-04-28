"use client"

import { X, ChevronRight } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useContractRead, useContractWrite } from "@/hooks/useContract"
import { BG_BYTES32, BODY_BYTES32, EYE_BYTES32, HAND_BYTES32, HEAD_BYTES32, CLOTHES_BYTES32, FACE_BYTES32, MOUTH_BYTES32 } from "@/lib/constant"
import { useToast } from '@/hooks/use-toast'
import { observer } from "mobx-react-lite"
import { useStores } from "@stores/context"
import { KEY_TO_CONFIG_MAP, WearableCategoryKey, TOKEN_ID_TO_LOCAL_INDEX, TOKEN_ID_TO_IMAGE, WEARABLE_CONFIG } from '@/components/gotchiSvg/config';
import SvgIcon from "@/components/gotchiSvg/SvgIcon";
import { getWearableName, WearableType } from "@/src/utils/wearableMapping";


/* ───── types ───── */
interface EquipSelectWindowProps {
  onClose: () => void
  wearableBalances: string[]
  selectedType?: string
  selectedTokenId?: string
  isMobile?: boolean
  onSuccess?: (tokenId: string, txHash: string) => void
}

type WearableRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface EnrichedWearable {
  id: number
  name: string
  rarity: WearableRarity
  stats: Record<string, number>
  balance: number
}

/* ───── constants ───── */
const CATEGORY_TABS = [
  { key: HAND_BYTES32,    label: 'Hand'},
  { key: HEAD_BYTES32,    label: 'Head'},
  { key: FACE_BYTES32,    label: 'Face'},
  { key: MOUTH_BYTES32,   label: 'Mouth'},
  { key: CLOTHES_BYTES32, label: 'Clothes'}
];

const RARITY_STYLES: Record<WearableRarity, { color: string; bg: string; label: string }> = {
  common:    { color: '#808080', bg: '#e8e8e8', label: 'C' },
  rare:      { color: '#0055CC', bg: '#dde4ff', label: 'R' },
  epic:      { color: '#8B008B', bg: '#f0ddf0', label: 'E' },
  legendary: { color: '#CC8800', bg: '#fff4d0', label: 'L' },
};

const STAT_COLORS: Record<string, string> = {
  STR: '#cc0000', DEF: '#cc6600', AGI: '#800080',
  INT: '#0000cc', VIT: '#008080', LUK: '#aa6600',
};

/* ───── component ───── */
const EquipSelectWindow = observer(({
  onClose, onSuccess, wearableBalances, selectedType, selectedTokenId, isMobile = false
}: EquipSelectWindowProps) => {

  const getTypeFromIndex = (type?: string) => type ?? HAND_BYTES32;

  const [activeTab, setActiveTab] = useState(getTypeFromIndex(selectedType));
  const [pendingEquip, setPendingEquip] = useState<EnrichedWearable | null>(null);
  const [equipIndex, setEquipIndex] = useState<number>(0);
  const [isEquiping, setIsEquiping] = useState<boolean>(false);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState<boolean>(false);

  const { contractWrite, hash, isConfirmed, error } = useContractWrite();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { wearableStore } = useStores();

  useEffect(() => { setActiveTab(getTypeFromIndex(selectedType)); }, [selectedType]);

  /* ───── data helpers ───── */
  const mapCategoryNameToWearableType = (categoryName: string): WearableType | null => {
    const mapping: Record<string, WearableType> = {
      head: 'heads', hand: 'hands', clothes: 'clothes', face: 'faces',
      mouth: 'mouths', background: 'backgrounds', body: 'bodys', eye: 'eyes',
    };
    return mapping[categoryName] || null;
  };

  const getAvailableEquipments = (type: string): EnrichedWearable[] => {
    const config = KEY_TO_CONFIG_MAP[type as WearableCategoryKey];
    if (!config) return [];
    const categoryMapping = TOKEN_ID_TO_LOCAL_INDEX[config.name];
    if (!categoryMapping) return [];

    const items: EnrichedWearable[] = [];
    const wearableType = mapCategoryNameToWearableType(config.name);

    Object.keys(categoryMapping).forEach(tokenIdStr => {
      const tokenId = parseInt(tokenIdStr);
      const balance = parseInt(wearableBalances[tokenId] || "0");
      if (balance > 0) {
        const imagePath = TOKEN_ID_TO_IMAGE[tokenId];
        if (imagePath && wearableType) {
          const index = tokenId - config.offset;
          const name = getWearableName(wearableType, index);
          items.push({
            id: tokenId,
            name,
            rarity: 'common' as WearableRarity,
            stats: {},
            balance,
          });
        }
      }
    });
    return items;
  };

  const availableEquipments = useMemo(() => getAvailableEquipments(activeTab), [activeTab, wearableBalances]);

  // Count items per category for tab badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_TABS.forEach(tab => {
      counts[tab.key] = getAvailableEquipments(tab.key).length;
    });
    return counts;
  }, [wearableBalances]);

  /* ───── contract interactions ───── */
  const { data: wearableTypeInfos } = useContractRead("getAllEquipWearableType", [selectedTokenId], {
    enabled: isConfirmed && wearableStore.isRefreshing
  });

  const handleConfirmEquip = () => {
    if (!pendingEquip) return;
    setEquipIndex(pendingEquip.id);
    setIsEquiping(true);
    setPendingEquip(null);
    contractWrite("equipWearable", [selectedTokenId, pendingEquip.id, activeTab]);
    toast({
      title: t('toast.txSubmitted'),
      description: t('toast.txSubmittedDesc'),
    });
  };

  useEffect(() => {
    if (isConfirmed && !hasShownSuccessToast) {
      setIsEquiping(false);
      setHasShownSuccessToast(true);
      wearableStore.setIsRefreshing(true);
      toast({ title: t('toast.txConfirmed'), description: t('toast.txConfirmedDesc') });
    }
  }, [isConfirmed, toast, wearableStore, hasShownSuccessToast]);

  useEffect(() => {
    if (wearableTypeInfos && isConfirmed && hasShownSuccessToast) {
      const sendDataToBackend = async () => {
        try {
          wearableStore.setImageVersion(wearableStore.imageVersion + 1);
          setTimeout(onClose, 500);
        } catch {
          setTimeout(onClose, 500);
        }
      };
      if (onSuccess) onSuccess(selectedTokenId || "", hash as `0x${string}`);
      const timer = setTimeout(sendDataToBackend, 1000);
      return () => clearTimeout(timer);
    }
  }, [wearableTypeInfos, isConfirmed, hasShownSuccessToast, selectedTokenId, onClose]);

  useEffect(() => {
    if (error) {
      setIsEquiping(false);
      toast({ title: t('toast.txCancelled'), description: t('toast.txCancelledDesc'), variant: "destructive" });
    }
  }, [error, toast]);

  /* ───── render ───── */
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`border-2 border-[#808080] shadow-win98-outer bg-[#d4d0c8] flex flex-col ${
          isMobile ? 'w-[95vw] h-[85vh] max-w-[420px]' : 'w-[620px] h-[520px]'
        }`}
      >
        {/* ── Title bar ── */}
        <div className="bg-[#000080] px-2 py-1 flex items-center justify-between text-white shrink-0">
          <span className="text-xs font-bold tracking-wide font-win98">
            {t('equipDetail.selectEquipment')}
          </span>
          <button
            onClick={onClose}
            className="bg-[#d4d0c8] shadow-win98-outer border border-[#808080] w-[18px] h-[18px] flex items-center justify-center"
          >
            <X size={10} className="text-black" />
          </button>
        </div>

        {/* ── Category tabs ── */}
        <div className="shrink-0 flex border-b border-[#808080] bg-[#d4d0c8] px-1 pt-1 gap-[1px]">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = categoryCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPendingEquip(null); }}
                disabled={isEquiping}
                className={`
                  px-2 py-1 text-[11px] whitespace-nowrap rounded-t-[3px] border border-b-0 transition-colors
                  ${isActive
                    ? 'bg-[#d4d0c8] border-[#808080] font-bold -mb-[1px] pb-[5px] z-10'
                    : 'bg-win98-face border-[#a0a0a0] text-[#505050] hover:bg-[#c8c8c8]'
                  }
                  ${isEquiping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  font-win98
                `}
              >
                {!isMobile && tab.label}
                {count > 0 && (
                  <span className={`ml-1 text-[9px] ${isActive ? 'text-[#000080]' : 'text-[#808080]'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content grid ── */}
        <div className={`overflow-y-auto flex-1 p-3 ${
          isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-3'
        } content-start`}>
          {availableEquipments.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="text-[12px] text-[#505050] font-bold font-win98">
                {t('equipDetail.noEquipments')}
              </div>
              <div className="text-[11px] text-[#808080] mt-1">
                {t('equipDetail.noEquipmentsDesc')}
              </div>
            </div>
          ) : (
            availableEquipments.map((equip) => {
              const isSelected = pendingEquip?.id === equip.id;
              const isEquipping = isEquiping && equipIndex === equip.id;
              const isDisabled = isEquiping && !isEquipping;
              const rs = RARITY_STYLES[equip.rarity];
              const statEntries = Object.entries(equip.stats);

              return (
                <button
                  key={equip.id}
                  type="button"
                  onClick={() => !isDisabled && !isEquiping && setPendingEquip(isSelected ? null : equip)}
                  disabled={isDisabled}
                  className={`
                    text-left w-full transition-all duration-100
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected ? 'shadow-win98-inner' : 'shadow-win98-outer'}
                  `}
                  style={{
                    background: isSelected ? '#bbb8b0' : '#c0c0c0',
                    boxShadow: isSelected
                      ? `inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 0 0 0 2px ${rs.color}`
                      : undefined,
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative m-[2px] aspect-square shadow-win98-inner flex items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${rs.bg}, #f0f0f0 50%, ${rs.bg})`,
                    }}
                  >
                    <SvgIcon
                      imagePath={TOKEN_ID_TO_IMAGE[equip.id]}
                      alt={equip.name}
                      width={120}
                      height={120}
                      className={`w-full h-full object-contain transition-transform duration-150 ${isDisabled ? 'grayscale' : ''}`}
                      style={{ filter: isSelected ? `drop-shadow(0 0 4px ${rs.color}66)` : undefined }}
                    />

                    {/* Scanline overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)' }}
                    />

                    {/* Rarity badge */}
                    <span
                      className="absolute top-[2px] left-[2px] text-[7px] font-bold uppercase px-[4px] tracking-wider leading-[13px]"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.color}40` }}
                    >
                      {equip.rarity}
                    </span>

                    {/* Balance */}
                    {equip.balance > 1 && (
                      <span className="absolute top-[2px] right-[2px] text-[8px] font-bold font-mono bg-white/70 text-black/60 px-[2px] leading-[13px]">
                        ×{equip.balance}
                      </span>
                    )}

                    {/* Stats pills overlay — bottom of image */}
                    {statEntries.length > 0 && (
                      <div className="absolute bottom-[2px] left-[2px] right-[2px] flex gap-[2px] flex-wrap">
                        {statEntries.map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-white border border-[#808080] px-[3px] py-0 text-[7px] font-mono inline-flex items-center gap-[1px] leading-[12px]"
                          >
                            <span className="text-[#808080]">{k}</span>
                            <span className="font-bold text-[#000080]">+{v}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Equipping overlay */}
                    {isEquipping && (
                      <div className="absolute inset-0 bg-[#000080]/30 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold tracking-wider animate-pulse">
                          {t('equipDetail.equipping')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="px-[4px] py-[2px]">
                    <div
                      className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-[14px] font-win98"
                    >
                      {equip.name}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Bottom action bar ── */}
        <div className="shrink-0 border-t border-[#808080] bg-[#d4d0c8] px-3 py-2 flex items-center justify-between">
          {/* Selected item preview */}
          <div className="text-[11px] text-[#505050] truncate flex-1 mr-2 font-win98">
            {pendingEquip ? (
              <span>
                <span className="font-bold text-black">{pendingEquip.name}</span>
                <span className="ml-1" style={{ color: RARITY_STYLES[pendingEquip.rarity].color }}>
                  [{pendingEquip.rarity}]
                </span>
                {Object.entries(pendingEquip.stats).length > 0 && (
                  <span className="ml-1 text-[10px]">
                    {Object.entries(pendingEquip.stats).map(([k, v]) => `${k}+${v}`).join(' ')}
                  </span>
                )}
              </span>
            ) : (
              <span className="italic">{isEquiping ? t('equipDetail.equipping') + '...' : t('equipDetail.clickToSelect') || 'Click an item to select'}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              onClick={onClose}
              disabled={isEquiping}
              className="shadow-win98-outer bg-[#d4d0c8] border border-[#808080] px-4 py-[3px] text-[11px] font-bold
                         hover:bg-[#c8c8c8] active:shadow-win98-inner disabled:opacity-50 font-win98"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleConfirmEquip}
              disabled={!pendingEquip || isEquiping}
              className={`shadow-win98-outer border border-[#808080] px-4 py-[3px] text-[11px] font-bold flex items-center gap-1
                         active:shadow-win98-inner disabled:opacity-40 disabled:cursor-not-allowed
                         ${pendingEquip && !isEquiping ? 'bg-[#d4d0c8] hover:bg-[#c8c8c8] text-[#000080]' : 'bg-[#d4d0c8] text-[#808080]'}
                         font-win98`}
            >
              {t('equipDetail.equip') || 'Equip'}
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EquipSelectWindow;