export type RGB = [number, number, number];

export function rgbToHex([r, g, b]: RGB): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
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
