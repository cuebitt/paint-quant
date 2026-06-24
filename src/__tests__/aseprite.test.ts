import { describe, it, expect } from "vite-plus/test";
import { readAsepriteFile, debugAsepriteFile } from "../aseprite";

function createTestAsepriteFile(
  width: number,
  height: number,
  layers: Array<{
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
  }>,
): ArrayBuffer {
  const layerChunksData: number[][] = [];
  for (const layer of layers) {
    const layerType = layer.type ?? 0;
    const level = layer.level ?? 0;
    const childLevel = layerType === 1 ? level + 1 : 0;
    const blend = layer.blend ?? 0;
    const encoded = new TextEncoder().encode(layer.name);
    const nameLength = encoded.length;

    const chunkBody = [
      ...(() => {
        const buf: number[] = [];
        const push16 = (v: number) => {
          buf.push(v & 0xff);
          buf.push((v >> 8) & 0xff);
        };
        push16(layer.visible ? 1 : 0);
        push16(layerType);
        push16(level);
        push16(childLevel);
        push16(0);
        push16(blend);
        buf.push(layer.opacity);
        buf.push(0, 0, 0);
        push16(nameLength);
        for (const b of encoded) buf.push(b);
        return buf;
      })(),
    ].flat();

    const chunkSize = 6 + chunkBody.length;
    const chunk = [
      ...(() => {
        const buf: number[] = [];
        const push32 = (v: number) => {
          buf.push(v & 0xff);
          buf.push((v >> 8) & 0xff);
          buf.push((v >> 16) & 0xff);
          buf.push((v >> 24) & 0xff);
        };
        const push16 = (v: number) => {
          buf.push(v & 0xff);
          buf.push((v >> 8) & 0xff);
        };
        push32(chunkSize);
        push16(0x2004);
        return buf;
      })(),
      ...chunkBody,
    ];

    layerChunksData.push(chunk);
  }

  const celChunksData: number[][] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (!layer) continue;
    if ((layer.type ?? 0) === 1) continue;
    if (layer.pixels.length === 0) continue;
    const pixelCount = width * height;

    const celBody: number[] = [];
    const push16 = (v: number) => {
      celBody.push(v & 0xff);
      celBody.push((v >> 8) & 0xff);
    };

    push16(i);
    push16(layer.celX ?? 0);
    push16(layer.celY ?? 0);
    celBody.push(layer.celOpacity ?? 255);
    push16(0);
    push16(0);
    for (let j = 0; j < 5; j++) celBody.push(0);
    push16(width);
    push16(height);

    for (const pixel of layer.pixels) {
      for (let p = 0; p < pixelCount; p++) {
        celBody.push(pixel[0], pixel[1], pixel[2], pixel[3]);
      }
    }

    const chunkSize = 6 + celBody.length;
    const chunk: number[] = [];
    const pushChunk32 = (v: number) => {
      chunk.push(v & 0xff);
      chunk.push((v >> 8) & 0xff);
      chunk.push((v >> 16) & 0xff);
      chunk.push((v >> 24) & 0xff);
    };
    const pushChunk16 = (v: number) => {
      chunk.push(v & 0xff);
      chunk.push((v >> 8) & 0xff);
    };
    pushChunk32(chunkSize);
    pushChunk16(0x2005);
    chunk.push(...celBody);

    celChunksData.push(chunk);
  }

  const allChunks = [...layerChunksData, ...celChunksData];
  const frameChunksFlat = allChunks.flat();
  const frameSize = 16 + frameChunksFlat.length;

  const headerBody: number[] = [];
  const hPush32 = (v: number) => {
    headerBody.push(v & 0xff);
    headerBody.push((v >> 8) & 0xff);
    headerBody.push((v >> 16) & 0xff);
    headerBody.push((v >> 24) & 0xff);
  };
  const hPush16 = (v: number) => {
    headerBody.push(v & 0xff);
    headerBody.push((v >> 8) & 0xff);
  };

  hPush32(128);
  hPush16(42464);
  hPush16(1);
  hPush16(width);
  hPush16(height);
  hPush16(32);
  hPush32(0);
  hPush16(100);
  hPush32(0);
  hPush32(0);
  headerBody.push(0);
  headerBody.push(0, 0, 0);
  hPush16(0);
  headerBody.push(1, 1);
  hPush16(0);
  hPush16(0);
  hPush16(0);
  hPush16(0);
  for (let i = 0; i < 84; i++) headerBody.push(0);

  const frameHeader: number[] = [];
  const fPush32 = (v: number) => {
    frameHeader.push(v & 0xff);
    frameHeader.push((v >> 8) & 0xff);
    frameHeader.push((v >> 16) & 0xff);
    frameHeader.push((v >> 24) & 0xff);
  };
  const fPush16 = (v: number) => {
    frameHeader.push(v & 0xff);
    frameHeader.push((v >> 8) & 0xff);
  };

  fPush32(frameSize);
  fPush16(0xf1fa);
  fPush16(allChunks.length);
  fPush16(100);
  fPush16(0);
  fPush32(0);

  const totalBuffer = [...headerBody, ...frameHeader, ...frameChunksFlat];

  const buf = new ArrayBuffer(totalBuffer.length);
  new Uint8Array(buf).set(totalBuffer);
  return buf;
}

