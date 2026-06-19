/**
 * Preprocess uploaded image to fit specified canvas dimensions
 * Resizes image while maintaining aspect ratio and adds white background
 *
 * @param image - HTMLImageElement to preprocess
 * @param canvasType - Target canvas dimensions and cell configuration
 * @returns ImageData object ready for quantization
 */
export const preprocessImageForCanvas = (
  image: HTMLImageElement,
  canvasType: CanvasType,
): ImageData => {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCanvas.width = canvasType.width;
  tempCanvas.height = canvasType.height;

  // Calculate scaling factor to fit image within canvas
  const scale = Math.min(canvasType.width / image.width, canvasType.height / image.height);
  const scaledWidth = Math.floor(image.width * scale);
  const scaledHeight = Math.floor(image.height * scale);
  const offsetX = (canvasType.width - scaledWidth) / 2;
  const offsetY = (canvasType.height - scaledHeight) / 2;

  // Fill with white background and center the image
  tempCtx.fillStyle = "white";
  tempCtx.fillRect(0, 0, canvasType.width, canvasType.height);
  tempCtx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

  return tempCtx.getImageData(0, 0, canvasType.width, canvasType.height);
};

// Export types used by these utilities
export interface CanvasType {
  name: string;
  width: number;
  height: number;
  cellsX: number;
  cellsY: number;
}

// Export CANVAS_TYPES for use in components
export const CANVAS_TYPES: CanvasType[] = [
  { name: "1×1 Canvas", width: 16, height: 16, cellsX: 1, cellsY: 1 },
  { name: "2×1 Long Canvas", width: 32, height: 16, cellsX: 2, cellsY: 1 },
  { name: "1×2 Tall Canvas", width: 16, height: 32, cellsX: 1, cellsY: 2 },
  { name: "2×2 Square", width: 32, height: 32, cellsX: 2, cellsY: 2 },
  { name: "3×3 Square", width: 48, height: 48, cellsX: 3, cellsY: 3 },
  { name: "4×4 Large Square", width: 64, height: 64, cellsX: 4, cellsY: 4 },
  { name: "3×2 Medium", width: 48, height: 32, cellsX: 3, cellsY: 2 },
  { name: "4×3 Wide", width: 64, height: 48, cellsX: 4, cellsY: 3 },
  { name: "2×3 Medium", width: 32, height: 48, cellsX: 2, cellsY: 3 },
  { name: "3×4 Tall", width: 48, height: 64, cellsX: 3, cellsY: 4 },
];

export const CANVAS_TYPE_MAP: Record<string, string> = {
  "1×1 Canvas": "SMALL",
  "2×1 Long Canvas": "LONG",
  "1×2 Tall Canvas": "TALL",
  "2×2 Square": "LARGE",
  "3×3 Square": "EXTRA_LARGE",
  "4×4 Large Square": "EXTRA_EXTRA_LARGE",
  "3×2 Medium": "EXTRA_LONG",
  "4×3 Wide": "EXTRA_EXTRA_LONG",
  "2×3 Medium": "EXTRA_TALL",
  "3×4 Tall": "EXTRA_EXTRA_TALL",
};

type RGB = [number, number, number];

const FIXED_PALETTE: RGB[] = [
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

// Maps code palette index (0-15) to the spec character.
// The code's fixed palette order differs from the spec's character order.
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

function colorDistance(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function findClosestColor(r: number, g: number, b: number, palette: RGB[]): number {
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
    const idx = findClosestColor(r, g, b, palette);

    if (idx < 16) {
      pixels += FIXED_PALETTE_CHARS[idx];
    } else {
      // Adaptive palette indices 16-27 map to chars 'G'-'R'
      pixels += String.fromCharCode(71 + (idx - 16)); // 'G' = 71
    }
  }

  return {
    version: 1,
    canvasType: CANVAS_TYPE_MAP[canvasType.name],
    palette: adaptiveColors,
    pixels,
  };
}
