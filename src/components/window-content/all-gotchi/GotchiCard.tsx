"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import EnhancedGotchiSvg from "@/components/gotchiSvg/EnhancedGotchiSvg";
import { getWearablePngUrl } from "@/src/utils/wearableMapping";
import { GotchiMetadata } from "@/lib/types";
import { useAllEquipLayers } from "@/hooks/useAllEquipLayers";

interface GotchiCardProps {
  metadata: GotchiMetadata;
  onClick?: (metadata: GotchiMetadata) => void;
}

const RARITY_KEYS: Record<number, string> = {
  0: "common",
  1: "rare",
  2: "epic",
  3: "legendary",
};

const RARITY_COLORS: Record<number, string> = {
  0: "bg-[#808080] text-white",
  1: "bg-[#0066cc] text-white",
  2: "bg-[#9933cc] text-white",
  3: "bg-[#ff9900] text-white",
};

const GotchiCard: React.FC<GotchiCardProps> = ({ metadata, onClick }) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (onClick) {
      onClick(metadata);
    }
  };

  const isSummoned = metadata.status !== 0;
  const wearableIndices = useAllEquipLayers(metadata.all_equip);

  const bgUrl = wearableIndices.backgroundIndex > 0
    ? getWearablePngUrl('backgrounds', wearableIndices.backgroundIndex - 1)
    : null;
  const backgroundStyle = bgUrl ? { backgroundImage: `url("${bgUrl}")` } : {};

  const currentExp = metadata.currentExp || 0;
  const calculatedLevel = Math.floor(Number(currentExp) / 100);

  const rarity = metadata.rarity ?? 0;
  const rarityKey = RARITY_KEYS[rarity] || "common";
  const rarityName = t(`common.rarity.${rarityKey}`);
  const rarityColor = RARITY_COLORS[rarity] || "bg-[#808080] text-white";

  return (
    <motion.div
      className="bg-win98-face flex flex-col items-center justify-center cursor-pointer border-2 border-[#808080] shadow-win98-outer rounded-none p-2 hover:border-dashed hover:border-[#000080] transition-all"
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-full flex justify-between items-center mb-1">
        {isSummoned ? (
          <>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold bg-[#000080] text-white px-1">
                Lv.{calculatedLevel}
              </span>
              {metadata.locked && (
                <span className="text-[10px]">🔒</span>
              )}
            </div>
            <span className={`text-[10px] font-bold px-1 ${rarityColor}`}>
              {rarityName}
            </span>
          </>
        ) : (
          <span className="text-[10px] font-bold bg-[#808080] text-white px-1">
            {t('allGotchi.notSummoned')}
          </span>
        )}
      </div>

      <div
        className="relative w-full aspect-square mb-2 bg-white/30 border-2 border-[#808080] shadow-win98-inner p-2 bg-cover bg-center"
        style={isSummoned ? backgroundStyle : {}}
      >
        {!isSummoned ? (
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src="/beacon-summon.gif"
              alt="Unsummoned Gotchipus"
              width={100}
              height={100}
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <EnhancedGotchiSvg
            wearableIndices={wearableIndices}
            className="w-full h-full"
          />
        )}
      </div>

      <div className="text-center text-xs font-bold text-[#000080] px-1 py-0.5 bg-white/30 border border-[#808080] shadow-win98-inner w-full truncate">
        {metadata.name || `Gotchipus #${metadata.token_id}`}
      </div>
    </motion.div>
  );
};

export default GotchiCard;
