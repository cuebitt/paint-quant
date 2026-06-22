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

function compositeLayers(
  layers: AsepriteLayer[],
  width: number,
  height: number,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number }>,
): [number, number, number][] {
  const pixels: [number, number, number][] = Array.from({ length: width * height }, () => [
    0, 0, 0,
  ]);

  for (const layer of layers) {
    if (!layer.visible || layer.cels.length === 0) continue;

    const cel = layer.cels[0];
    if (!cel) continue;

    const opacity = layer.opacity / 255;
    const celOpacity = cel.opacity / 255;
    const combinedOpacity = opacity * celOpacity;

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
          const entry = palette[pixel];
          if (entry) {
            r = entry.red;
            g = entry.green;
            b = entry.blue;
            a = 255;
          }
        }

        const finalAlpha = (a / 255) * combinedOpacity;
        if (finalAlpha <= 0) continue;

        const targetX = cel.x + cx;
        const targetY = cel.y + cy;
        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) continue;

        const targetIndex = targetY * width + targetX;
        const existing = pixels[targetIndex];
        if (!existing) continue;

        const srcR = r;
        const srcG = g;
        const srcB = b;

        existing[0] = Math.round(srcR * finalAlpha + existing[0] * (1 - finalAlpha));
        existing[1] = Math.round(srcG * finalAlpha + existing[1] * (1 - finalAlpha));
        existing[2] = Math.round(srcB * finalAlpha + existing[2] * (1 - finalAlpha));
      }
    }
  }

  return pixels;
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
