import { describe, it, expect } from "vite-plus/test";
import { createCanvas } from "canvas";
import { parsePiskel, type PiskelFile } from "../formats/piskel";

function makePngDataUri(width: number, height: number, r: number, g: number, b: number): string {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL("image/png");
}

interface LayerDef {
  name: string;
  opacity: number;
  frameCount: number;
  base64PNG: string;
  layout?: number[][];
}

function buildPiskelJson(
  modelVersion: number,
  width: number,
  height: number,
  layers: LayerDef[],
): string {
  const layerStrings = layers.map((def) => {
    if (modelVersion === 1) {
      return JSON.stringify({
        name: def.name,
        opacity: def.opacity,
        frameCount: def.frameCount,
        base64PNG: def.base64PNG,
      });
    }
    return JSON.stringify({
      name: def.name,
      opacity: def.opacity,
      frameCount: def.frameCount,
      chunks: [{ layout: def.layout ?? [[0]], base64PNG: def.base64PNG }],
    });
  });

  const file: PiskelFile = {
    modelVersion,
    piskel: {
      name: "test",
      description: "",
      fps: 12,
      width,
      height,
      layers: layerStrings,
    },
  };
  return JSON.stringify(file);
}

function readPixel(canvas: HTMLCanvasElement | OffscreenCanvas): Uint8ClampedArray {
  const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;
  return ctx.getImageData(0, 0, 1, 1).data;
}

describe("parsePiskel", () => {
  it("reads a v2 file with one layer", async () => {
    const png = makePngDataUri(2, 2, 255, 0, 0);
    const canvas = (await parsePiskel(
      buildPiskelJson(2, 2, 2, [{ name: "Layer 1", opacity: 1, frameCount: 1, base64PNG: png }]),
    )) as HTMLCanvasElement;

    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);
    const pixel = readPixel(canvas);
    expect(pixel[0]).toBe(255);
    expect(pixel[1]).toBe(0);
    expect(pixel[2]).toBe(0);
    expect(pixel[3]).toBe(255);
  });

  it("reads a v1 file with one layer", async () => {
    const png = makePngDataUri(2, 2, 255, 0, 0);
    const canvas = (await parsePiskel(
      buildPiskelJson(1, 2, 2, [{ name: "Layer 1", opacity: 1, frameCount: 1, base64PNG: png }]),
    )) as HTMLCanvasElement;

    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);
    const pixel = readPixel(canvas);
    expect(pixel[0]).toBe(255);
    expect(pixel[1]).toBe(0);
    expect(pixel[2]).toBe(0);
    expect(pixel[3]).toBe(255);
  });

  it("composites layers top-down", async () => {
    const red = makePngDataUri(1, 1, 255, 0, 0);
    const green = makePngDataUri(1, 1, 0, 255, 0);
    const canvas = (await parsePiskel(
      buildPiskelJson(2, 1, 1, [
        { name: "Bottom", opacity: 1, frameCount: 1, base64PNG: red },
        { name: "Top", opacity: 1, frameCount: 1, base64PNG: green },
      ]),
    )) as HTMLCanvasElement;

    const pixel = readPixel(canvas);
    expect(pixel[0]).toBe(0);
    expect(pixel[1]).toBe(255);
    expect(pixel[2]).toBe(0);
    expect(pixel[3]).toBe(255);
  });

  it("applies layer opacity when compositing", async () => {
    const red = makePngDataUri(1, 1, 255, 0, 0);
    const green = makePngDataUri(1, 1, 0, 255, 0);
    const canvas = (await parsePiskel(
      buildPiskelJson(2, 1, 1, [
        { name: "Bottom", opacity: 1, frameCount: 1, base64PNG: red },
        { name: "Top", opacity: 0.5, frameCount: 1, base64PNG: green },
      ]),
    )) as HTMLCanvasElement;

    const pixel = readPixel(canvas);
    expect(pixel[0]).toBeGreaterThan(0);
    expect(pixel[1]).toBeGreaterThan(0);
    expect(pixel[3]).toBe(255);
  });

  it("finds frame 0 across multiple chunks", async () => {
    const png = makePngDataUri(2, 2, 255, 0, 0);
    const canvas = (await parsePiskel(
      buildPiskelJson(2, 2, 2, [
        { name: "Layer 1", opacity: 1, frameCount: 3, base64PNG: png, layout: [[1, 0]] },
      ]),
    )) as HTMLCanvasElement;

    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);
  });

  it("throws when frame 0 is missing", async () => {
    const png = makePngDataUri(2, 2, 255, 0, 0);
    const json = buildPiskelJson(2, 2, 2, [
      { name: "Layer 1", opacity: 1, frameCount: 2, base64PNG: png, layout: [[1]] },
    ]);

    await expect(parsePiskel(json)).rejects.toThrow("Frame index 0 not found");
  });
});
