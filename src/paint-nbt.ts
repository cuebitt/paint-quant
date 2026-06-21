import { Buffer } from "buffer";
import * as nbt from "prismarine-nbt";
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

type NBTValue = { type: string; value: unknown };

export function writePaintFile(data: PaintingData): Uint8Array {
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

  const fields: Record<string, NBTValue> = {
    ct: nbt.byte(data.canvasType),
    pixels: nbt.intArray(argbPixels),
    generation: nbt.int(data.generation),
    v: nbt.int(data.version),
    name: nbt.string(data.name),
  };

  if (data.title !== "" && data.author !== "") {
    fields.author = nbt.string(data.author);
    fields.title = nbt.string(data.title);
  }

  const tag = nbt.comp(fields, "") as nbt.NBT;
  const buf = nbt.writeUncompressed(tag);
  return new Uint8Array(buf);
}

export function readPaintFile(data: ArrayBuffer | Uint8Array): PaintingData {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const buf = Buffer.from(bytes);
  const tag = nbt.parseUncompressed(buf);

  const ct = (tag.value.ct as NBTValue).value as number;
  const pixels = (tag.value.pixels as NBTValue).value as number[];
  const generation = (tag.value.generation as NBTValue).value as number;
  const v = (tag.value.v as NBTValue).value as number;
  const name = (tag.value.name as NBTValue).value as string;

  let author = "";
  let title = "";
  if (tag.value.author && tag.value.title) {
    author = (tag.value.author as NBTValue).value as string;
    title = (tag.value.title as NBTValue).value as string;
  }

  const rgbPixels: [number, number, number][] = pixels.map((argb: number) => [
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
