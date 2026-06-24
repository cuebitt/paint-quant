import { describe, it, expect } from "vite-plus/test";
import { readAsepriteFile, debugAsepriteFile } from "../formats/aseprite";

interface LayerDef {
  name: string;
  visible: boolean;
  opacity: number;
  level?: number;
  type?: number;
  blend?: number;
  pixels: [number, number, number, number][];
  celX?: number;
  celY?: number;
  celOpacity?: number;
}

function write16(buf: number[], value: number) {
  buf.push(value & 0xff, (value >> 8) & 0xff);
}

function write32(buf: number[], value: number) {
  buf.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

function writeString(buf: number[], value: string) {
  const bytes = new TextEncoder().encode(value);
  write16(buf, bytes.length);
  for (const b of bytes) buf.push(b);
}

function createTestAsepriteFile(width: number, height: number, layers: LayerDef[]): ArrayBuffer {
  const layerChunks: number[][] = [];
  for (const layer of layers) {
    const layerType = layer.type ?? 0;
    const childLevel = layerType === 1 ? (layer.level ?? 0) + 1 : 0;
    const body: number[] = [];
    write16(body, layer.visible ? 1 : 0);
    write16(body, layerType);
    write16(body, layer.level ?? 0);
    write16(body, childLevel);
    write16(body, 0);
    write16(body, layer.blend ?? 0);
    body.push(layer.opacity, 0, 0, 0);
    writeString(body, layer.name);

    const chunk: number[] = [];
    write32(chunk, 6 + body.length);
    write16(chunk, 0x2004);
    chunk.push(...body);
    layerChunks.push(chunk);
  }

  const celChunks: number[][] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]!;
    if ((layer.type ?? 0) === 1 || layer.pixels.length === 0) continue;

    const pixelCount = width * height;
    const body: number[] = [];
    write16(body, i);
    write16(body, layer.celX ?? 0);
    write16(body, layer.celY ?? 0);
    body.push(layer.celOpacity ?? 255);
    write16(body, 0);
    write16(body, 0);
    for (let j = 0; j < 5; j++) body.push(0);
    write16(body, width);
    write16(body, height);
    for (const pixel of layer.pixels) {
      for (let p = 0; p < pixelCount; p++) {
        body.push(pixel[0], pixel[1], pixel[2], pixel[3]);
      }
    }

    const chunk: number[] = [];
    write32(chunk, 6 + body.length);
    write16(chunk, 0x2005);
    chunk.push(...body);
    celChunks.push(chunk);
  }

  const allChunks = [...layerChunks, ...celChunks];
  const frameData = allChunks.flat();
  const frameSize = 16 + frameData.length;

  const out: number[] = [];

  // Header (128 bytes)
  write32(out, 128);
  write16(out, 42464);
  write16(out, 1);
  write16(out, width);
  write16(out, height);
  write16(out, 32);
  write32(out, 0);
  write16(out, 100);
  write32(out, 0);
  write32(out, 0);
  out.push(0);
  out.push(0, 0, 0);
  write16(out, 0);
  out.push(1, 1);
  write16(out, 0);
  write16(out, 0);
  write16(out, 0);
  write16(out, 0);
  while (out.length < 128) out.push(0);

  // Frame header + chunks
  write32(out, frameSize);
  write16(out, 0xf1fa);
  write16(out, allChunks.length);
  write16(out, 100);
  write16(out, 0);
  write32(out, 0);
  out.push(...frameData);

  return Uint8Array.from(out).buffer;
}

