import { describe, it, expect } from "vite-plus/test";
import { writePaintFile, readPaintFile, getCanvasTypeIndex } from "@/paint-nbt";
import type { PaintingData } from "@/paint-nbt";
import { CANVAS_TYPES } from "@/types";

function makePaintData(
  canvasType: number,
  pixelCount: number,
  overrides: Partial<PaintingData> = {},
): PaintingData {
  const pixels: [number, number, number][] = Array.from({ length: pixelCount }, (_, i) => [
    (i * 37) & 0xff,
    (i * 73) & 0xff,
    (i * 113) & 0xff,
  ]);
  return {
    canvasType,
    pixels,
    name: "test_painting",
    author: "",
    title: "",
    generation: 0,
    version: 99,
    ...overrides,
  };
}

describe("getCanvasTypeIndex", () => {
  it("returns 0 for 16×16 (Small)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[0])).toBe(0);
  });

  it("returns 2 for 32×16 (Long)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[1])).toBe(2);
  });

  it("returns 3 for 16×32 (Tall)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[2])).toBe(3);
  });

  it("returns 1 for 32×32 (Large)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[3])).toBe(1);
  });

  it("returns 4 for 48×48 (Extra Large)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[4])).toBe(4);
  });

  it("returns 5 for 64×64 (Extra Extra Large)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[5])).toBe(5);
  });

  it("returns 6 for 48×32 (Extra Long)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[6])).toBe(6);
  });

  it("returns 7 for 64×48 (Extra Extra Long)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[7])).toBe(7);
  });

  it("returns 8 for 32×48 (Extra Tall)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[8])).toBe(8);
  });

  it("returns 9 for 48×64 (Extra Extra Tall)", () => {
    expect(getCanvasTypeIndex(CANVAS_TYPES[9])).toBe(9);
  });

  it("throws for unsupported canvas dimensions", () => {
    expect(() =>
      getCanvasTypeIndex({ name: "Custom", width: 100, height: 100, cellsX: 5, cellsY: 5 }),
    ).toThrow("Unsupported canvas dimensions");
  });
});

describe("writePaintFile", () => {
  it("throws for canvasType < 0", async () => {
    const data = makePaintData(-1, 256);
    await expect(writePaintFile(data)).rejects.toThrow("Invalid canvas type");
  });

  it("throws for canvasType > 9", async () => {
    const data = makePaintData(10, 256);
    await expect(writePaintFile(data)).rejects.toThrow("Invalid canvas type");
  });

  it("throws for wrong pixel count on Small canvas", async () => {
    const data = makePaintData(0, 100);
    await expect(writePaintFile(data)).rejects.toThrow("Expected 256 pixels");
  });

  it("throws for wrong pixel count on Large canvas", async () => {
    const data = makePaintData(1, 256);
    await expect(writePaintFile(data)).rejects.toThrow("Expected 1024 pixels");
  });

  it("throws for wrong pixel count on Extra Large canvas", async () => {
    const data = makePaintData(4, 100);
    await expect(writePaintFile(data)).rejects.toThrow("Expected 2304 pixels");
  });

  it("returns a Uint8Array", async () => {
    const data = makePaintData(0, 256);
    const result = await writePaintFile(data);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});

describe("readPaintFile", () => {
  it("round-trips Small canvas (ct=0, 256 pixels)", async () => {
    const data = makePaintData(0, 256);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(0);
    expect(result.pixels).toHaveLength(256);
    expect(result.name).toBe("test_painting");
    expect(result.generation).toBe(0);
    expect(result.version).toBe(99);
  });

  it("round-trips Large canvas (ct=1, 1024 pixels)", async () => {
    const data = makePaintData(1, 1024);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(1);
    expect(result.pixels).toHaveLength(1024);
  });

  it("round-trips Long canvas (ct=2, 512 pixels)", async () => {
    const data = makePaintData(2, 512);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(2);
    expect(result.pixels).toHaveLength(512);
  });

  it("round-trips Tall canvas (ct=3, 512 pixels)", async () => {
    const data = makePaintData(3, 512);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(3);
    expect(result.pixels).toHaveLength(512);
  });

  it("round-trips Extra Large canvas (ct=4, 2304 pixels)", async () => {
    const data = makePaintData(4, 2304);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(4);
    expect(result.pixels).toHaveLength(2304);
  });

  it("round-trips Extra Extra Large canvas (ct=5, 4096 pixels)", async () => {
    const data = makePaintData(5, 4096);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(5);
    expect(result.pixels).toHaveLength(4096);
  });

  it("round-trips Extra Long canvas (ct=6, 1536 pixels)", async () => {
    const data = makePaintData(6, 1536);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(6);
    expect(result.pixels).toHaveLength(1536);
  });

  it("round-trips Extra Extra Long canvas (ct=7, 3072 pixels)", async () => {
    const data = makePaintData(7, 3072);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(7);
    expect(result.pixels).toHaveLength(3072);
  });

  it("round-trips Extra Tall canvas (ct=8, 1536 pixels)", async () => {
    const data = makePaintData(8, 1536);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(8);
    expect(result.pixels).toHaveLength(1536);
  });

  it("round-trips Extra Extra Tall canvas (ct=9, 3072 pixels)", async () => {
    const data = makePaintData(9, 3072);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.canvasType).toBe(9);
    expect(result.pixels).toHaveLength(3072);
  });

  it("preserves RGB pixel values through ARGB conversion", async () => {
    const data = makePaintData(0, 256);
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    for (let i = 0; i < data.pixels.length; i++) {
      expect(result.pixels[i]).toEqual(data.pixels[i]);
    }
  });

  it("includes author and title when both are present", async () => {
    const data = makePaintData(0, 256, { author: "Player", title: "Sunset" });
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.author).toBe("Player");
    expect(result.title).toBe("Sunset");
  });

  it("excludes author and title when both are empty", async () => {
    const data = makePaintData(0, 256, { author: "", title: "" });
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.author).toBe("");
    expect(result.title).toBe("");
  });

  it("excludes author and title when only one is provided", async () => {
    const data = makePaintData(0, 256, { author: "Player", title: "" });
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.author).toBe("");
    expect(result.title).toBe("");
  });

  it("preserves generation and version fields", async () => {
    const data = makePaintData(0, 256, { generation: 1, version: 2 });
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.generation).toBe(1);
    expect(result.version).toBe(2);
  });

  it("round-trips locked/signed painting (generation=1, v=2)", async () => {
    const data = makePaintData(0, 256, {
      generation: 1,
      version: 2,
      author: "Player",
      title: "My Art",
    });
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.generation).toBe(1);
    expect(result.version).toBe(2);
    expect(result.author).toBe("Player");
    expect(result.title).toBe("My Art");
  });

  it("excludes author and title when locked but both are empty", async () => {
    const data = makePaintData(0, 256, { generation: 1, version: 2 });
    const buf = await writePaintFile(data);
    const result = await readPaintFile(buf);
    expect(result.generation).toBe(1);
    expect(result.version).toBe(2);
    expect(result.author).toBe("");
    expect(result.title).toBe("");
  });
});
