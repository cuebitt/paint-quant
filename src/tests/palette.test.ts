import { describe, it, expect } from "vite-plus/test";
import { rgbToHex, hexToRgb, rgbaToHex, hexToRgba, FIXED_PALETTE } from "../core/palette";

describe("rgbToHex", () => {
  it("converts pure red to hex", () => {
    expect(rgbToHex([255, 0, 0])).toBe("#ff0000");
  });

  it("converts pure green to hex", () => {
    expect(rgbToHex([0, 255, 0])).toBe("#00ff00");
  });

  it("converts pure blue to hex", () => {
    expect(rgbToHex([0, 0, 255])).toBe("#0000ff");
  });

  it("converts black to hex", () => {
    expect(rgbToHex([0, 0, 0])).toBe("#000000");
  });

  it("converts white to hex", () => {
    expect(rgbToHex([255, 255, 255])).toBe("#ffffff");
  });

  it("pads single-digit hex values", () => {
    expect(rgbToHex([1, 2, 3])).toBe("#010203");
  });
});

describe("hexToRgb", () => {
  it("converts hex to RGB for red", () => {
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
  });

  it("converts hex to RGB for green", () => {
    expect(hexToRgb("#00ff00")).toEqual([0, 255, 0]);
  });

  it("converts hex to RGB for blue", () => {
    expect(hexToRgb("#0000ff")).toEqual([0, 0, 255]);
  });

  it("converts hex to RGB for black", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("converts hex to RGB for white", () => {
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });

  it("roundtrips with rgbToHex", () => {
    const original: [number, number, number] = [128, 64, 32];
    expect(hexToRgb(rgbToHex(original))).toEqual(original);
  });
});

describe("FIXED_PALETTE", () => {
  it("has 16 colors", () => {
    expect(FIXED_PALETTE).toHaveLength(16);
  });

  it("all entries are valid RGB tuples", () => {
    for (const [r, g, b] of FIXED_PALETTE) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});

describe("rgbaToHex", () => {
  it("converts RGB + alpha to 8-char hex", () => {
    expect(rgbaToHex([255, 0, 0], 1)).toBe("#ff0000ff");
  });

  it("converts with half alpha", () => {
    expect(rgbaToHex([0, 255, 0], 0.5)).toBe("#00ff0080");
  });

  it("converts with zero alpha", () => {
    expect(rgbaToHex([0, 0, 255], 0)).toBe("#0000ff00");
  });

  it("rounds alpha to nearest byte", () => {
    const result = rgbaToHex([128, 128, 128], 0.5);
    expect(result).toHaveLength(9);
  });
});

describe("hexToRgba", () => {
  it("parses 8-char hex with alpha", () => {
    const result = hexToRgba("#ff000080");
    expect(result.color).toEqual([255, 0, 0]);
    expect(result.alpha).toBeCloseTo(128 / 255);
  });

  it("parses 6-char hex (defaults alpha to 1)", () => {
    const result = hexToRgba("#00ff00");
    expect(result.color).toEqual([0, 255, 0]);
    expect(result.alpha).toBe(1);
  });

  it("roundtrips with rgbaToHex", () => {
    const original = { color: [50, 100, 150] as [number, number, number], alpha: 0.75 };
    const hex = rgbaToHex(original.color, original.alpha);
    const result = hexToRgba(hex);
    expect(result.color).toEqual(original.color);
    expect(result.alpha).toBeCloseTo(original.alpha, 2);
  });

  it("parses fully transparent hex", () => {
    const result = hexToRgba("#00000000");
    expect(result.color).toEqual([0, 0, 0]);
    expect(result.alpha).toBe(0);
  });
});
