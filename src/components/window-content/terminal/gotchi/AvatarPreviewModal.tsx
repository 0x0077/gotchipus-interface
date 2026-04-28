"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { WearableIndices } from "@/hooks/useSvgLayers";
import { WearableType, getWearableFileName } from "@/src/utils/wearableMapping";

interface AvatarPreviewModalProps {
  wearableIndices: WearableIndices;
  pusName: string;
  tokenId: string;
  onClose: () => void;
}

const CDN_BASE = "https://assets.gotchi.ai";
const OUTPUT_SIZE = 512;

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
    img.src = src;
  });
}

async function composePfp(
  wearableIndices: WearableIndices,
  withBackground: boolean
): Promise<{ dataUrl: string; blob: Blob }> {
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
  pfp.width = OUTPUT_SIZE;
  pfp.height = OUTPUT_SIZE;
  const pfpCtx = pfp.getContext("2d")!;
  pfpCtx.imageSmoothingEnabled = false;

  if (withBackground) {
    const bgPixel = rawCtx.getImageData(0, 0, 1, 1).data;
    pfpCtx.fillStyle = `rgb(${bgPixel[0]},${bgPixel[1]},${bgPixel[2]})`;
    pfpCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  }

  pfpCtx.drawImage(
    raw,
    CROP_X, CROP_Y, CROP_SIZE, CROP_SIZE,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  const dataUrl = pfp.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    pfp.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });

  return { dataUrl, blob };
}

const WIN98_BTN =
  "flex items-center justify-center border-2 border-win98-highlight border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-win98-face hover:bg-[#d4d0c8] active:bg-[#b0b0b0] transition-colors";
const WIN98_INSET =
  "border-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-[inset_1px_1px_0_#808080]";
const CHECKERBOARD =
  "repeating-conic-gradient(#d0d0d0 0% 25%, #f0f0f0 0% 50%)";

export function AvatarPreviewModal({
  wearableIndices,
  pusName,
  tokenId,
  onClose,
}: AvatarPreviewModalProps) {
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [noBgPreview, setNoBgPreview] = useState<string | null>(null);
  const [bgBlob, setBgBlob] = useState<Blob | null>(null);
  const [noBgBlob, setNoBgBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingType, setDownloadingType] = useState<"bg" | "nobg" | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      composePfp(wearableIndices, true),
      composePfp(wearableIndices, false),
    ]).then(([bgResult, noBgResult]) => {
      if (cancelled) return;
      setBgPreview(bgResult.dataUrl);
      setBgBlob(bgResult.blob);
      setNoBgPreview(noBgResult.dataUrl);
      setNoBgBlob(noBgResult.blob);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [wearableIndices]);

  const handleDownload = useCallback(
    (type: "bg" | "nobg") => {
      const blob = type === "bg" ? bgBlob : noBgBlob;
      if (!blob) return;
      setDownloadingType(type);

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const suffix = type === "bg" ? "bg" : "transparent";
      a.download = `${pusName.replace(/\s+/g, "_")}_${tokenId}_${OUTPUT_SIZE}x${OUTPUT_SIZE}_${suffix}.png`;
      a.click();
      URL.revokeObjectURL(a.href);

      setTimeout(() => setDownloadingType(null), 300);
    },
    [bgBlob, noBgBlob, pusName, tokenId]
  );

  const previewSize = 180;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-win98-face border-2 border-[#808080] shadow-win98-outer w-[540px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-7 flex items-center justify-between pl-3 pr-1.5 bg-uni-bg-02 text-white">
          <span className="text-base font-bold truncate select-none">
            {t('avatarModal.title', { name: pusName, id: tokenId })}
          </span>
          <button
            onClick={onClose}
            className={`${WIN98_BTN} w-[18px] h-[18px]`}
          >
            <X className="text-black w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <span className="text-xs text-[#808080]">{t('avatarModal.compositing')}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className={`${WIN98_INSET} bg-[#d4d0c8] p-3`}>
                  <span className="text-[10px] text-[#808080] font-bold uppercase block mb-2 text-center">
                    {t('avatarModal.withBackground')}
                  </span>
                  <div
                    className="mx-auto border border-[#808080] overflow-hidden mb-2"
                    style={{ width: previewSize, height: previewSize }}
                  >
                    {bgPreview && (
                      <img
                        src={bgPreview}
                        alt="PFP with background"
                        width={previewSize}
                        height={previewSize}
                        style={{ display: "block", imageRendering: "pixelated" }}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload("bg")}
                    disabled={downloadingType !== null}
                    className={`w-full py-1.5 text-xs font-bold ${WIN98_BTN} ${
                      downloadingType === "bg" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {downloadingType === "bg" ? t('avatarModal.saving') : t('avatarModal.savePng', { size: OUTPUT_SIZE })}
                  </button>
                </div>

                <div className={`${WIN98_INSET} bg-[#d4d0c8] p-3`}>
                  <span className="text-[10px] text-[#808080] font-bold uppercase block mb-2 text-center">
                    {t('avatarModal.transparent')}
                  </span>
                  <div
                    className="mx-auto border border-[#808080] overflow-hidden mb-2"
                    style={{
                      width: previewSize,
                      height: previewSize,
                      backgroundImage: CHECKERBOARD,
                      backgroundSize: "12px 12px",
                    }}
                  >
                    {noBgPreview && (
                      <img
                        src={noBgPreview}
                        alt="PFP transparent"
                        width={previewSize}
                        height={previewSize}
                        style={{ display: "block", imageRendering: "pixelated" }}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload("nobg")}
                    disabled={downloadingType !== null}
                    className={`w-full py-1.5 text-xs font-bold ${WIN98_BTN} ${
                      downloadingType === "nobg" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {downloadingType === "nobg" ? t('avatarModal.saving') : t('avatarModal.savePng', { size: OUTPUT_SIZE })}
                  </button>
                </div>
              </div>

              <div className={`${WIN98_INSET} bg-[#d4d0c8] p-3 mb-3`}>
                <span className="text-[10px] text-[#808080] font-bold uppercase block mb-2">
                  {t('avatarModal.socialPreview')}
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {[64, 40].map((size) => (
                      <div
                        key={`bg-${size}`}
                        className="rounded-full overflow-hidden border-2 border-[#808080] flex-shrink-0"
                        style={{ width: size, height: size }}
                      >
                        {bgPreview && (
                          <img
                            src={bgPreview}
                            alt="Circle"
                            width={size}
                            height={size}
                            style={{ display: "block", imageRendering: "pixelated" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="w-px h-10 bg-[#808080]" />

                  <div className="flex items-center gap-3">
                    {[64, 40].map((size) => (
                      <div
                        key={`nobg-${size}`}
                        className="rounded-full overflow-hidden border-2 border-[#808080] flex-shrink-0"
                        style={{
                          width: size,
                          height: size,
                          backgroundImage: CHECKERBOARD,
                          backgroundSize: "8px 8px",
                        }}
                      >
                        {noBgPreview && (
                          <img
                            src={noBgPreview}
                            alt="Circle transparent"
                            width={size}
                            height={size}
                            style={{ display: "block", imageRendering: "pixelated" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <span className="text-[10px] text-[#808080] leading-tight ml-auto">
                    {t('avatarModal.socialCrop')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#808080]">
                  {t('avatarModal.info', { size: OUTPUT_SIZE })}
                </span>
                <button
                  onClick={onClose}
                  className={`px-6 py-1 text-xs ${WIN98_BTN}`}
                >
                  {t('common.close')}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
