import { describe, it, expect } from "vite-plus/test";
import { writePaintFile, readPaintFile, getCanvasTypeIndex } from "@/formats/paint-nbt";
import type { PaintingData } from "@/formats/paint-nbt";
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
  it("maps every supported canvas size to its index", () => {
    // Canvas type indices follow the .paint file spec order, not CANVAS_TYPES order.
    const expected = [0, 2, 3, 1, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < CANVAS_TYPES.length; i++) {
      expect(getCanvasTypeIndex(CANVAS_TYPES[i]!)).toBe(expected[i]);
    }
  });

  it("throws for unknown dimensions", () => {
    expect(() =>
      getCanvasTypeIndex({ name: "Custom", width: 100, height: 100, cellsX: 5, cellsY: 5 }),
    ).toThrow("Unsupported canvas dimensions");
  });
});

describe("writePaintFile", () => {
  it("rejects invalid canvas types", async () => {
    await expect(writePaintFile(makePaintData(-1, 256))).rejects.toThrow("Invalid canvas type");
    await expect(writePaintFile(makePaintData(10, 256))).rejects.toThrow("Invalid canvas type");
  });

  it("rejects a pixel count that does not match the canvas", async () => {
    await expect(writePaintFile(makePaintData(0, 100))).rejects.toThrow("Expected 256 pixels");
    await expect(writePaintFile(makePaintData(1, 100))).rejects.toThrow("Expected 1024 pixels");
    await expect(writePaintFile(makePaintData(4, 100))).rejects.toThrow("Expected 2304 pixels");
  });

  it("writes a non-empty Uint8Array for valid input", async () => {
    const result = await writePaintFile(makePaintData(0, 256));
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});

describe("readPaintFile", () => {
  it("round-trips a Small canvas", async () => {
    const data = makePaintData(0, 256);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(0);
    expect(result.pixels).toHaveLength(256);
    expect(result.name).toBe("test_painting");
    expect(result.generation).toBe(0);
    expect(result.version).toBe(99);
  });

  it("round-trips a Large canvas", async () => {
    const data = makePaintData(1, 1024);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(1);
    expect(result.pixels).toHaveLength(1024);
  });

  it("round-trips a non-square canvas", async () => {
    const data = makePaintData(2, 512);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(2);
    expect(result.pixels).toHaveLength(512);
  });

  it("round-trips a big square canvas", async () => {
    const data = makePaintData(4, 2304);
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.canvasType).toBe(4);
    expect(result.pixels).toHaveLength(2304);
  });

  it("preserves RGB values through ARGB encoding", async () => {
    const data = makePaintData(0, 256);
    const result = await readPaintFile(await writePaintFile(data));
    for (let i = 0; i < data.pixels.length; i++) {
      expect(result.pixels[i]).toEqual(data.pixels[i]);
    }
  });

  it("preserves author and title when both are provided", async () => {
    const data = makePaintData(0, 256, { author: "Player", title: "Sunset" });
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.author).toBe("Player");
    expect(result.title).toBe("Sunset");
  });

  it("drops author and title unless both are provided", async () => {
    const onlyAuthor = makePaintData(0, 256, { author: "Player", title: "" });
    const onlyTitle = makePaintData(0, 256, { author: "", title: "Sunset" });
    const neither = makePaintData(0, 256, { author: "", title: "" });

    for (const data of [onlyAuthor, onlyTitle, neither]) {
      const result = await readPaintFile(await writePaintFile(data));
      expect(result.author).toBe("");
      expect(result.title).toBe("");
    }
  });

  it("preserves generation and version fields", async () => {
    const data = makePaintData(0, 256, { generation: 1, version: 2 });
    const result = await readPaintFile(await writePaintFile(data));
    expect(result.generation).toBe(1);
    expect(result.version).toBe(2);
  });
});
