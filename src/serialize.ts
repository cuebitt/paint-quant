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

export interface PaintSpec {
  generation: 0 | 1;
  ct: string;
  pixels: number[];
  v: 99 | 2;
  author?: string;
  name: string;
  title?: string;
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
  const pixelArray: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const idx = findNearestPaletteColor(r, g, b, palette);

    if (idx < 16) {
      pixels += FIXED_PALETTE_CHARS[idx];
      pixelArray.push(idx);
    } else if (idx < 28) {
      pixels += String.fromCharCode(71 + (idx - 16)); // 'G'-'R'
      pixelArray.push(idx);
    } else {
      pixels += "0";
      pixelArray.push(0);
    }
  }

  return {
    version: 1,
    canvasType: CANVAS_TYPE_MAP[canvasType.name],
    palette: adaptiveColors,
    pixels,
  };
}

export function serializePaintFile({
  quantized,
  adaptivePalette,
  canvasType,
}: SerializeOptions): PaintSpec {
  const adaptiveColors = adaptivePalette.slice(0, 12) as RGB[];
  const palette = [...FIXED_PALETTE, ...adaptiveColors];

  const { data } = quantized;
  const pixels: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const idx = findNearestPaletteColor(r, g, b, palette);

    if (idx < 16) {
      pixels.push(idx);
    } else if (idx < 28) {
      pixels.push(idx);
    } else {
      pixels.push(0);
    }
  }

  const generateUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const timestamp = Date.now().toString(36);

  return {
    generation: 0,
    ct: CANVAS_TYPE_MAP[canvasType.name] || "SMALL",
    pixels,
    v: 99,
    author: "",
    name: `${generateUUID()}_${timestamp}`, // Keep title and author optional for in-game editing
    title: "",
  };
}
