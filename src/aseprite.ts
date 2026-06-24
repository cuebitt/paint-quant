import {
  Aseprite,
  AsepriteColorDepth,
  AsepriteLayerBlendMode,
  type AsepriteCel,
  type AsepritePixel,
} from "@pixelation/aseprite";

export interface AsepriteData {
  width: number;
  height: number;
  imageData: ImageData;
}

interface RawLayerMeta {
  name: string;
  level: number;
  type: number;
  visible: boolean;
  opacity: number;
  blend: AsepriteLayerBlendMode;
  celIndex: number[];
}

interface ProcessedLayer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: AsepriteLayerBlendMode;
  children: ProcessedLayer[];
  cels: AsepriteCel[];
}

interface FlattenedLayer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: AsepriteLayerBlendMode;
  cels: AsepriteCel[];
}

function readLeU16(buf: ArrayBuffer, offset: number): number {
  return new DataView(buf).getUint16(offset, true);
}

function readLeU32(buf: ArrayBuffer, offset: number): number {
  return new DataView(buf).getUint32(offset, true);
}

function readStringAt(buf: ArrayBuffer, offset: number): { value: string; bytesRead: number } {
  const len = readLeU16(buf, offset);
  const bytes = new Uint8Array(buf, offset + 2, len);
  return { value: new TextDecoder().decode(bytes), bytesRead: 2 + len };
}

function parseLayerMetadata(buf: ArrayBuffer): RawLayerMeta[] {
  const headerSize = 128;
  let cursor = headerSize;
  const totalSize = buf.byteLength;

  if (cursor >= totalSize) return [];

  cursor += 4;
  const frameMagic = readLeU16(buf, cursor);
  cursor += 2;
  if (frameMagic !== 0xf1fa) return [];

  const chunkCount = readLeU16(buf, cursor);
  cursor += 2;
  cursor += 2;
  cursor += 2;
  cursor += 4;

  const layers: RawLayerMeta[] = [];
  const layerCels: Map<number, number[]> = new Map();

  for (let c = 0; c < chunkCount; c++) {
    if (cursor + 6 > totalSize) break;

    const chunkSize = readLeU32(buf, cursor);
    const chunkType = readLeU16(buf, cursor + 4);

    if (chunkType === 0x2004) {
      let p = cursor + 6;
      const flags = readLeU16(buf, p);
      p += 2;
      const layerType = readLeU16(buf, p);
      p += 2;
      const level = readLeU16(buf, p);
      p += 2;
      p += 2;
      p += 2;
      const blend = readLeU16(buf, p);
      p += 2;
      const opacity = new Uint8Array(buf)[p];
      p += 1;
      p += 3;
      const { value: name } = readStringAt(buf, p);

      layers.push({
        name,
        level,
        type: layerType,
        visible: !!(flags & 1),
        opacity: opacity!,
        blend: blend as AsepriteLayerBlendMode,
        celIndex: [],
      });
    } else if (chunkType === 0x2005) {
      const p = cursor + 6;
      const layerIndex = readLeU16(buf, p);
      if (!layerCels.has(layerIndex)) {
        layerCels.set(layerIndex, []);
      }
      layerCels.get(layerIndex)!.push(layerIndex);
    }

    cursor += chunkSize;
  }

  for (let i = 0; i < layers.length; i++) {
    layers[i]!.celIndex = layerCels.has(i) ? [i] : [];
  }

  return layers;
}

function buildLayerTree(
  rawLayers: RawLayerMeta[],
  spriteLayers: {
    visible: boolean;
    opacity: number;
    blend: AsepriteLayerBlendMode;
    cels: AsepriteCel[];
  }[],
  level: number,
  startIdx = 0,
): ProcessedLayer[] {
  const result: ProcessedLayer[] = [];
  let i = startIdx;

  while (i < rawLayers.length) {
    const raw = rawLayers[i];
    if (!raw) break;

    if (raw.level < level) break;
    if (raw.level > level) {
      i++;
      continue;
    }

    const spriteLayer = spriteLayers[i];
    const isGroup = raw.type === 1;

    const processed: ProcessedLayer = {
      name: raw.name,
      visible: raw.visible,
      opacity: raw.opacity / 255,
      blendMode: raw.blend,
      children: [],
      cels: spriteLayer?.cels ?? [],
    };

    if (isGroup) {
      i++;
      processed.children = buildLayerTree(rawLayers, spriteLayers, level + 1, i);
    } else {
      i++;
    }

    result.push(processed);
  }

  return result;
}

