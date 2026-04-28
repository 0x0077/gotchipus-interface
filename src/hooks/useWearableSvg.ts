import { useMemo } from 'react';
import { WearableIndices } from '@/hooks/useSvgLayers';
import { getWearablePngUrl, type WearableType } from '@/src/utils/wearableMapping';

type LayerType = {
  type: WearableType;
  indexKey: keyof WearableIndices;
};

const LAYER_ORDER: LayerType[] = [
  { type: 'bodys', indexKey: 'bodyIndex' },
  { type: 'eyes', indexKey: 'eyeIndex' },
  { type: 'mouths', indexKey: 'mouthIndex' },
  { type: 'clothes', indexKey: 'clothesIndex' },
  { type: 'faces', indexKey: 'faceIndex' },
  { type: 'heads', indexKey: 'headIndex' },
  { type: 'hands', indexKey: 'handIndex' },
];

interface UseWearableSvgResult {
  layerUrls: (string | null)[];
  backgroundUrl: string | null;
  isLoading: boolean;
}

/**
 * Hook that computes wearable PNG layer URLs for gotchi preview rendering.
 * Body automatically switches between body_close/body_open based on hand equipment.
 */
export function useWearableSvg(wearableIndices: WearableIndices): UseWearableSvgResult {
  const result = useMemo(() => {
    const hasHand = wearableIndices.handIndex !== 0;

    const layerUrls = LAYER_ORDER.map(({ type, indexKey }) => {
      const idx = wearableIndices[indexKey];
      if (idx === 0) return null;

      const bodyVariant = type === 'bodys'
        ? (hasHand ? 'body_open' : 'body_close')
        : 'body_close';
      return getWearablePngUrl(type, idx - 1, bodyVariant as 'body_close' | 'body_open');
    });

    const backgroundUrl = wearableIndices.backgroundIndex > 0
      ? getWearablePngUrl('backgrounds', wearableIndices.backgroundIndex - 1)
      : null;

    return { layerUrls, backgroundUrl, isLoading: false };
  }, [
    wearableIndices.backgroundIndex,
    wearableIndices.bodyIndex,
    wearableIndices.clothesIndex,
    wearableIndices.handIndex,
    wearableIndices.eyeIndex,
    wearableIndices.faceIndex,
    wearableIndices.mouthIndex,
    wearableIndices.headIndex,
  ]);

  return result;
}