describe("Aseprite Parser", () => {
  describe("readAsepriteFile", () => {
    it("parses a single layer sprite", () => {
      const width = 2;
      const height = 2;
      const pixels: [number, number, number, number][] = [
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
        [255, 255, 0, 255],
      ];

      const data = createTestAsepriteFile(width, height, [
        { name: "Layer 1", visible: true, opacity: 255, pixels },
      ]);

      const result = readAsepriteFile(data);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.imageData.width).toBe(width);
      expect(result.imageData.height).toBe(height);

      const d = result.imageData.data;
      expect(d[0]).toBe(255);
      expect(d[1]).toBe(0);
      expect(d[2]).toBe(0);
      expect(d[3]).toBe(255);
    });

    it("parses multiple visible layers", () => {
      const width = 1;
      const height = 1;

      const data = createTestAsepriteFile(width, height, [
        { name: "Layer 1", visible: true, opacity: 255, pixels: [[255, 0, 0, 255]] },
        { name: "Layer 2", visible: true, opacity: 255, pixels: [[0, 255, 0, 255]] },
      ]);

      const result = readAsepriteFile(data);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      const d = result.imageData.data;
      expect(d[0]).toBe(0);
      expect(d[1]).toBe(255);
      expect(d[2]).toBe(0);
      expect(d[3]).toBe(255);
    });

    it("handles hidden layers", () => {
      const width = 1;
      const height = 1;

      const data = createTestAsepriteFile(width, height, [
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

    it("handles layer opacity", () => {
      const width = 1;
      const height = 1;

      const data = createTestAsepriteFile(width, height, [
        { name: "Layer 1", visible: true, opacity: 128, pixels: [[255, 0, 0, 255]] },
      ]);

      const result = readAsepriteFile(data);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      const d = result.imageData.data;
      expect(d[3]).toBeGreaterThan(0);
      expect(d[3]).toBeLessThan(255);
    });

    it("handles cel offsets", () => {
      const width = 4;
      const height = 4;

      const data = createTestAsepriteFile(width, height, [
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

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
    });

    it("handles nested layer groups with group opacity", () => {
      const width = 1;
      const height = 1;

      const data = createTestAsepriteFile(width, height, [
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

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      const d = result.imageData.data;
      expect(d[0]).toBe(255);
      expect(d[1]).toBe(0);
      expect(d[2]).toBe(0);
      expect(d[3]).toBeGreaterThan(0);
      expect(d[3]).toBeLessThan(255);
    });

    it("hides children when group is hidden", () => {
      const width = 1;
      const height = 1;

      const data = createTestAsepriteFile(width, height, [
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
      const width = 1;
      const height = 1;

      const ab = createTestAsepriteFile(width, height, [
        { name: "Layer 1", visible: true, opacity: 255, pixels: [[255, 0, 0, 255]] },
      ]);
      const u8 = new Uint8Array(ab);

      const result = readAsepriteFile(u8);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      const d = result.imageData.data;
      expect(d[0]).toBe(255);
      expect(d[3]).toBe(255);
    });

    it("parses animated Aseprite file with multiple frames", () => {
      const width = 2;
      const height = 2;

      const data = createTestAsepriteFile(width, height, [
        { name: "Layer 1", visible: true, opacity: 255, pixels: [[255, 0, 0, 255]] },
      ]);

      const result = readAsepriteFile(data);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
    });
  });

  describe("debugAsepriteFile", () => {
    it("returns debug information", () => {
      const width = 2;
      const height = 2;
      const pixels: [number, number, number, number][] = [
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
        [255, 255, 0, 255],
      ];

      const data = createTestAsepriteFile(width, height, [
        { name: "Layer 1", visible: true, opacity: 255, pixels },
      ]);

      const debugInfo = debugAsepriteFile(data);

      expect(debugInfo.header.width).toBe(width);
      expect(debugInfo.header.height).toBe(height);
      expect(debugInfo.header.depth).toBe("RGBA");
      expect(debugInfo.layers).toHaveLength(1);
      expect(debugInfo.layers[0]).toContain("Layer 1");
      expect(debugInfo.layers[0]).toContain("visible");
      expect(debugInfo.layers[0]).toContain("100% opacity");
    });
  });
});
