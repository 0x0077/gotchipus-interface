/**
 * Generate on-chain-identical SVG preview for .chi names.
 * Mirrors LibChiSvg.sol exactly so the preview matches the NFT metadata image.
 */

function getFontSize(nameLen: number): string {
  if (nameLen <= 3) return "64";
  if (nameLen === 4) return "56";
  if (nameLen === 5) return "52";
  if (nameLen === 6) return "48";
  if (nameLen <= 8) return "42";
  if (nameLen <= 10) return "36";
  if (nameLen <= 14) return "30";
  if (nameLen <= 20) return "24";
  return "18";
}

export function generateChiNameSvg(name: string): string {
  const fs = getFontSize(name.length);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">',
    '<rect width="500" height="500" fill="#060C16"/>',
    '<text x="472" y="480" text-anchor="end" font-family="monospace" font-size="14" font-weight="bold">',
    '<tspan fill="rgba(255,255,255,0.06)">{</tspan>',
    '<tspan fill="rgba(77,232,194,0.18)">.</tspan>',
    '<tspan fill="rgba(77,232,194,0.18)">chi</tspan>',
    '<tspan fill="rgba(255,255,255,0.06)">}</tspan>',
    "</text>",
    '<text x="250" y="255" text-anchor="middle" font-family="monospace" font-weight="bold" letter-spacing="-1">',
    `<tspan font-size="${fs}" fill="rgba(255,255,255,0.9)">${name}</tspan>`,
    `<tspan font-size="${fs}" fill="#4DE8C2">.chi</tspan>`,
    "</text></svg>",
  ].join("");
}

export function chiNameSvgDataUri(name: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(generateChiNameSvg(name))}`;
}
