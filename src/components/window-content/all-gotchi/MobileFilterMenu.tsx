'use client'

import { useState } from "react"
import { Win98Select } from "@/components/ui/win98-select"
import { Win98Checkbox } from "@/components/ui/win98-checkbox"
import { useTranslation } from 'react-i18next';

interface MobileFilterMenuProps {
  isOpen: boolean;
  searchId: string;
  isSearching: boolean;
  selectedRarity: string;
  levelRange: { min: string; max: string };
  selectedCommunityFeatures: Set<string>;
  sortBy: string;
  onSearchIdChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onRarityChange: (value: string) => void;
  onLevelRangeChange: (range: { min: string; max: string }) => void;
  onToggleCommunityFeature: (feature: string) => void;
  onSortByChange: (value: string) => void;
  onResetFilters: () => void;
  onClose: () => void;
  resultCount: number;
}

export const MobileFilterMenu = ({
  isOpen,
  searchId,
  isSearching,
  selectedRarity,
  levelRange,
  selectedCommunityFeatures,
  sortBy,
  onSearchIdChange,
  onSearch,
  onClearSearch,
  onRarityChange,
  onLevelRangeChange,
  onToggleCommunityFeature,
  onSortByChange,
  onResetFilters,
  onClose,
  resultCount
}: MobileFilterMenuProps) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <>
      <div
        className="absolute inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 z-[101] bg-win98-face border-t-4 border-[#808080] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#000080] text-white px-4 py-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg flex items-center gap-2">
            🔍 {t('allGotchi.filtersSearch')}
          </h2>
          <button
            onClick={onClose}
            className="border-2 border-white bg-[#000060] hover:bg-[#000040] px-3 py-1 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="border-2 border-[#808080] shadow-win98-inner bg-white p-3 text-center">
            <span className="font-bold text-sm">{t('allGotchi.results')}</span>
            <span className="text-[#000080] font-bold text-xl">{resultCount}</span>
            <span className="font-bold text-sm"> {t('filterSidebar.items')}</span>
          </div>

          <div className="bg-win98-face border-2 border-[#808080] shadow-win98-outer p-3">
            <label className="text-xs font-bold block mb-2 text-[#000080]">{t('allGotchi.searchById')}</label>
            <input
              type="text"
              value={searchId}
              onChange={(e) => onSearchIdChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('allGotchi.searchPlaceholder')}
              disabled={isSearching}
              className="w-full bg-white border-2 border-[#808080] shadow-win98-inner px-2 py-2 text-xs outline-none disabled:opacity-50"
            />
            {isSearching && (
              <div className="mt-2 text-xs text-[#000080] text-center">
                {t('allGotchi.searching')}
              </div>
            )}
            {searchId && !isSearching && (
              <button
                onClick={onClearSearch}
                className="mt-2 w-full px-3 py-2 border-2 border-[#808080] shadow-win98-outer bg-win98-face hover:bg-[#b0b0b0] active:shadow-win98-inner font-bold text-xs"
              >
                {t('allGotchi.clearSearch')}
              </button>
            )}
          </div>

          <div className="bg-win98-face border-2 border-[#808080] shadow-win98-outer p-3">
            <label className="text-xs font-bold block mb-2 text-[#000080]">{t('filterSidebar.rarity')}</label>
            <Win98Select
              options={[
                { value: "", label: t('filterSidebar.allRarities') },
                { value: "0", label: t('common.rarity.common') },
                { value: "1", label: t('common.rarity.rare') },
                { value: "2", label: t('common.rarity.epic') },
                { value: "3", label: t('common.rarity.legendary') },
              ]}
              value={selectedRarity}
              onChange={onRarityChange}
            />
          </div>

          <div className="bg-win98-face border-2 border-[#808080] shadow-win98-outer p-3">
            <label className="text-xs font-bold block mb-2 text-[#000080]">{t('allGotchi.levelRange')}</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={levelRange.min}
                onChange={(e) => onLevelRangeChange({ ...levelRange, min: e.target.value })}
                placeholder={t('allGotchi.min')}
                min="1"
                max="100"
                className="flex-1 bg-white border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-xs"
              />
              <span className="text-xs text-[#808080]">-</span>
              <input
                type="number"
                value={levelRange.max}
                onChange={(e) => onLevelRangeChange({ ...levelRange, max: e.target.value })}
                placeholder={t('allGotchi.max')}
                min="1"
                max="100"
                className="flex-1 bg-white border-2 border-[#808080] shadow-win98-inner px-2 py-1 text-xs"
              />
            </div>
          </div>

          <div className="bg-win98-face border-2 border-[#808080] shadow-win98-outer p-3">
            <label className="text-xs font-bold block mb-2 text-[#000080]">{t('allGotchi.communityFeatures')}</label>
            <div className="space-y-1">
              <Win98Checkbox
                checked={selectedCommunityFeatures.has('pet')}
                onChange={() => onToggleCommunityFeature('pet')}
                label={t('allGotchi.publicPetEnabled')}
              />
            </div>
          </div>

          <div className="bg-win98-face border-2 border-[#808080] shadow-win98-outer p-3">
            <label className="text-xs font-bold block mb-2 text-[#000080]">{t('allGotchi.sortBy')}</label>
            <Win98Select
              options={[
                { value: "token_id", label: t('allGotchi.tokenId') },
                { value: "core_level", label: t('allGotchi.levelHighToLow') },
                { value: "leveling_total_exp", label: t('allGotchi.expHighToLow') },
              ]}
              value={sortBy}
              onChange={onSortByChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onResetFilters}
              className="border-2 border-[#808080] shadow-win98-outer bg-win98-face font-bold py-3 text-sm hover:bg-[#b0b0b0] active:shadow-win98-inner"
            >
              🔄 {t('allGotchi.resetAll')}
            </button>
            <button
              onClick={onClose}
              className="border-2 border-[#808080] shadow-win98-outer bg-[#008000] text-white font-bold py-3 text-sm hover:bg-[#006000] active:shadow-win98-inner"
            >
              ✓ {t('common.apply')}
            </button>
          </div>
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
};