function flattenLayers(
  layers: ProcessedLayer[],
  parentOpacity: number,
  parentVisible: boolean,
): FlattenedLayer[] {
  const result: FlattenedLayer[] = [];

  for (const layer of layers) {
    const effectiveVisible = parentVisible && layer.visible;
    const effectiveOpacity = parentOpacity * layer.opacity;

    if (layer.children.length > 0) {
      result.push(...flattenLayers(layer.children, effectiveOpacity, effectiveVisible));
    } else {
      result.push({
        name: layer.name,
        visible: effectiveVisible,
        opacity: effectiveOpacity,
        blendMode: layer.blendMode,
        cels: layer.cels,
      });
    }
  }

  return result;
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
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendMultiply(
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
  const outR = (((srcR * dstR) / 255) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (((srcG * dstG) / 255) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (((srcB * dstB) / 255) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendScreen(
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
  const outR =
    ((255 - ((255 - srcR) * (255 - dstR)) / 255) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG =
    ((255 - ((255 - srcG) * (255 - dstG)) / 255) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB =
    ((255 - ((255 - srcB) * (255 - dstB)) / 255) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendOverlay(
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
  const blendChannel = (s: number, d: number): number =>
    d < 128 ? (2 * s * d) / 255 : 255 - (2 * (255 - s) * (255 - d)) / 255;
  const outR = (blendChannel(srcR, dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (blendChannel(srcG, dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (blendChannel(srcB, dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendDarken(
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
  const outR = (Math.min(srcR, dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (Math.min(srcG, dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (Math.min(srcB, dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendLighten(
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
  const outR = (Math.max(srcR, dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (Math.max(srcG, dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (Math.max(srcB, dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendDifference(
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
  const outR = (Math.abs(srcR - dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (Math.abs(srcG - dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (Math.abs(srcB - dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendExclusion(
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
  const blendChannel = (s: number, d: number): number => s + d - (2 * s * d) / 255;
  const outR = (blendChannel(srcR, dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (blendChannel(srcG, dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (blendChannel(srcB, dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendAddition(
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
  const outR = (Math.min(255, srcR + dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (Math.min(255, srcG + dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (Math.min(255, srcB + dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendSubtract(
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
  const outR = (Math.max(0, srcR - dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (Math.max(0, srcG - dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (Math.max(0, srcB - dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function blendDivide(
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
  const blendChannel = (s: number, d: number): number =>
    d === 0 ? 255 : Math.min(255, (s * 255) / d);
  const outR = (blendChannel(srcR, dstR) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = (blendChannel(srcG, dstG) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = (blendChannel(srcB, dstB) * srcA + dstB * dstA * (1 - srcA)) / outA;
  return [Math.round(outR), Math.round(outG), Math.round(outB), outA];
}

function applyBlendMode(
  mode: AsepriteLayerBlendMode,
  srcR: number,
  srcG: number,
  srcB: number,
  srcA: number,
  dstR: number,
  dstG: number,
  dstB: number,
  dstA: number,
): [number, number, number, number] {
  switch (mode) {
    case AsepriteLayerBlendMode.Normal:
      return blendNormal(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Multiply:
      return blendMultiply(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Screen:
      return blendScreen(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Overlay:
      return blendOverlay(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Darken:
      return blendDarken(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Lighten:
      return blendLighten(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Difference:
      return blendDifference(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Exclusion:
      return blendExclusion(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Addition:
      return blendAddition(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Subtract:
      return blendSubtract(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    case AsepriteLayerBlendMode.Divide:
      return blendDivide(srcR, srcG, srcB, srcA, dstR, dstG, dstB, dstA);
    default:
      return [0, 0, 0, 0];
  }
}

function getPixelColor(
  pixel: AsepritePixel,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
): [number, number, number, number] {
  if (depth === AsepriteColorDepth.Rgba) {
    const p = pixel as unknown as Uint8Array;
    return [p[0]!, p[1]!, p[2]!, p[3]!];
  }

  if (depth === AsepriteColorDepth.Grayscale) {
    const p = pixel as unknown as Uint8Array;
    return [p[0]!, p[0]!, p[0]!, p[1]!];
  }

  if (depth === AsepriteColorDepth.Index) {
    const index = pixel as number;
    const entry = palette[index] ?? palette[String(index)];
    if (entry) {
      return [entry.red, entry.green, entry.blue, entry.alpha];
    }
  }

  return [0, 0, 0, 0];
}

function compositeLayers(
  layers: FlattenedLayer[],
  width: number,
  height: number,
  depth: AsepriteColorDepth,
  palette: Record<number | string, { red: number; green: number; blue: number; alpha: number }>,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);

  const visibleLayers = layers.filter((l) => l.visible && l.cels.length > 0);

  for (const layer of visibleLayers) {
    for (const cel of layer.cels) {
      if (!cel.pixels || cel.pixels.length === 0) continue;

      const layerOpacity = layer.opacity;

      for (let cy = 0; cy < cel.height; cy++) {
        for (let cx = 0; cx < cel.width; cx++) {
          const pixelIndex = cy * cel.width + cx;
          const pixel = cel.pixels[pixelIndex];
          if (pixel === undefined) continue;

          const [r, g, b, a] = getPixelColor(pixel, depth, palette);

          const celOpacity = cel.opacity / 255;
          const finalOpacity = (a / 255) * celOpacity * layerOpacity;

          if (finalOpacity <= 0) continue;

          const targetX = cel.x + cx;
          const targetY = cel.y + cy;

          if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) continue;

          const targetIndex = (targetY * width + targetX) * 4;
          const dstR = data[targetIndex]!;
          const dstG = data[targetIndex + 1]!;
          const dstB = data[targetIndex + 2]!;
          const dstA = data[targetIndex + 3]! / 255;

          const [outR, outG, outB, outA] = applyBlendMode(
            layer.blendMode,
            r,
            g,
            b,
            finalOpacity,
            dstR!,
            dstG,
            dstB,
            dstA,
          );

          data[targetIndex] = outR;
          data[targetIndex + 1] = outG;
          data[targetIndex + 2] = outB;
          data[targetIndex + 3] = Math.round(outA * 255);
        }
      }
    }
  }

  return data;
}

function toBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (data.buffer instanceof ArrayBuffer) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  return new Uint8Array(data).buffer as ArrayBuffer;
}

export function readAsepriteFile(data: ArrayBuffer | Uint8Array): AsepriteData {
  return readAsepriteFileFromBuffer(toBuffer(data));
}

export async function readAsepriteFileAsync(
  data: File | Blob | ArrayBuffer | Uint8Array,
): Promise<AsepriteData> {
  if (data instanceof File || data instanceof Blob) {
    return readAsepriteFileFromBuffer(await data.arrayBuffer());
  }
  return readAsepriteFileFromBuffer(toBuffer(data));
}

function readAsepriteFileFromBuffer(data: ArrayBuffer): AsepriteData {
  const sprite = new Aseprite(data);
  const { width, height, depth } = sprite.header;

  if (sprite.frames.length === 0) {
    throw new Error("Aseprite file contains no frames");
  }

  const firstFrame = sprite.frames[0];
  if (!firstFrame) {
    throw new Error("Aseprite file contains no frames");
  }

  const rawLayers = parseLayerMetadata(data);
  const layerTree = buildLayerTree(rawLayers, firstFrame.layers, 0);
  const flatLayers = flattenLayers(layerTree, 1, true);

  const pixelData = compositeLayers(flatLayers, width, height, depth, sprite.palette);

  const imageData = new ImageData(width, height);
  imageData.data.set(pixelData);

  return { width, height, imageData };
}

export function asepriteToCanvas(data: ArrayBuffer | Uint8Array): HTMLCanvasElement {
  const { width, height, imageData } = readAsepriteFile(data);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function asepriteToPngBlob(data: ArrayBuffer | Uint8Array): Promise<Blob> {
  const canvas = asepriteToCanvas(data);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create PNG blob"));
    }, "image/png");
  });
}

export function debugAsepriteFile(data: ArrayBuffer | Uint8Array): {
  header: { width: number; height: number; depth: string; frames: number };
  layers: string[];
  frameCount: number;
} {
  const buf = toBuffer(data);
  const sprite = new Aseprite(buf);
  const { width, height, depth, frames } = sprite.header;

  const depthName =
    depth === AsepriteColorDepth.Rgba
      ? "RGBA"
      : depth === AsepriteColorDepth.Grayscale
        ? "Grayscale"
        : "Indexed";

  const rawLayers = parseLayerMetadata(buf);
  const layerNames: string[] = rawLayers.map((l) => {
    const visibility = l.visible ? "visible" : "hidden";
    const opacity = Math.round((l.opacity / 255) * 100);
    return `${l.name} (${visibility}, ${opacity}% opacity)`;
  });

  return {
    header: { width, height, depth: depthName, frames },
    layers: layerNames,
    frameCount: frames,
  };
}
