"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import EnhancedGotchiSvg from "@/components/gotchiSvg/EnhancedGotchiSvg";
import SvgIcon from "@/components/gotchiSvg/SvgIcon";
import SettingIcon from "@assets/icons/SettingIcon";
import PetIcon from "@assets/icons/PetIcon";
import CloseIcon from "@assets/icons/CloseIcon";
import RenameIcon from "@assets/icons/RenameIcon";
import { Win98GroupBox, EquipSlotData } from "./GotchiDetailHelpers";

function TerminalEquipSlot({
  slot,
  index,
  isUnequippingThis,
  onEquip,
  onUnequip,
}: {
  slot: EquipSlotData;
  index: number;
  isUnequippingThis: boolean;
  onEquip: (index: number, type: string) => void;
  onUnequip: (index: number, tokenId: number, type: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hasWearable = !!slot.equipped;
  const displayName = slot.equipped?.name ?? `No ${slot.fullName}`;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={() => slot.canEquip && onEquip(index, slot.type)}
        className={`aspect-square border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] flex items-center justify-center overflow-hidden relative${slot.canEquip ? " cursor-pointer hover:brightness-95" : ""}`}
        style={{ background: hasWearable ? "#e8e8ff" : "#e0e0e0" }}
      >
        {hasWearable && slot.equipped?.imagePath ? (
          <SvgIcon
            imagePath={slot.equipped.imagePath}
            alt={slot.fullName}
            width={20}
            height={20}
            className="w-full h-full object-contain p-0.5"
          />
        ) : slot.canEquip ? (
          <img
            src="/icons/slot.png"
            alt={slot.fullName}
            className="w-full h-full object-contain p-0.5 opacity-30"
          />
        ) : null}
        {isUnequippingThis && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs text-[#808080]">...</span>
          </div>
        )}
      </div>

      {slot.canEquip && hasWearable && !isUnequippingThis && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (slot.equipped) onUnequip(index, slot.equipped.tokenId, slot.type);
          }}
          title="Unequip"
          className="absolute -top-1 -right-1 w-3 h-3 bg-[#cc0000] border border-[#800000] text-white leading-none flex items-center justify-center z-10"
        >
          <CloseIcon width={8} height={8} color="white" />
        </button>
      )}

      {isHovered && (
        <div
          className="absolute z-30 top-full mt-1 left-1/2 -translate-x-1/2 bg-[#FFFFCC] border border-[#000000] px-1.5 py-1 whitespace-nowrap text-xs shadow-win98-outer pointer-events-none"
        >
          {displayName}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-[#000000]" />
        </div>
      )}
    </div>
  );
}

interface GotchiPreviewPanelProps {
  tokenId: string;
  pusName: string;
  onRename: () => void;
  handlePet: () => void;
  isPetWriting: boolean;
  factionName: string;
  rarityName: string;
  level: number;
  expInLevel: number;
  previewBgStyle: React.CSSProperties;
  isSvgLoading: boolean;
  wearableIndices: any;
  equippedSlots: EquipSlotData[];
  isUnequipping: boolean;
  unequippingSlotIndex: number | null;
  onEquip: (index: number, type: string) => void;
  onUnequip: (index: number, wearableId: number, wearableType: string) => void;
  onOpenSetup?: () => void;
}

export function GotchiPreviewPanel({
  tokenId,
  pusName,
  onRename,
  handlePet,
  isPetWriting,
  factionName,
  rarityName,
  level,
  expInLevel,
  previewBgStyle,
  isSvgLoading,
  wearableIndices,
  equippedSlots,
  isUnequipping,
  unequippingSlotIndex,
  onEquip,
  onUnequip,
  onOpenSetup,
}: GotchiPreviewPanelProps) {
  const { t } = useTranslation();
  return (
    <Win98GroupBox label={pusName + '.chi'}>

      {/* Gotchi Preview */}
      <div
        className="h-40 flex items-center justify-center border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] mb-1.5 relative"
        style={previewBgStyle}
      >
        {isSvgLoading ? (
          <span className="text-xs text-white">{t('common.loading')}</span>
        ) : (
          <EnhancedGotchiSvg
            wearableIndices={wearableIndices}
            width={120}
            height={120}
          />
        )}
      </div>

      {/* Info line */}
      <div className="flex gap-2 items-center mb-1.5">
        <span
          className="text-xs font-bold"
          style={{
            color:
              factionName === "COMBAT" ? "#cc0000" :
              factionName === "SUPPORT" ? "#008000" :
              factionName === "DEFENSE" ? "#0000cc" :
              factionName === "TECH" ? "#800080" : "#808080",
          }}
        >
          ■ {factionName}
        </span>
        <span
          className="text-xs"
          style={{
            color:
              rarityName === "Rare" ? "#0000aa" :
              rarityName === "Epic" ? "#800080" :
              rarityName === "Legendary" ? "#aa6600" : "#808080",
          }}
        >
          {rarityName}
        </span>
        <div className="flex-1 flex items-center gap-1">
          <span className="text-xs font-bold font-courier">Lv.{level}</span>
          <div className="flex-1 h-3 bg-white border border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080] p-px">
            <div className="h-full bg-[#000080]" style={{ width: `${expInLevel}%` }} />
          </div>
          <span className="text-xs text-[#808080]">{expInLevel}/100</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 mb-1.5">
        <button
          onClick={onRename}
          className="flex-1 py-1 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center justify-center gap-1"
        >
          <RenameIcon width={14} height={14} />
          <span className="text-xs">{t('terminal.detail.rename')}</span>
        </button>
        <button
          onClick={handlePet}
          disabled={isPetWriting}
          className={`flex-1 py-1 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center justify-center gap-1 ${isPetWriting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <PetIcon width={14} height={14} />
          <span className="text-xs">{isPetWriting ? "..." : t('terminal.detail.pet')}</span>
        </button>
        <button
          onClick={onOpenSetup}
          className="flex-1 py-1 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[1px_1px_0_#000] bg-win98-face hover:bg-[#b0b0b0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white active:shadow-[inset_1px_1px_0_#808080] flex items-center justify-center gap-1"
        >
          <SettingIcon width={14} height={14} />
          <span className="text-xs">{t('terminal.detail.setting')}</span>
        </button>
      </div>

      {/* Equipment Slots */}
      <div className="text-xs text-[#808080] mb-1">{t('terminal.detail.equipment')}</div>
      <div className="grid grid-cols-8 gap-0.5 pb-6">
        {equippedSlots.map((slot, index) => (
          <TerminalEquipSlot
            key={index}
            slot={slot}
            index={index}
            isUnequippingThis={isUnequipping && unequippingSlotIndex === index}
            onEquip={onEquip}
            onUnequip={onUnequip}
          />
        ))}
      </div>
    </Win98GroupBox>
  );
}
