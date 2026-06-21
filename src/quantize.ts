import {
  buildPaletteSync,
  applyPaletteSync,
  utils,
  type ColorDistanceFormula,
  type ImageQuantization,
  type PaletteQuantization,
} from "image-q";
import { FIXED_PALETTE, findNearestPaletteColor, type RGB } from "./palette";

export type QuantMethod = "median-cut" | "neuquant" | "wuquant";

export interface QuantizeResult {
  quantized: ImageData;
  adaptivePalette: readonly RGB[];
  combinedPalette: RGB[];
}

function pointContainerToImageData(pc: utils.PointContainer): ImageData {
  const uint8 = pc.toUint8Array();
  return new ImageData(
    new Uint8ClampedArray(uint8.buffer as ArrayBuffer),
    pc.getWidth(),
    pc.getHeight(),
  );
}

function buildImageQPalette(colors: RGB[]): utils.Palette {
  const palette = new utils.Palette();
  for (const [r, g, b] of colors) {
    palette.add(utils.Point.createByRGBA(r, g, b, 255));
  }
  palette.sort();
  return palette;
}

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (pixels.length === 0) return [[0, 0, 0]];
  if (depth === 0) {
    const sum = pixels.reduce(
      (acc, pixel) => {
        const [r, g, b] = pixel;
        return [acc[0] + r, acc[1] + g, acc[2] + b] as [number, number, number];
      },
      [0, 0, 0] as [number, number, number],
    );
    const n = pixels.length;
    return [[Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)]];
  }

  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const pixel of pixels) {
    const [r, g, b] = pixel;
    if (r < min[0]) min[0] = r;
    if (g < min[1]) min[1] = g;
    if (b < min[2]) min[2] = b;
    if (r > max[0]) max[0] = r;
    if (g > max[1]) max[1] = g;
    if (b > max[2]) max[2] = b;
  }

  const ranges: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const channel =
    ranges[0] >= ranges[1] && ranges[0] >= ranges[2] ? 0 : ranges[1] >= ranges[2] ? 1 : 2;

  pixels.sort((a, b) => a[channel as number] - b[channel as number]);

  const mid = Math.floor(pixels.length / 2);
  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

function quantizeLegacy(imageData: ImageData): QuantizeResult {
  const { data, width, height } = imageData;
  const pixels: RGB[] = [];

  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  const adaptive = pixels.length < 16 ? pixels.map((p) => p) : medianCut(pixels, 4);
  const combined = [...FIXED_PALETTE, ...adaptive];

  const output = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const bestIdx = findNearestPaletteColor(data[i], data[i + 1], data[i + 2], combined);
    output.data[i] = combined[bestIdx][0];
    output.data[i + 1] = combined[bestIdx][1];
    output.data[i + 2] = combined[bestIdx][2];
    output.data[i + 3] = data[i + 3];
  }

  return { quantized: output, adaptivePalette: adaptive, combinedPalette: combined };
}

function quantizeNeuQuant(imageData: ImageData): QuantizeResult {
  const inPC = utils.PointContainer.fromImageData(imageData);

  const adaptiveQ = buildPaletteSync([inPC], {
    paletteQuantization: "neuquant" as PaletteQuantization,
    colors: 12,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  const adaptiveColors: RGB[] = [];
  const adaptivePC = adaptiveQ.getPointContainer().getPointArray();
  for (let i = 0; i < Math.min(12, adaptivePC.length); i++) {
    const p = adaptivePC[i];
    adaptiveColors.push([p.r, p.g, p.b]);
  }

  const combined = [...FIXED_PALETTE, ...adaptiveColors];
  const combinedPalette = buildImageQPalette(combined);

  const outPC = applyPaletteSync(inPC, combinedPalette, {
    imageQuantization: "floyd-steinberg" as ImageQuantization,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  return {
    quantized: pointContainerToImageData(outPC),
    adaptivePalette: adaptiveColors,
    combinedPalette: combined,
  };
}

function quantizeWuQuant(imageData: ImageData): QuantizeResult {
  const inPC = utils.PointContainer.fromImageData(imageData);

  const fullQ = buildPaletteSync([inPC], {
    paletteQuantization: "wuquant" as PaletteQuantization,
    colors: 256,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  const fullColors: RGB[] = [];
  const fullPC = fullQ.getPointContainer().getPointArray();
  for (let i = 0; i < Math.min(12, fullPC.length); i++) {
    const p = fullPC[i];
    fullColors.push([p.r, p.g, p.b]);
  }

  const combined = [...FIXED_PALETTE, ...fullColors];
  const combinedPalette = buildImageQPalette(combined);

  const outPC = applyPaletteSync(inPC, combinedPalette, {
    imageQuantization: "floyd-steinberg" as ImageQuantization,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  return {
    quantized: pointContainerToImageData(outPC),
    adaptivePalette: fullColors,
    combinedPalette: combined,
  };
}

export function quantize(imageData: ImageData, method: QuantMethod = "median-cut"): QuantizeResult {
  switch (method) {
    case "neuquant":
      return quantizeNeuQuant(imageData);
    case "wuquant":
      return quantizeWuQuant(imageData);
    default:
      return quantizeLegacy(imageData);
  }
}