describe("readAsepriteFile", () => {
  it("parses a single-layer sprite", () => {
    const pixels: [number, number, number, number][] = [
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
      [255, 255, 0, 255],
    ];

    const data = createTestAsepriteFile(2, 2, [
      { name: "Layer 1", visible: true, opacity: 255, pixels },
    ]);

    const result = readAsepriteFile(data);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.imageData.width).toBe(2);
    expect(result.imageData.height).toBe(2);

    const d = result.imageData.data;
    expect(d[0]).toBe(255);
    expect(d[1]).toBe(0);
    expect(d[2]).toBe(0);
    expect(d[3]).toBe(255);
  });

  it("composites visible layers top-down", () => {
    const data = createTestAsepriteFile(1, 1, [
      { name: "Layer 1", visible: true, opacity: 255, pixels: [[255, 0, 0, 255]] },
      { name: "Layer 2", visible: true, opacity: 255, pixels: [[0, 255, 0, 255]] },
    ]);

    const result = readAsepriteFile(data);
    const d = result.imageData.data;
    expect(d[0]).toBe(0);
    expect(d[1]).toBe(255);
    expect(d[2]).toBe(0);
    expect(d[3]).toBe(255);
  });

  it("skips hidden layers", () => {
    const data = createTestAsepriteFile(1, 1, [
      { name: "Layer 1", visible: true, opacity: 255, pixels: [[255, 0, 0, 255]] },
      { name: "Layer 2", visible: false, opacity: 255, pixels: [[0, 255, 0, 255]] },
    ]);

    const result = readAsepriteFile(data);
    const d = result.imageData.data;
    expect(d[0]).toBe(255);
    expect(d[1]).toBe(0);
    expect(d[2]).toBe(0);
    expect(d[3]).toBe(255);
  });

  it("applies layer opacity", () => {
    const data = createTestAsepriteFile(1, 1, [
      { name: "Layer 1", visible: true, opacity: 128, pixels: [[255, 0, 0, 255]] },
    ]);

    const result = readAsepriteFile(data);
    const d = result.imageData.data;
    expect(d[0]).toBe(255);
    expect(d[1]).toBe(0);
    expect(d[2]).toBe(0);
    expect(d[3]).toBe(128);
  });

  it("positions cels using their x/y offsets", () => {
    const data = createTestAsepriteFile(4, 4, [
      {
        name: "Layer 1",
        visible: true,
        opacity: 255,
        pixels: [[255, 0, 0, 255]],
        celX: 2,
        celY: 2,
      },
    ]);

    const result = readAsepriteFile(data);
    const d = result.imageData.data;
    const offsetIndex = (2 * 4 + 2) * 4;
    expect(d[offsetIndex]).toBe(255);
    expect(d[offsetIndex + 1]).toBe(0);
    expect(d[offsetIndex + 2]).toBe(0);
    expect(d[offsetIndex + 3]).toBe(255);
    expect(d[3]).toBe(0);
  });

  it("applies group opacity to children", () => {
    const data = createTestAsepriteFile(1, 1, [
      { name: "Group", visible: true, opacity: 128, type: 1, level: 0, pixels: [] },
      {
        name: "Child",
        visible: true,
        opacity: 255,
        type: 0,
        level: 1,
        pixels: [[255, 0, 0, 255]],
      },
    ]);

    const result = readAsepriteFile(data);
    const d = result.imageData.data;
    expect(d[0]).toBe(255);
    expect(d[1]).toBe(0);
    expect(d[2]).toBe(0);
    expect(d[3]).toBe(128);
  });

  it("hides children when the group is hidden", () => {
    const data = createTestAsepriteFile(1, 1, [
      { name: "Group", visible: false, opacity: 255, type: 1, level: 0, pixels: [] },
      {
        name: "Child",
        visible: true,
        opacity: 255,
        type: 0,
        level: 1,
        pixels: [[255, 0, 0, 255]],
      },
    ]);

    const result = readAsepriteFile(data);
    const d = result.imageData.data;
    expect(d[3]).toBe(0);
  });

  it("accepts Uint8Array input", () => {
    const ab = createTestAsepriteFile(1, 1, [
      { name: "Layer 1", visible: true, opacity: 255, pixels: [[255, 0, 0, 255]] },
    ]);
    const u8 = new Uint8Array(ab);

    const result = readAsepriteFile(u8);
    const d = result.imageData.data;
    expect(d[0]).toBe(255);
    expect(d[3]).toBe(255);
  });
});

describe("debugAsepriteFile", () => {
  it("summarizes header and layer visibility", () => {
    const pixels: [number, number, number, number][] = [
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
      [255, 255, 0, 255],
    ];

    const data = createTestAsepriteFile(2, 2, [
      { name: "Layer 1", visible: true, opacity: 255, pixels },
    ]);

    const debugInfo = debugAsepriteFile(data);

    expect(debugInfo.header.width).toBe(2);
    expect(debugInfo.header.height).toBe(2);
    expect(debugInfo.header.depth).toBe("RGBA");
    expect(debugInfo.layers).toHaveLength(1);
    expect(debugInfo.layers[0]).toContain("Layer 1");
    expect(debugInfo.layers[0]).toContain("visible");
    expect(debugInfo.layers[0]).toContain("100% opacity");
  });
});
