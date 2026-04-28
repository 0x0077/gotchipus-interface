'use client'

import useResponsive from "@/hooks/useResponsive"
import { useTranslation } from "react-i18next"
import { CustomDropdown } from "./CustomDropdown"
import { CategoryOption, RarityOption, SortOption, RARITY_COLORS } from "./types"

interface FilterSidebarProps {
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
}

export const FilterSidebar = ({
  selectedCategory,
  selectedRarity,
  sort,
  search,
  resultCount,
  onCategoryChange,
  onRarityChange,
  onSortChange,
  onSearchChange,
  onResetFilters
}: FilterSidebarProps) => {
  const isMobile = useResponsive();
  const { t } = useTranslation();

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

  const hasActiveFilters = selectedCategory !== 'all' || selectedRarity !== 'all' || search !== '';

  return (
    <div className={`border-2 border-[#808080] shadow-win98-outer bg-[#d4d0c8] ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className="mb-4 pb-3 border-b-2 border-[#808080]">
        <h2 className={`font-bold text-[#000080] ${isMobile ? 'text-base' : 'text-lg'}`}>
          {t('filterSidebar.title')}
        </h2>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="font-bold block mb-2 text-sm">
          {t('marketplace.search')}:
        </label>
        <div className="shadow-win98-inner bg-white flex items-center px-1.5">
          <span className="text-[#808080] text-[11px] mr-1">\uD83D\uDD0D</span>
          <input
            type="text"
            placeholder={t('marketplace.searchPlaceholder')}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="border-none outline-none bg-transparent text-[11px] py-1.5 w-full font-[inherit]"
          />
        </div>
      </div>

      <CustomDropdown
        label={t('filterSidebar.category')}
        options={CATEGORY_OPTIONS}
        selectedValue={selectedCategory}
        onChange={onCategoryChange}
      />

      <CustomDropdown
        label={t('filterSidebar.rarity')}
        options={RARITY_OPTIONS}
        selectedValue={selectedRarity}
        onChange={onRarityChange}
        showColorIndicator
      />

      {/* Sort */}
      <div className="mb-4">
        <label className="font-bold block mb-2 text-sm">
          {t('marketplace.sort')}:
        </label>
        <div className="shadow-win98-inner bg-white relative">
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="w-full bg-transparent border-none text-[11px] py-1.5 px-2 pr-5 font-[inherit] cursor-pointer outline-none appearance-none"
          >
            <option value="price-asc">{t('marketplace.sort.priceAsc')}</option>
            <option value="price-desc">{t('marketplace.sort.priceDesc')}</option>
            <option value="rarity">{t('marketplace.sort.rarity')}</option>
            <option value="latest">{t('marketplace.sort.latest')}</option>
          </select>
          <div className="absolute right-0.5 top-0.5 bottom-0.5 w-4 shadow-win98-outer bg-win98-face flex items-center justify-center pointer-events-none text-[7px]">
            \u25BC
          </div>
        </div>
      </div>

      <div className={`py-3 border-t-2 border-b-2 border-[#808080] ${isMobile ? 'text-xs' : 'text-sm'} bg-white`}>
        <div className="text-center">
          <span className="font-bold">{t('filterSidebar.results')}</span>
          <span className="text-[#000080] font-bold text-lg">{resultCount}</span>
          <span className="font-bold">{t('filterSidebar.items')}</span>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className={`w-full mt-4 border-2 border-[#808080] shadow-win98-outer bg-win98-face font-bold hover:bg-[#b0b0b0] active:shadow-win98-inner
            ${isMobile ? 'py-2 text-sm' : 'py-2.5 text-base'}`}
        >
          {t('filterSidebar.resetFilters')}
        </button>
      )}
    </div>
  );
};
