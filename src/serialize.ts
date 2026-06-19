import { FIXED_PALETTE, findNearestPaletteColor, type RGB } from "./palette";
import { CANVAS_TYPE_MAP, type CanvasType } from "./types";

// Maps code palette index (0-15) to the spec character.
const FIXED_PALETTE_CHARS = [
  "F",
  "E",
  "D",
  "C",
  "B",
  "A",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1",
  "0",
];

export interface SerializeOptions {
  quantized: ImageData;
  adaptivePalette: readonly RGB[];
  canvasType: CanvasType;
}

export function serializeQuantizedImage({
  quantized,
  adaptivePalette,
  canvasType,
}: SerializeOptions) {
  const adaptiveColors = adaptivePalette.slice(0, 12) as RGB[];
  const palette = [...FIXED_PALETTE, ...adaptiveColors];

  const { data } = quantized;
  let pixels = "";

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const idx = findNearestPaletteColor(r, g, b, palette);

    if (idx < 16) {
      pixels += FIXED_PALETTE_CHARS[idx];
    } else if (idx < 28) {
      pixels += String.fromCharCode(71 + (idx - 16)); // 'G'-'R'
    } else {
      pixels += "0";
    }
  }

  return {
    version: 1,
    canvasType: CANVAS_TYPE_MAP[canvasType.name],
    palette: adaptiveColors,
    pixels,
  };
}
