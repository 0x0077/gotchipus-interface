import { BODY_BYTES32, EYE_BYTES32, HAND_BYTES32, HEAD_BYTES32, CLOTHES_BYTES32, BG_BYTES32, MOUTH_BYTES32, FACE_BYTES32 } from '@/lib/constant';

export const WEARABLE_CONFIG = {
  background: { key: BG_BYTES32, zIndex: 0, offset: 0, name: "background" },
  body: { key: BODY_BYTES32, zIndex: 1, offset: 16, name: "body" },
  eye: { key: EYE_BYTES32, zIndex: 2, offset: 24, name: "eye" },
  hand: { key: HAND_BYTES32, zIndex: 3, offset: 27, name: "hand" },
  head: { key: HEAD_BYTES32, zIndex: 4, offset: 46, name: "head" },
  clothes: { key: CLOTHES_BYTES32, zIndex: 5, offset: 63, name: "clothes" },
  face: { key: FACE_BYTES32, zIndex: 6, offset: 72, name: "face" },
  mouth: { key: MOUTH_BYTES32, zIndex: 7, offset: 79, name: "mouth" },
};

export type WearableCategoryKey = string;
export const KEY_TO_CONFIG_MAP = Object.values(WEARABLE_CONFIG).reduce((acc, config) => {
    acc[config.key as WearableCategoryKey] = config;
    return acc;
}, {} as Record<WearableCategoryKey, typeof WEARABLE_CONFIG[keyof typeof WEARABLE_CONFIG]>);

export const TOKEN_ID_TO_LOCAL_INDEX: Record<string, Record<number, number>> = {
  'background': {
    0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14, 14: 15, 15: 16
  },
  'body': {
    16: 1, 17: 2, 18: 3, 19: 4, 20: 5, 21: 6, 22: 7, 23: 8
  },
  'eye': {
    24: 1, 25: 2, 26: 3, 27: 4, 28: 5, 29: 6, 30: 7, 31: 8
  },
  'hand': {
    32: 1, 33: 2, 34: 3, 35: 4, 36: 5, 37: 6, 38: 7, 39: 8, 40: 9, 41: 10, 42: 11, 43: 12, 44: 13, 45: 14
  },
  'head': {
    46: 1, 47: 2, 48: 3, 49: 4, 50: 5, 51: 6, 52: 7, 53: 8, 54: 9, 55: 10, 56: 11, 57: 12, 58: 13, 59: 14, 60: 15, 61: 16, 62: 17
  },
  'clothes': {
    63: 1, 64: 2, 65: 3, 66: 4, 67: 5, 68: 6, 69: 7, 70: 8, 71: 9
  },
  'face': {
    72: 1, 73: 2, 74: 3, 75: 4, 76: 5, 77: 6, 78: 7
  },
  'mouth': {
    79: 1, 80: 2, 81: 3, 82: 4, 83: 5, 84: 6
  }
};

