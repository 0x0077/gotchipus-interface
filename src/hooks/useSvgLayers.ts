import { useMemo } from 'react';
import { useContractRead } from '@/hooks/useContract';
import { BG_BYTES32, BODY_BYTES32, EYE_BYTES32, HAND_BYTES32, HEAD_BYTES32, CLOTHES_BYTES32, FACE_BYTES32, MOUTH_BYTES32 } from '@/lib/constant';
import { EquipWearableType } from '@/lib/types';
import { KEY_TO_CONFIG_MAP, WearableCategoryKey, TOKEN_ID_TO_LOCAL_INDEX } from '@/components/gotchiSvg/config';

export interface SvgLayer {
  svgString: string;
  zIndex: number;
  svgName: string;
}

export interface WearableIndices {
  backgroundIndex: number;
  bodyIndex: number;
  eyeIndex: number;
  handIndex: number;
  headIndex: number;
  clothesIndex: number;
  faceIndex: number;
  mouthIndex: number;
}

const DEFAULT_INDICES: WearableIndices = {
  backgroundIndex: 0,
  bodyIndex: 0,
  eyeIndex: 0,
  handIndex: 0,
  headIndex: 0,
  clothesIndex: 0,
  faceIndex: 0,
  mouthIndex: 0,
};

export const useSvgLayers = (tokenId: string) => {
  const { data: wearableTypeInfos, isLoading, error } = useContractRead(
    "getAllEquipWearableType",
    [tokenId]
  );

  const wearableIndices = useMemo<WearableIndices>(() => {
    if (!wearableTypeInfos || !Array.isArray(wearableTypeInfos)) return DEFAULT_INDICES;

    const newIndices: WearableIndices = { ...DEFAULT_INDICES };

    (wearableTypeInfos as EquipWearableType[]).forEach(info => {
      if (!info.equiped || Number(info.wearableId) === 0) return;

      const config = KEY_TO_CONFIG_MAP[info.wearableType as WearableCategoryKey];
      if (!config) return;

      const categoryMapping = TOKEN_ID_TO_LOCAL_INDEX[config.name];
      if (!categoryMapping) return;

      const tokenId = Number(info.wearableId);
      const localIndex = categoryMapping[tokenId];
      if (localIndex === undefined) return;

      switch (config.key) {
        case BG_BYTES32:      newIndices.backgroundIndex = localIndex; break;
        case BODY_BYTES32:    newIndices.bodyIndex = localIndex; break;
        case EYE_BYTES32:     newIndices.eyeIndex = localIndex; break;
        case HAND_BYTES32:    newIndices.handIndex = localIndex; break;
        case HEAD_BYTES32:    newIndices.headIndex = localIndex; break;
        case CLOTHES_BYTES32: newIndices.clothesIndex = localIndex; break;
        case FACE_BYTES32:    newIndices.faceIndex = localIndex; break;
        case MOUTH_BYTES32:   newIndices.mouthIndex = localIndex; break;
      }
    });

    return newIndices;
  }, [wearableTypeInfos]);

  return {
    wearableIndices,
    isLoading,
    error
  };
};
