/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { WearableIndices } from '@/hooks/useSvgLayers';
import { useWearableSvg } from '@/hooks/useWearableSvg';

interface GotchiSvgProps {
  bgIndex?: number;
  bodyIndex?: number;
  eyeIndex?: number;
  wearableIndices?: WearableIndices;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
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

const imgStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  imageRendering: 'pixelated',
};

const GotchiSvg: React.FC<GotchiSvgProps> = ({
  bgIndex,
  bodyIndex,
  eyeIndex,
  wearableIndices,
  width,
  height,
  className,
  style,
}) => {
  const indices: WearableIndices = {
    ...DEFAULT_INDICES,
    backgroundIndex: bgIndex !== undefined ? bgIndex + 1 : (wearableIndices?.backgroundIndex ?? 0),
    bodyIndex: bodyIndex !== undefined ? bodyIndex + 1 : (wearableIndices?.bodyIndex ?? 0),
    eyeIndex: eyeIndex !== undefined ? eyeIndex + 1 : (wearableIndices?.eyeIndex ?? 0),
  };

  const { layerUrls, backgroundUrl } = useWearableSvg(indices);

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
      {backgroundUrl && (
        <img src={backgroundUrl} alt="" style={imgStyle} />
      )}
      {layerUrls.map((url, i) =>
        url ? <img key={i} src={url} alt="" style={imgStyle} /> : null
      )}
    </div>
  );
};

export default GotchiSvg;