export const TOKEN_ID_TO_IMAGE: Record<number, string> = {
  // Backgrounds (0-15)
  0: '/wearables/backgrounds/Beach Lighthouse.png',
  1: '/wearables/backgrounds/Big Ben.png',
  2: '/wearables/backgrounds/Burj Khalifa.png',
  3: '/wearables/backgrounds/Christ The Redeemer.png',
  4: '/wearables/backgrounds/Diamond Head Mountain.png',
  5: '/wearables/backgrounds/Eiffel Tower.png',
  6: '/wearables/backgrounds/Grand Palace.png',
  7: '/wearables/backgrounds/Green.png',
  8: '/wearables/backgrounds/Hollywood Sign.png',
  9: '/wearables/backgrounds/Oriental Pearl Tower.png',
  10: '/wearables/backgrounds/Pure Gold.png',
  11: '/wearables/backgrounds/Pyramids of Egypt.png',
  12: '/wearables/backgrounds/Red.png',
  13: '/wearables/backgrounds/St. Basil\'s Cathedral.png',
  14: '/wearables/backgrounds/Statue of Liberty.png',
  15: '/wearables/backgrounds/Tokyo Tower.png',
  
  // Bodies (16-23)
  16: '/wearables/bodys/Aqua Spirit.png',
  17: '/wearables/bodys/Blazing Flame.png',
  18: '/wearables/bodys/Candy Pink.png',
  19: '/wearables/bodys/Crystal.png',
  20: '/wearables/bodys/Deep Sea.png',
  21: '/wearables/bodys/Golden Glow.png',
  22: '/wearables/bodys/Ink Shadow.png',
  23: '/wearables/bodys/Orca Wrap.png',

  // Eyes (24-31)
  24: '/wearables/eyes/Bitcoin Eyes.png',
  25: '/wearables/eyes/Curved Smiling Closed Eyes.png',
  26: '/wearables/eyes/Dogecoin Logo Eyes.png',
  27: '/wearables/eyes/Dollar Sign Eyes.png',
  28: '/wearables/eyes/Normal.png',
  29: '/wearables/eyes/Pharos Logo Eyes.png',
  30: '/wearables/eyes/Single Eye.png',
  31: '/wearables/eyes/Yellow Lightning Eyes.png',

  // Hands (32-45)
  32: '/wearables/hands/Drink Bottle.png',
  33: '/wearables/hands/Fire.png',
  34: '/wearables/hands/Gold Coin Pouch.png',
  35: '/wearables/hands/Ink Bottle.png',
  36: '/wearables/hands/Lighthouse Model.png',
  37: '/wearables/hands/Lightning.png',
  38: '/wearables/hands/Magic Potion Bottle.png',
  39: '/wearables/hands/Magic Scroll.png',
  40: '/wearables/hands/Magic Wand.png',
  41: '/wearables/hands/Miner\'s Pickaxe.png',
  42: '/wearables/hands/Pharos Coin.png',
  43: '/wearables/hands/Sea Urchin.png',
  44: '/wearables/hands/Spray Paint Can.png',
  45: '/wearables/hands/Trident.png',

  // Heads (46-62)
  46: '/wearables/heads/Aviator Hat.png',
  47: '/wearables/heads/Captain Hat.png',
  48: '/wearables/heads/Cowboy Hat.png',
  49: '/wearables/heads/Crocodile Hat.png',
  50: '/wearables/heads/Crown.png',
  51: '/wearables/heads/Dogecoin Hat.png',
  52: '/wearables/heads/Frog Hat.png',
  53: '/wearables/heads/Miner Helmet.png',
  54: '/wearables/heads/Orca Hat (Full).png',
  55: '/wearables/heads/Panda Hat.png',
  56: '/wearables/heads/Pirate Bandana.png',
  57: '/wearables/heads/Polar Bear Hat.png',
  58: '/wearables/heads/Sea Lion Hat.png',
  59: '/wearables/heads/Shark Hat.png',
  60: '/wearables/heads/Straw Hat.png',
  61: '/wearables/heads/Unicorn Hat.png',
  62: '/wearables/heads/Wizard Hat.png',

  // Clothes (63-71)
  63: '/wearables/clothes/Camouflage Outfit.png',
  64: '/wearables/clothes/Cloak.png',
  65: '/wearables/clothes/Explorer Jacket.png',
  66: '/wearables/clothes/Golden Robe.png',
  67: '/wearables/clothes/Knight Armor.png',
  68: '/wearables/clothes/Miner Outfit.png',
  69: '/wearables/clothes/Royal Cape.png',
  70: '/wearables/clothes/Tactical Vest.png',
  71: '/wearables/clothes/Wizard Robe.png',

  // Faces (72-78)
  72: '/wearables/faces/Diving Googles.png',
  73: '/wearables/faces/Gas Mask.png',
  74: '/wearables/faces/Iron Man Mask.png',
  75: '/wearables/faces/LED GMOTCHI.png',
  76: '/wearables/faces/LED GOTCHI.png',
  77: '/wearables/faces/LED PHAROS.png',
  78: '/wearables/faces/Tactical Face Mask.png',

  // Mouths (79-84) 
  79: '/wearables/mouths/Biting a Golden Key.png',
  80: '/wearables/mouths/Eating a Fish.png',
  81: '/wearables/mouths/Eating a Starfish.png',
  82: '/wearables/mouths/Hidden.png',
  83: '/wearables/mouths/HODL Tape.png',
  84: '/wearables/mouths/Smile.png',
};
