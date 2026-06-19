export type RGB = [number, number, number];

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

export function colorDistance(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

export function findNearestPaletteColor(
  r: number,
  g: number,
  b: number,
  palette: readonly RGB[],
): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let j = 0; j < palette.length; j++) {
    const dist = colorDistance([r, g, b], palette[j]);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = j;
    }
  }
  return bestIdx;
}
