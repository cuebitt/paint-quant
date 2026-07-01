import { describe, it, expect } from "vite-plus/test";
import {
  CANVAS_TYPES,
  ALLOWED_CANVAS_TYPES_FOR_FORMAT,
  findClosestCanvas,
  PAINT_FORMATS,
  FIT_MODES,
} from "../types";

describe("CANVAS_TYPES", () => {
  it("has 10 canvas types", () => {
    expect(CANVAS_TYPES).toHaveLength(10);
  });

  it("each canvas type has required fields", () => {
    for (const ct of CANVAS_TYPES) {
      expect(ct.name).toBeTruthy();
      expect(ct.width).toBeGreaterThan(0);
      expect(ct.height).toBeGreaterThan(0);
      expect(ct.cellsX).toBeGreaterThan(0);
      expect(ct.cellsY).toBeGreaterThan(0);
    }
  });
});

describe("ALLOWED_CANVAS_TYPES_FOR_FORMAT", () => {
  it("has entries for all paint formats", () => {
    expect(ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-1x"]).toBeDefined();
    expect(ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-delta"]).toBeDefined();
    expect(ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-2x"]).toBeDefined();
  });

  it("jop-delta allows all canvas types", () => {
    expect(ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-delta"].size).toBe(CANVAS_TYPES.length);
  });

  it("jop-1x and jop-2x allow only subset of canvas types", () => {
    const allowed1x = ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-1x"];
    const allowed2x = ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-2x"];
    expect(allowed1x.size).toBeLessThan(CANVAS_TYPES.length);
    expect(allowed2x.size).toBeLessThan(CANVAS_TYPES.length);
    expect(allowed1x.size).toBe(allowed2x.size);
  });
});

describe("findClosestCanvas", () => {
  it("returns same canvas if already allowed", () => {
    const canvas = CANVAS_TYPES[0]!;
    expect(findClosestCanvas(canvas, "jop-delta")).toBe(canvas);
  });

  it("finds closest canvas by area when current is not allowed", () => {
    const large = CANVAS_TYPES.find((c) => c.name === "4×4 Large Square")!;
    const result = findClosestCanvas(large, "jop-1x");
    expect(ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-1x"].has(result.name)).toBe(true);
  });

  it("finds closest canvas by area for tall canvas in jop-1x", () => {
    const tall = CANVAS_TYPES.find((c) => c.name === "2×3 Medium")!;
    const result = findClosestCanvas(tall, "jop-1x");
    expect(ALLOWED_CANVAS_TYPES_FOR_FORMAT["jop-1x"].has(result.name)).toBe(true);
  });

  it("returns first canvas type as fallback if no allowed types exist", () => {
    const mockCanvas = { name: "nonexistent", width: 1, height: 1, cellsX: 1, cellsY: 1 };
    const result = findClosestCanvas(mockCanvas, "jop-delta");
    expect(result).toBe(CANVAS_TYPES[0]!);
  });

  it("prefers smaller area when tie-breaking", () => {
    const tiny = { name: "tiny", width: 1, height: 1, cellsX: 1, cellsY: 1 };
    const result = findClosestCanvas(tiny, "jop-1x");
    expect(result.name).toBe("1×1 Canvas");
  });
});

describe("PAINT_FORMATS", () => {
  it("has 3 formats", () => {
    expect(PAINT_FORMATS).toHaveLength(3);
  });

  it("each format has value, label, and description", () => {
    for (const f of PAINT_FORMATS) {
      expect(f.value).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(f.description).toBeTruthy();
    }
  });
});

describe("FIT_MODES", () => {
  it("has 3 fit modes", () => {
    expect(FIT_MODES).toHaveLength(3);
  });

  it("each mode has value and label", () => {
    for (const m of FIT_MODES) {
      expect(m.value).toBeTruthy();
      expect(m.label).toBeTruthy();
    }
  });
});
