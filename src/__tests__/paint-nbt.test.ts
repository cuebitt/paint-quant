import { describe, it, expect } from "vitest";
import { writePaintFile, readPaintFile, getCanvasTypeIndex } from "../paint-nbt";
import type { PaintingData } from "../paint-nbt";
import { CANVAS_TYPES } from "../types";

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

  it("throws for unsupported canvas dimensions", () => {
    expect(() =>
      getCanvasTypeIndex({ name: "Custom", width: 48, height: 48, cellsX: 3, cellsY: 3 }),
    ).toThrow("Unsupported canvas dimensions");
  });
});

describe("writePaintFile", () => {
  it("throws for canvasType < 0", () => {
    const data = makePaintData(-1, 256);
    expect(() => writePaintFile(data)).toThrow("Invalid canvas type");
  });

  it("throws for canvasType > 3", () => {
    const data = makePaintData(4, 256);
    expect(() => writePaintFile(data)).toThrow("Invalid canvas type");
  });

  it("throws for wrong pixel count on Small canvas", () => {
    const data = makePaintData(0, 100);
    expect(() => writePaintFile(data)).toThrow("Expected 256 pixels");
  });

  it("throws for wrong pixel count on Large canvas", () => {
    const data = makePaintData(1, 256);
    expect(() => writePaintFile(data)).toThrow("Expected 1024 pixels");
  });

  it("returns a Uint8Array", () => {
    const data = makePaintData(0, 256);
    const result = writePaintFile(data);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});

describe("readPaintFile", () => {
  it("round-trips Small canvas (ct=0, 256 pixels)", () => {
    const data = makePaintData(0, 256);
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.canvasType).toBe(0);
    expect(result.pixels).toHaveLength(256);
    expect(result.name).toBe("test_painting");
    expect(result.generation).toBe(0);
    expect(result.version).toBe(99);
  });

  it("round-trips Large canvas (ct=1, 1024 pixels)", () => {
    const data = makePaintData(1, 1024);
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.canvasType).toBe(1);
    expect(result.pixels).toHaveLength(1024);
  });

  it("round-trips Long canvas (ct=2, 512 pixels)", () => {
    const data = makePaintData(2, 512);
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.canvasType).toBe(2);
    expect(result.pixels).toHaveLength(512);
  });

  it("round-trips Tall canvas (ct=3, 512 pixels)", () => {
    const data = makePaintData(3, 512);
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.canvasType).toBe(3);
    expect(result.pixels).toHaveLength(512);
  });

  it("preserves RGB pixel values through ARGB conversion", () => {
    const data = makePaintData(0, 256);
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    for (let i = 0; i < data.pixels.length; i++) {
      expect(result.pixels[i]).toEqual(data.pixels[i]);
    }
  });

  it("includes author and title when both are present", () => {
    const data = makePaintData(0, 256, { author: "Player", title: "Sunset" });
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.author).toBe("Player");
    expect(result.title).toBe("Sunset");
  });

  it("excludes author and title when both are empty", () => {
    const data = makePaintData(0, 256, { author: "", title: "" });
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.author).toBe("");
    expect(result.title).toBe("");
  });

  it("excludes author and title when only one is provided", () => {
    const data = makePaintData(0, 256, { author: "Player", title: "" });
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.author).toBe("");
    expect(result.title).toBe("");
  });

  it("preserves generation and version fields", () => {
    const data = makePaintData(0, 256, { generation: 1, version: 2 });
    const buf = writePaintFile(data);
    const result = readPaintFile(buf);
    expect(result.generation).toBe(1);
    expect(result.version).toBe(2);
  });
});
