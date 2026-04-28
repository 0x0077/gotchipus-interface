import { BODY_BYTES32, EYE_BYTES32, HAND_BYTES32, HEAD_BYTES32, CLOTHES_BYTES32, BG_BYTES32, MOUTH_BYTES32, FACE_BYTES32 } from '@/lib/constant';
import { getWearableImagePath, wearableNameMapping, WEARABLE_TYPE_OFFSETS, TOTAL_WEARABLES, type WearableType } from '@/src/utils/wearableMapping';

export { TOTAL_WEARABLES };

export const WEARABLE_CONFIG = {
  background: { key: BG_BYTES32, zIndex: 0, offset: WEARABLE_TYPE_OFFSETS.backgrounds, name: "background" },
  body: { key: BODY_BYTES32, zIndex: 1, offset: WEARABLE_TYPE_OFFSETS.bodys, name: "body" },
  eye: { key: EYE_BYTES32, zIndex: 2, offset: WEARABLE_TYPE_OFFSETS.eyes, name: "eye" },
  hand: { key: HAND_BYTES32, zIndex: 3, offset: WEARABLE_TYPE_OFFSETS.hands, name: "hand" },
  head: { key: HEAD_BYTES32, zIndex: 4, offset: WEARABLE_TYPE_OFFSETS.heads, name: "head" },
  clothes: { key: CLOTHES_BYTES32, zIndex: 5, offset: WEARABLE_TYPE_OFFSETS.clothes, name: "clothes" },
  face: { key: FACE_BYTES32, zIndex: 6, offset: WEARABLE_TYPE_OFFSETS.faces, name: "face" },
  mouth: { key: MOUTH_BYTES32, zIndex: 7, offset: WEARABLE_TYPE_OFFSETS.mouths, name: "mouth" },
};

export type WearableCategoryKey = string;
export const KEY_TO_CONFIG_MAP = Object.values(WEARABLE_CONFIG).reduce((acc, config) => {
    acc[config.key as WearableCategoryKey] = config;
    return acc;
}, {} as Record<WearableCategoryKey, typeof WEARABLE_CONFIG[keyof typeof WEARABLE_CONFIG]>);

// Map config name (singular) to WearableType (plural/R2 directory name)
const CONFIG_NAME_TO_TYPE: Record<string, WearableType> = {
  background: 'backgrounds',
  body: 'bodys',
  eye: 'eyes',
  hand: 'hands',
  head: 'heads',
  clothes: 'clothes',
  face: 'faces',
  mouth: 'mouths',
};

// Dynamically generate TOKEN_ID_TO_LOCAL_INDEX from WEARABLE_CONFIG + wearableNameMapping
const generateTokenIdToLocalIndex = (): Record<string, Record<number, number>> => {
  const result: Record<string, Record<number, number>> = {};
  for (const config of Object.values(WEARABLE_CONFIG)) {
    const wType = CONFIG_NAME_TO_TYPE[config.name];
    const count = wearableNameMapping[wType].length;
    const map: Record<number, number> = {};
    for (let i = 0; i < count; i++) {
      map[config.offset + i] = i + 1; // 1-based local index
    }
    result[config.name] = map;
  }
  return result;
};

export const TOKEN_ID_TO_LOCAL_INDEX: Record<string, Record<number, number>> = generateTokenIdToLocalIndex();

// Dynamically generate TOKEN_ID_TO_IMAGE from WEARABLE_CONFIG
const generateTokenIdToImage = (): Record<number, string> => {
  const mapping: Record<number, string> = {};
  for (const config of Object.values(WEARABLE_CONFIG)) {
    const wType = CONFIG_NAME_TO_TYPE[config.name];
    const count = wearableNameMapping[wType].length;
    for (let i = 0; i < count; i++) {
      mapping[config.offset + i] = getWearableImagePath(wType, i);
    }
  }
  return mapping;
};

export const TOKEN_ID_TO_IMAGE: Record<number, string> = generateTokenIdToImage();
