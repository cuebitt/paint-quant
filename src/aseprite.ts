import {
  Aseprite,
  AsepriteColorDepth,
  type AsepriteLayer,
  type AsepritePixel,
  type AsepriteRgbaPixel,
  type AsepriteGrayscalePixel,
  type AsepriteIndexedPixel,
} from "@pixelation/aseprite";

export interface AsepriteData {
  width: number;
  height: number;
  pixels: [number, number, number][];
}

function isRgbaPixel(pixel: AsepritePixel): pixel is AsepriteRgbaPixel {
  return Array.isArray(pixel) && pixel.length === 4;
}

function isGrayscalePixel(pixel: AsepritePixel): pixel is AsepriteGrayscalePixel {
  return Array.isArray(pixel) && pixel.length === 2;
}

function isIndexedPixel(
  pixel: AsepritePixel,
  depth: AsepriteColorDepth,
): pixel is AsepriteIndexedPixel {
  return depth === AsepriteColorDepth.Index && typeof pixel === "number";
}

function getPaletteEntry(
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
  index: number,
): { red: number; green: number; blue: number; alpha: number } | undefined {
  return palette[index] ?? palette[String(index)];
}

function blendNormal(
  srcR: number,
  srcG: number,
  srcB: number,
  srcA: number,
  dstR: number,
  dstG: number,
  dstB: number,
  dstA: number,
): [number, number, number, number] {
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return [0, 0, 0, 0];
  const outR = (srcR * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (srcG * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (srcB * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), Math.round(outA)];
}

function compositeLayers(
  layers: AsepriteLayer[],
  width: number,
  height: number,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
): [number, number, number][] {
  const pixels: number[][] = Array.from({ length: width * height }, () => [0, 0, 0, 0]);

  for (const layer of layers) {
    if (!layer.visible || layer.cels.length === 0) continue;

    const cel = layer.cels[0];
    if (!cel) continue;

    const layerOpacity = layer.opacity / 255;
    const celOpacity = cel.opacity / 255;

    for (let cy = 0; cy < cel.height; cy++) {
      for (let cx = 0; cx < cel.width; cx++) {
        const pixelIndex = cy * cel.width + cx;
        const pixel = cel.pixels[pixelIndex];
        if (pixel === undefined) continue;

        let r = 0;
        let g = 0;
        let b = 0;
        let a = 255;

        if (isRgbaPixel(pixel)) {
          r = pixel[0];
          g = pixel[1];
          b = pixel[2];
          a = pixel[3];
        } else if (isGrayscalePixel(pixel)) {
          r = pixel[0];
          g = pixel[0];
          b = pixel[0];
          a = pixel[1];
        } else if (isIndexedPixel(pixel, depth)) {
          const entry = getPaletteEntry(palette, pixel);
          if (entry) {
            r = entry.red;
            g = entry.green;
            b = entry.blue;
            a = entry.alpha;
          }
        }

        const srcA = (a / 255) * celOpacity * layerOpacity;
        if (srcA <= 0) continue;

        const targetX = cel.x + cx;
        const targetY = cel.y + cy;
        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) continue;

        const targetIndex = targetY * width + targetX;
        const existing = pixels[targetIndex];
        if (!existing) continue;

        const [outR, outG, outB, outA] = blendNormal(
          r,
          g,
          b,
          srcA,
          existing[0],
          existing[1],
          existing[2],
          existing[3],
        );

        existing[0] = outR;
        existing[1] = outG;
        existing[2] = outB;
        existing[3] = outA;
      }
    }
  }

  return pixels.map(([r, g, b]) => [r, g, b]) as [number, number, number][];
}

export function readAsepriteFile(data: ArrayBuffer): AsepriteData {
  const sprite = new Aseprite(data);
  const { width, height, depth } = sprite.header;

  if (sprite.frames.length === 0) {
    throw new Error("Aseprite file contains no frames");
  }

  const firstFrame = sprite.frames[0];
  if (!firstFrame) {
    throw new Error("Aseprite file contains no frames");
  }

  const visibleLayers = firstFrame.layers.filter((layer) => layer.visible && layer.cels.length > 0);

  const pixels = compositeLayers(visibleLayers, width, height, depth, sprite.palette);

  return { width, height, pixels };
}
