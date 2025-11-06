export const wearableMapping = {
  backgrounds: [
    "Beach Lighthouse.png",
    "Big Ben.png",
    "Burj Khalifa.png",
    "Christ The Redeemer.png",
    "Diamond Head Mountain.png",
    "Eiffel Tower.png",
    "Grand Palace.png",
    "Green.png",
    "Hollywood Sign.png",
    "Oriental Pearl Tower.png",
    "Pure Gold.png",
    "Pyramids of Egypt.png",
    "Red.png",
    "St. Basil's Cathedral.png",
    "Statue of Liberty.png",
    "Tokyo Tower.png"
  ],
  bodys: [
    "Aqua Spirit.png",
    "Blazing Flame.png",
    "Candy Pink.png",
    "Crystal.png",
    "Deep Sea.png",
    "Golden Glow.png",
    "Ink Shadow.png",
    "Orca Wrap.png"
  ],
  eyes: [
    "Bitcoin Eyes.png",
    "Curved Smiling Closed Eyes.png",
    "Dogecoin Logo Eyes.png",
    "Dollar Sign Eyes.png",
    "Normal.png",
    "Pharos Logo Eyes.png",
    "Single Eye.png",
    "Yellow Lightning Eyes.png"
  ]
};

/**
 * Get wearable image path
 * 
 * Note: We return the original path without URL encoding.
 * Next.js Image component and browsers will automatically handle URL encoding when needed.
 * The middleware will handle any URL-encoded direct access requests.
 */
export const getWearableImagePath = (type: 'backgrounds' | 'bodys' | 'eyes', index: number): string => {
  const wearables = wearableMapping[type];
  if (index >= 0 && index < wearables.length) {
    return `/wearables/${type}/${wearables[index]}`;
  }
  return `/wearables/${type}/${wearables[0]}`;
};