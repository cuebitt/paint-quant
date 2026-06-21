import {
  buildPaletteSync,
  applyPaletteSync,
  utils,
  type ColorDistanceFormula,
  type ImageQuantization,
  type PaletteQuantization,
} from "image-q";
import { FIXED_PALETTE, type RGB } from "./palette";

export type QuantMethod = "median-cut" | "neuquant" | "wuquant";

export interface QuantizeOptions {
  colors: number;
  includeFixedPalette: boolean;
}

interface QuantizeResult {
  quantized: ImageData;
  adaptivePalette: readonly RGB[];
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

function extractAdaptiveColors(pc: utils.PointContainer, maxColors: number): RGB[] {
  const pointArray = pc.getPointArray();
  const colors: RGB[] = [];
  for (let i = 0; i < Math.min(maxColors, pointArray.length); i++) {
    const p = pointArray[i];
    colors.push([p.r, p.g, p.b]);
  }
  return colors;
}

function buildCombinedPalette(adaptiveColors: RGB[], includeFixed: boolean): utils.Palette {
  const combined = includeFixed ? [...FIXED_PALETTE, ...adaptiveColors] : [...adaptiveColors];
  return buildImageQPalette(combined);
}

function applyPalette(
  inPC: utils.PointContainer,
  combinedPalette: utils.Palette,
): utils.PointContainer {
  return applyPaletteSync(inPC, combinedPalette, {
    imageQuantization: "floyd-steinberg" as ImageQuantization,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });
}

function quantizeMedianCut(imageData: ImageData, options: QuantizeOptions): QuantizeResult {
  const { data } = imageData;
  const alpha = new Uint8Array(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    alpha[i / 4] = data[i + 3];
  }

  const inPC = utils.PointContainer.fromImageData(imageData);

  const adaptiveQ = buildPaletteSync([inPC], {
    paletteQuantization: "rgbquant" as PaletteQuantization,
    colors: options.colors,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  const adaptiveColors = extractAdaptiveColors(adaptiveQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(adaptiveColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  const quantized = pointContainerToImageData(outPC);
  for (let i = 0; i < alpha.length; i++) {
    quantized.data[i * 4 + 3] = alpha[i];
  }

  return { quantized, adaptivePalette: adaptiveColors };
}

function quantizeNeuQuant(imageData: ImageData, options: QuantizeOptions): QuantizeResult {
  const inPC = utils.PointContainer.fromImageData(imageData);

  const adaptiveQ = buildPaletteSync([inPC], {
    paletteQuantization: "neuquant" as PaletteQuantization,
    colors: options.colors,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  const adaptiveColors = extractAdaptiveColors(adaptiveQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(adaptiveColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  return { quantized: pointContainerToImageData(outPC), adaptivePalette: adaptiveColors };
}

function quantizeWuQuant(imageData: ImageData, options: QuantizeOptions): QuantizeResult {
  const inPC = utils.PointContainer.fromImageData(imageData);

  const fullQ = buildPaletteSync([inPC], {
    paletteQuantization: "wuquant" as PaletteQuantization,
    colors: 256,
    colorDistanceFormula: "cie94-graphic-arts" as ColorDistanceFormula,
  });

  const fullColors = extractAdaptiveColors(fullQ.getPointContainer(), options.colors);
  const combinedPalette = buildCombinedPalette(fullColors, options.includeFixedPalette);
  const outPC = applyPalette(inPC, combinedPalette);

  return { quantized: pointContainerToImageData(outPC), adaptivePalette: fullColors };
}

export function quantize(
  imageData: ImageData,
  method: QuantMethod = "median-cut",
  options: QuantizeOptions = { colors: 12, includeFixedPalette: true },
): QuantizeResult {
  switch (method) {
    case "neuquant":
      return quantizeNeuQuant(imageData, options);
    case "wuquant":
      return quantizeWuQuant(imageData, options);
    default:
      return quantizeMedianCut(imageData, options);
  }
}
