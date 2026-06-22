import { read, write, Int8, Int32, type CompoundTag } from "nbtify";
import type { CanvasType } from "@/types";

const PIXEL_COUNTS: Record<number, number> = {
  0: 256, // 16×16
  1: 1024, // 32×32
  2: 512, // 32×16
  3: 512, // 16×32
  4: 2304, // 48×48
  5: 4096, // 64×64
  6: 1536, // 48×32
  7: 3072, // 64×48
  8: 1536, // 32×48
  9: 3072, // 48×64
};

const CANVAS_TYPE_BY_SIZE: Record<string, number> = {
  "16x16": 0,
  "32x32": 1,
  "32x16": 2,
  "16x32": 3,
  "48x48": 4,
  "64x64": 5,
  "48x32": 6,
  "64x48": 7,
  "32x48": 8,
  "48x64": 9,
};

export interface PaintingData {
  canvasType: number;
  pixels: [number, number, number][];
  name: string;
  author: string;
  title: string;
  generation: number;
  version: number;
}

export function getCanvasTypeIndex(canvas: CanvasType): number {
  const key = `${canvas.width}x${canvas.height}`;
  const idx = CANVAS_TYPE_BY_SIZE[key];
  if (idx === undefined) {
    throw new Error(`Unsupported canvas dimensions: ${canvas.width}×${canvas.height}`);
  }
  return idx;
}

export async function writePaintFile(data: PaintingData): Promise<Uint8Array> {
  if (data.canvasType < 0 || data.canvasType > 9) {
    throw new Error(`Invalid canvas type: ${data.canvasType}. Must be 0–9.`);
  }

  const expected = PIXEL_COUNTS[data.canvasType];
  if (data.pixels.length !== expected) {
    throw new Error(
      `Expected ${expected} pixels for canvas type ${data.canvasType}, got ${data.pixels.length}.`,
    );
  }

  const argbPixels = data.pixels.map(([r, g, b]) => (0xff << 24) | (r << 16) | (g << 8) | b);

  const fields: CompoundTag = {
    ct: new Int8(data.canvasType),
    pixels: new Int32Array(argbPixels),
    generation: new Int32(data.generation),
    v: new Int32(data.version),
    name: data.name,
  };

  if (data.title !== "" && data.author !== "") {
    fields.author = data.author;
    fields.title = data.title;
  }

  return write(fields, { rootName: "", endian: "big", compression: null });
}

export async function readPaintFile(data: ArrayBuffer | Uint8Array): Promise<PaintingData> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const result = await read(bytes, { rootName: true, endian: "big", compression: null });
  const root = result.data as CompoundTag;

  const ct = (root.ct as Int8).valueOf();
  const pixels = root.pixels as unknown as Int32Array;
  const generation = (root.generation as Int32).valueOf();
  const v = (root.v as Int32).valueOf();
  const name = root.name as string;

  let author = "";
  let title = "";
  if (root.author && root.title) {
    author = root.author as string;
    title = root.title as string;
  }

  const rgbPixels: [number, number, number][] = Array.from(pixels, (argb: number) => [
    (argb >> 16) & 0xff,
    (argb >> 8) & 0xff,
    argb & 0xff,
  ]);

  return {
    canvasType: ct,
    pixels: rgbPixels,
    name,
    author,
    title,
    generation,
    version: v,
  };
}
