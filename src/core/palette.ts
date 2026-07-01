export type RGB = [number, number, number];

export function rgbToHex([r, g, b]: RGB): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function rgbaToHex(color: RGB, alpha: number): string {
  const a = Math.round(alpha * 255);
  return `${rgbToHex(color)}${a.toString(16).padStart(2, "0")}`;
}

export function hexToRgba(hex: string): { color: RGB; alpha: number } {
  const color = hexToRgb(hex);
  const alpha = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
  return { color, alpha };
}

export const FIXED_PALETTE: RGB[] = [
  [249, 255, 254],
  [249, 128, 29],
  [199, 78, 189],
  [58, 179, 218],
  [254, 216, 61],
  [128, 199, 31],
  [243, 139, 170],
  [71, 79, 82],
  [157, 157, 151],
  [22, 156, 156],
  [137, 50, 184],
  [60, 68, 170],
  [131, 84, 50],
  [94, 124, 22],
  [176, 46, 38],
  [29, 29, 33],
];
