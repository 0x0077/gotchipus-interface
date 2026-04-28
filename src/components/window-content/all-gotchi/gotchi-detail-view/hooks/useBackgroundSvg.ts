import { useMemo } from 'react';
import { getWearablePngUrl } from '@/src/utils/wearableMapping';

export const useBackgroundSvg = (backgroundIndex: number) => {
  const backgroundSvgUrl = useMemo(() => {
    if (backgroundIndex <= 0) return null;
    return getWearablePngUrl('backgrounds', backgroundIndex - 1);
  }, [backgroundIndex]);

  const backgroundStyle = useMemo(() => {
    if (!backgroundSvgUrl) return {};
    return {
      backgroundImage: `url("${backgroundSvgUrl}")`,
    };
  }, [backgroundSvgUrl]);

  return { backgroundSvg: backgroundSvgUrl, backgroundStyle };
};
