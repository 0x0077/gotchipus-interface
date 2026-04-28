import { useMemo } from 'react';
import { GotchiMetadata } from '@/lib/types';
import { RARITY_NAMES, RARITY_COLORS, FACTION_NAMES } from '../constants';
import { calculateLevel, calculateAge } from '../utils';
import { useContractRead } from '@/hooks/useContract';

export const useGotchiComputedData = (metadata: GotchiMetadata) => {
  const currentExp = metadata.currentExp || 0;
  const calculatedLevel = useMemo(() => calculateLevel(currentExp), [currentExp]);

  const rarity = metadata.rarity ?? 0;
  const rarityName = RARITY_NAMES[rarity] || "Common";
  const rarityColor = RARITY_COLORS[rarity] || "bg-[#808080] text-white";

  const primaryFaction = metadata.faction ?? 0;
  const factionName = FACTION_NAMES[primaryFaction] || "COMBAT";

  const age = useMemo(() => calculateAge(metadata.birth_time), [metadata.birth_time]);

  const tokenId = metadata.token_id;
  const { data: rawAttrs } = useContractRead("getAttributes", [tokenId], { enabled: tokenId != null });

  const attributes = useMemo(() => {
    const vals = rawAttrs
      ? (rawAttrs as bigint[]).map((v) => Math.round(Number(v) / 100))
      : [0, 0, 0, 0, 0, 0];
    // Order from contract: strength, mind, defense, vitality, agility, luck
    return [
      { name: "STR", value: vals[0], icon: "strength" },
      { name: "INT", value: vals[1], icon: "mind" },
      { name: "DEF", value: vals[2], icon: "defense" },
      { name: "VIT", value: vals[3], icon: "vitality" },
      { name: "AGI", value: vals[4], icon: "agility" },
      { name: "LUK", value: vals[5], icon: "luck" },
    ];
  }, [rawAttrs]);

  return {
    currentExp,
    calculatedLevel,
    rarity,
    rarityName,
    rarityColor,
    primaryFaction,
    factionName,
    age,
    attributes,
  };
};
