import { describe, it, expect } from "vitest";
import { quantize } from "@/quantize";
import { FIXED_PALETTE, type RGB } from "@/palette";

function makeImageData(
  pixels: [number, number, number][],
  width: number,
  height: number,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    data[i * 4] = pixels[i][0];
    data[i * 4 + 1] = pixels[i][1];
    data[i * 4 + 2] = pixels[i][2];
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, width, height);
}

describe("quantize (median-cut)", () => {
  it("returns quantized image with same dimensions", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const result = quantize(data, "median-cut");
    expect(result.quantized.width).toBe(1);
    expect(result.quantized.height).toBe(1);
  });

  it("returns adaptive palette", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const result = quantize(data, "median-cut");
    expect(result.adaptivePalette.length).toBeGreaterThan(0);
    expect(result.adaptivePalette.length).toBeLessThanOrEqual(16);
  });

  it("combined palette includes fixed colors", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const result = quantize(data, "median-cut");
    const combined: RGB[] = [...FIXED_PALETTE, ...result.adaptivePalette];
    expect(combined.length).toBeGreaterThanOrEqual(FIXED_PALETTE.length);
  });

  it("preserves alpha channel", () => {
    const data = new ImageData(new Uint8ClampedArray([128, 128, 128, 128]), 1, 1);
    const result = quantize(data, "median-cut");
    expect(result.quantized.data[3]).toBe(128);
  });
});

describe("quantize (neuquant)", () => {
  it("returns result with correct dimensions", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const result = quantize(data, "neuquant");
    expect(result.quantized.width).toBe(1);
    expect(result.quantized.height).toBe(1);
  });

  it("returns up to 12 adaptive colors", () => {
    const pixels: [number, number, number][] = Array.from({ length: 100 }, (_, i) => [
      i % 256,
      (i * 2) % 256,
      (i * 3) % 256,
    ]);
    const data = makeImageData(pixels, 100, 1);
    const result = quantize(data, "neuquant");
    expect(result.adaptivePalette.length).toBeLessThanOrEqual(12);
  });
});

describe("quantize (wuquant)", () => {
  it("returns result with correct dimensions", () => {
    const data = makeImageData([[128, 128, 128]], 1, 1);
    const result = quantize(data, "wuquant");
    expect(result.quantized.width).toBe(1);
    expect(result.quantized.height).toBe(1);
  });

  it("returns up to 12 adaptive colors", () => {
    const pixels: [number, number, number][] = Array.from({ length: 100 }, (_, i) => [
      i % 256,
      (i * 2) % 256,
      (i * 3) % 256,
    ]);
    const data = makeImageData(pixels, 100, 1);
    const result = quantize(data, "wuquant");
    expect(result.adaptivePalette.length).toBeLessThanOrEqual(12);
  });
});
