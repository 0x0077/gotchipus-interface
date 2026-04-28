"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { GotchiMetadata } from "@/lib/types";
import { useWindowMode } from "@/hooks/useWindowMode";

interface BasicInfoGridProps {
  rarityName: string;
  rarityColor: string;
  factionName: string;
  calculatedLevel: number;
  age: number;
  metadata: GotchiMetadata;
}

export const BasicInfoGrid: React.FC<BasicInfoGridProps> = ({
  rarityName,
  rarityColor,
  factionName,
  calculatedLevel,
  age,
  metadata
}) => {
  const { t } = useTranslation();
  const { isMobile } = useWindowMode();
  return (
    <div className={`mb-4 grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-win98-inner rounded-sm p-2">
        <div className="text-[10px] text-[#808080] uppercase mb-1">{t('filterSidebar.rarity')}</div>
        <div className={`text-xs font-bold px-2 py-0.5 inline-block ${rarityColor} rounded-sm`}>
          {rarityName}
        </div>
      </div>
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-win98-inner rounded-sm p-2">
        <div className="text-[10px] text-[#808080] uppercase mb-1">{t('terminal.collection.headers.faction')}</div>
        <div className="text-xs font-bold text-[#000080]">{factionName}</div>
      </div>
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-win98-inner rounded-sm p-2">
        <div className="text-[10px] text-[#808080] uppercase mb-1">{t('allGotchi.level')}</div>
        <div className="text-xs font-bold text-[#000080]">
          {calculatedLevel}
        </div>
      </div>
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-win98-inner rounded-sm p-2">
        <div className="text-[10px] text-[#808080] uppercase mb-1">{t('allGotchi.age')}</div>
        <div className="text-xs font-bold text-[#000080]">{t('allGotchi.ageDays', { days: age })}</div>
      </div>
    </div>
  );
};
