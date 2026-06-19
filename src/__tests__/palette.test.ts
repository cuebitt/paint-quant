import { describe, it, expect } from "vitest";
import { colorDistance, findNearestPaletteColor, FIXED_PALETTE, type RGB } from "../palette";

describe("colorDistance", () => {
  it("returns 0 for identical colors", () => {
    expect(colorDistance([100, 150, 200], [100, 150, 200])).toBe(0);
  });

  it("computes squared Euclidean distance", () => {
    expect(colorDistance([0, 0, 0], [1, 0, 0])).toBe(1);
    expect(colorDistance([0, 0, 0], [0, 1, 0])).toBe(1);
    expect(colorDistance([0, 0, 0], [0, 0, 1])).toBe(1);
    expect(colorDistance([0, 0, 0], [1, 1, 1])).toBe(3);
    expect(colorDistance([10, 20, 30], [13, 24, 25])).toBe(9 + 16 + 25);
  });

  it("is symmetric", () => {
    const a: RGB = [10, 20, 30];
    const b: RGB = [40, 50, 60];
    expect(colorDistance(a, b)).toBe(colorDistance(b, a));
  });
});

describe("findNearestPaletteColor", () => {
  it("returns 0 for an exact match with first palette color", () => {
    const palette: readonly RGB[] = [
      [100, 100, 100],
      [200, 200, 200],
    ];
    expect(findNearestPaletteColor(100, 100, 100, palette)).toBe(0);
  });

  it("returns the closest color index", () => {
    const palette: readonly RGB[] = [
      [0, 0, 0],
      [255, 255, 255],
    ];
    expect(findNearestPaletteColor(10, 10, 10, palette)).toBe(0);
    expect(findNearestPaletteColor(245, 245, 245, palette)).toBe(1);
  });

  it("works with the full FIXED_PALETTE", () => {
    const idx = findNearestPaletteColor(249, 255, 254, FIXED_PALETTE);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(FIXED_PALETTE.length);
    expect(FIXED_PALETTE[idx]).toEqual([249, 255, 254]);
  });

  it("returns first match when multiple colors are equidistant", () => {
    const palette: readonly RGB[] = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    expect(findNearestPaletteColor(0, 0, 0, palette)).toBe(0);
  });

  it("handles single-color palette", () => {
    const palette: readonly RGB[] = [[50, 50, 50]];
    expect(findNearestPaletteColor(200, 200, 200, palette)).toBe(0);
  });
});
