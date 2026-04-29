import { WearableIndices } from "@/hooks/useSvgLayers";
import { WearableType, getWearableFileName } from "@/src/utils/wearableMapping";

const CDN_BASE = "https://assets.gotchi.ai";

const CROP_X = 14;
const CROP_Y = 0;
const CROP_SIZE = 100;

const R2_DIRECTORY: Record<WearableType, string> = {
  backgrounds: "backgrounds",
  bodys: "body_close",
  eyes: "eyes",
  hands: "hands",
  heads: "heads",
  clothes: "clothes",
  faces: "faces",
  mouths: "mouths",
};

const LAYER_ORDER: { type: WearableType; indexKey: keyof WearableIndices }[] = [
  { type: "backgrounds", indexKey: "backgroundIndex" },
  { type: "bodys", indexKey: "bodyIndex" },
  { type: "eyes", indexKey: "eyeIndex" },
  { type: "mouths", indexKey: "mouthIndex" },
  { type: "clothes", indexKey: "clothesIndex" },
  { type: "faces", indexKey: "faceIndex" },
  { type: "heads", indexKey: "headIndex" },
  { type: "hands", indexKey: "handIndex" },
];

function getLayerCdnUrl(type: WearableType, localIndex: number, bodyVariant?: 'body_close' | 'body_open'): string | null {
  if (localIndex === 0) return null;
  const fileId = getWearableFileName(type, localIndex - 1);
  let dir = R2_DIRECTORY[type];
  let actualFileId = fileId;
  if (type === 'bodys' && bodyVariant === 'body_open') {
    dir = 'body_open';
    actualFileId = fileId.replace('body_close', 'body_open');
  }
  return `${CDN_BASE}/png/${dir}/${actualFileId}.png`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src + (src.includes("?") ? "&" : "?") + "_cors=1";
  });
}

export async function composePfp(
  wearableIndices: WearableIndices,
  outputSize: number,
  withBackground = true
): Promise<string> {
  const hasHand = wearableIndices.handIndex !== 0;
  const layerUrls = LAYER_ORDER.map(({ type, indexKey }) => {
    if (type === "backgrounds" && !withBackground) return null;
    if (type === "bodys") {
      return getLayerCdnUrl(type, wearableIndices[indexKey], hasHand ? 'body_open' : 'body_close');
    }
    return getLayerCdnUrl(type, wearableIndices[indexKey]);
  });

  const images = await Promise.all(
    layerUrls.map((url) => (url ? loadImage(url) : Promise.resolve(null)))
  );

  const firstImg = images.find((img) => img !== null);
  const sourceSize = firstImg ? firstImg.naturalWidth : 32;

  const raw = document.createElement("canvas");
  raw.width = sourceSize;
  raw.height = sourceSize;
  const rawCtx = raw.getContext("2d")!;

  for (const img of images) {
    if (img) rawCtx.drawImage(img, 0, 0);
  }

  const pfp = document.createElement("canvas");
  pfp.width = outputSize;
  pfp.height = outputSize;
  const pfpCtx = pfp.getContext("2d")!;
  pfpCtx.imageSmoothingEnabled = false;

  if (withBackground) {
    const bgPixel = rawCtx.getImageData(0, 0, 1, 1).data;
    pfpCtx.fillStyle = `rgb(${bgPixel[0]},${bgPixel[1]},${bgPixel[2]})`;
    pfpCtx.fillRect(0, 0, outputSize, outputSize);
  }

  pfpCtx.drawImage(
    raw,
    CROP_X, CROP_Y, CROP_SIZE, CROP_SIZE,
    0, 0, outputSize, outputSize
  );

  return pfp.toDataURL("image/png");
}
