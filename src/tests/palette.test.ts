import { describe, it, expect } from "vite-plus/test";
import { rgbToHex, hexToRgb, FIXED_PALETTE } from "../core/palette";

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
