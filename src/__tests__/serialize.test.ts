import { describe, it, expect } from "vitest";
import { serializeQuantizedImage, serializePaintFile } from "../serialize";
import { FIXED_PALETTE, type RGB } from "../palette";
import { CANVAS_TYPES } from "../types";

function makeImageData(pixels: RGB[], width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    data[i * 4] = pixels[i][0];
    data[i * 4 + 1] = pixels[i][1];
    data[i * 4 + 2] = pixels[i][2];
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, width, height);
}

describe("serializeQuantizedImage", () => {
  const canvasType = CANVAS_TYPES[0]; // 1x1 Canvas, 16x16

  it("returns version 1", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializeQuantizedImage({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.version).toBe(1);
  });

  it("maps canvas type name correctly", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializeQuantizedImage({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.canvasType).toBe("SMALL");
  });

  it("encodes pixels using fixed palette chars", () => {
    const data = makeImageData([FIXED_PALETTE[0]], 1, 1);
    const result = serializeQuantizedImage({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.pixels).toBe("F"); // FIXED_PALETTE[0] maps to "F"
  });

  it("encodes adaptive palette pixels as G-R", () => {
    const adaptiveColor: RGB = [255, 0, 0];
    const data = makeImageData([adaptiveColor], 1, 1);
    const result = serializeQuantizedImage({
      quantized: data,
      adaptivePalette: [adaptiveColor],
      canvasType,
    });
    expect(result.pixels).toBe("G");
  });

  it("slices adaptive palette to 12 colors", () => {
    const manyColors: RGB[] = Array.from({ length: 20 }, (_, i) => [i * 10, 0, 0] as RGB);
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializeQuantizedImage({
      quantized: data,
      adaptivePalette: manyColors,
      canvasType,
    });
    expect(result.palette.length).toBe(12);
  });

  it("produces one character per pixel", () => {
    const pixels: RGB[] = [
      [0, 0, 0],
      [255, 255, 255],
      [128, 128, 128],
    ];
    const data = makeImageData(pixels, 3, 1);
    const result = serializeQuantizedImage({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.pixels.length).toBe(3);
  });

  it("returns pixels array", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializePaintFile({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(Array.isArray(result.pixels)).toBe(true);
    expect(result.pixels.length).toBe(1);
  });

  it("returns generation 0 for editable painting", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializePaintFile({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.generation).toBe(0);
  });

  it("returns canvas type mapping", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializePaintFile({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.ct).toBe("SMALL");
  });

  it("returns v 99 for editable painting", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializePaintFile({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.v).toBe(99);
  });

  it("has optional author and title fields", () => {
    const data = makeImageData([[100, 100, 100]], 1, 1);
    const result = serializePaintFile({
      quantized: data,
      adaptivePalette: [],
      canvasType,
    });
    expect(result.author).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.name).toBe("string");
  });
});
