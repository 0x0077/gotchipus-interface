'use client'

import { useState } from "react"
import { useTranslation } from "react-i18next";
import { CustomDropdown } from "./CustomDropdown"
import { CategoryOption, RarityOption, SortOption, RARITY_COLORS } from "./types"

interface MobileFilterMenuProps {
  isOpen: boolean;
  selectedCategory: string;
  selectedRarity: string;
  sort: SortOption;
  search: string;
  resultCount: number;
  onCategoryChange: (value: string) => void;
  onRarityChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
  onClose: () => void;
}

export const MobileFilterMenu = ({
  isOpen,
  selectedCategory,
  selectedRarity,
  sort,
  search,
  resultCount,
  onCategoryChange,
  onRarityChange,
  onSortChange,
  onSearchChange,
  onResetFilters,
  onClose
}: MobileFilterMenuProps) => {
  const { t } = useTranslation();
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localRarity, setLocalRarity] = useState(selectedRarity);
  const [localSort, setLocalSort] = useState(sort);
  const [localSearch, setLocalSearch] = useState(search);

  const CATEGORY_OPTIONS: CategoryOption[] = [
    { value: 'all', label: t('filterSidebar.allCategories'), icon: '\uD83D\uDCE6' },
    { value: 'head', label: t('filterSidebar.head'), icon: '\uD83D\uDC64' },
    { value: 'hand', label: t('filterSidebar.hand'), icon: '\u270B' },
    { value: 'clothes', label: t('filterSidebar.clothes'), icon: '\uD83D\uDC55' },
    { value: 'face', label: t('filterSidebar.face'), icon: '\uD83D\uDE00' },
    { value: 'mouth', label: t('filterSidebar.mouth'), icon: '\uD83D\uDC44' }
  ];

  const RARITY_OPTIONS: RarityOption[] = [
    { value: 'all', label: t('filterSidebar.allRarities'), color: '#808080' },
    { value: 'common', label: t('common.rarity.common'), color: RARITY_COLORS.common },
    { value: 'rare', label: t('common.rarity.rare'), color: RARITY_COLORS.rare },
    { value: 'epic', label: t('common.rarity.epic'), color: RARITY_COLORS.epic },
    { value: 'legendary', label: t('common.rarity.legendary'), color: RARITY_COLORS.legendary }
  ];

  if (!isOpen) return null;

  const handleApply = () => {
    onCategoryChange(localCategory);
    onRarityChange(localRarity);
    onSortChange(localSort);
    onSearchChange(localSearch);
    onClose();
  };

  const handleReset = () => {
    setLocalCategory('all');
    setLocalRarity('all');
    setLocalSort('price-asc');
    setLocalSearch('');
    onResetFilters();
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
            \uD83D\uDD0D {t('filterSidebar.title')}
          </h2>
          <button
            onClick={onClose}
            className="border-2 border-white bg-[#000060] hover:bg-[#000040] px-3 py-1 font-bold text-sm"
          >
            \u2715
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="border-2 border-[#808080] shadow-win98-inner bg-white p-3 text-center">
            <span className="font-bold text-sm">{t('filterSidebar.results')}</span>
            <span className="text-[#000080] font-bold text-xl">{resultCount}</span>
            <span className="font-bold text-sm">{t('filterSidebar.items')}</span>
          </div>

          {/* Search */}
          <div>
            <label className="font-bold block mb-2 text-sm">{t('marketplace.search')}:</label>
            <div className="shadow-win98-inner bg-white flex items-center px-2">
              <span className="text-[#808080] text-[11px] mr-1">\uD83D\uDD0D</span>
              <input
                type="text"
                placeholder={t('marketplace.searchPlaceholder')}
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="border-none outline-none bg-transparent text-sm py-2 w-full font-[inherit]"
              />
            </div>
          </div>

          <CustomDropdown
            label={t('filterSidebar.category')}
            options={CATEGORY_OPTIONS}
            selectedValue={localCategory}
            onChange={setLocalCategory}
          />

          <CustomDropdown
            label={t('filterSidebar.rarity')}
            options={RARITY_OPTIONS}
            selectedValue={localRarity}
            onChange={setLocalRarity}
            showColorIndicator
          />

          {/* Sort */}
          <div>
            <label className="font-bold block mb-2 text-sm">{t('marketplace.sort')}:</label>
            <div className="shadow-win98-inner bg-white relative">
              <select
                value={localSort}
                onChange={e => setLocalSort(e.target.value as SortOption)}
                className="w-full bg-transparent border-none text-sm py-2 px-2 pr-5 font-[inherit] cursor-pointer outline-none appearance-none"
              >
                <option value="price-asc">{t('marketplace.sort.priceAsc')}</option>
                <option value="price-desc">{t('marketplace.sort.priceDesc')}</option>
                <option value="rarity">{t('marketplace.sort.rarity')}</option>
                <option value="latest">{t('marketplace.sort.latest')}</option>
              </select>
              <div className="absolute right-0.5 top-0.5 bottom-0.5 w-5 shadow-win98-outer bg-win98-face flex items-center justify-center pointer-events-none text-[8px]">
                \u25BC
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleReset}
              className="border-2 border-[#808080] shadow-win98-outer bg-win98-face font-bold py-3 text-sm hover:bg-[#b0b0b0] active:shadow-win98-inner"
            >
              \uD83D\uDD04 {t('filterSidebar.resetFilters')}
            </button>
            <button
              onClick={handleApply}
              className="border-2 border-[#808080] shadow-win98-outer bg-[#008000] text-white font-bold py-3 text-sm hover:bg-[#006000] active:shadow-win98-inner"
            >
              \u2713 {t('filterSidebar.applyFilters')}
            </button>
          </div>

          {(localCategory !== 'all' || localRarity !== 'all' || localSearch !== '') && (
            <div className="border-2 border-[#808080] shadow-win98-inner bg-[#d4d0c8] p-3">
              <p className="text-xs font-bold text-[#808080] mb-2">{t('filterSidebar.activeFilters')}</p>
              <div className="flex flex-wrap gap-2">
                {localSearch !== '' && (
                  <span className="bg-[#404040] text-white px-2 py-1 text-xs rounded">
                    &quot;{localSearch}&quot;
                  </span>
                )}
                {localCategory !== 'all' && (
                  <span className="bg-[#000080] text-white px-2 py-1 text-xs rounded">
                    {CATEGORY_OPTIONS.find(c => c.value === localCategory)?.icon} {CATEGORY_OPTIONS.find(c => c.value === localCategory)?.label}
                  </span>
                )}
                {localRarity !== 'all' && (
                  <span
                    className="text-white px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: RARITY_OPTIONS.find(r => r.value === localRarity)?.color }}
                  >
                    {RARITY_OPTIONS.find(r => r.value === localRarity)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
};
