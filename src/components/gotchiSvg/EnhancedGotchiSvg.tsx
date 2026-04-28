/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { WearableIndices } from '@/hooks/useSvgLayers';
import { useWearableSvg } from '@/hooks/useWearableSvg';

interface EnhancedGotchiSvgProps {
  wearableIndices: WearableIndices;
  showBackground?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const imgStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  imageRendering: 'pixelated',
};

const EnhancedGotchiSvg: React.FC<EnhancedGotchiSvgProps> = ({
  wearableIndices,
  showBackground = false,
  width,
  height,
  className,
  style,
}) => {
  const { layerUrls, backgroundUrl } = useWearableSvg(wearableIndices);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...(width != null ? { width } : {}),
        ...(height != null ? { height } : {}),
        ...style,
      }}
    >
      {showBackground && backgroundUrl && (
        <img src={backgroundUrl} alt="" style={imgStyle} />
      )}
      {layerUrls.map((url, i) =>
        url ? <img key={i} src={url} alt="" style={imgStyle} /> : null
      )}
    </div>
  );
};

export default EnhancedGotchiSvg;
