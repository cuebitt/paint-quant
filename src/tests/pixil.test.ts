import { describe, it, expect } from "vite-plus/test";
import { makePngDataUri, readPixel } from "./format-test-helpers";
import { parsePixil, type PixilFile } from "../formats/pixil";

interface LayerDef {
  name: string;
  opacity: number;
  src: string;
}

function buildPixilJson(width: number, height: number, layers: LayerDef[]): string {
  const file: PixilFile = {
    application: "pixil",
    type: ".pixil",
    version: "2.7.0",
    width,
    height,
    frames: [
      {
        name: "",
        speed: 100,
        layers: layers.map((def, i) => ({
          id: i,
          src: def.src,
          name: def.name,
          opacity: def.opacity,
          active: true,
          options: {
            blend: "source-over",
            alpha_lock: false,
            locked: false,
            filter: {},
          },
        })),
        active: true,
        selectedLayer: 0,
      },
    ],
  };
  return JSON.stringify(file);
}

describe("parsePixil", () => {
  it("reads a single-layer file", async () => {
    const png = makePngDataUri(2, 2, 255, 0, 0);
    const canvas = (await parsePixil(
      buildPixilJson(2, 2, [{ name: "Background", opacity: 1, src: png }]),
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
    const canvas = (await parsePixil(
      buildPixilJson(1, 1, [
        { name: "Bottom", opacity: 1, src: red },
        { name: "Top", opacity: 1, src: green },
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
    const canvas = (await parsePixil(
      buildPixilJson(1, 1, [
        { name: "Bottom", opacity: 1, src: red },
        { name: "Top", opacity: 0.5, src: green },
      ]),
    )) as HTMLCanvasElement;

    const pixel = readPixel(canvas);
    // Red (255,0,0) at 50% over green (0,255,0) at 100%
    // Canvas globalAlpha compositing: 255*0.5 = 127.5 → 127 or 128
    expect(pixel[0]).toBeGreaterThanOrEqual(127);
    expect(pixel[0]).toBeLessThanOrEqual(128);
    expect(pixel[1]).toBeGreaterThanOrEqual(127);
    expect(pixel[1]).toBeLessThanOrEqual(128);
    expect(pixel[3]).toBe(255);
  });

  it("falls back to plain base64 when the data URI MIME type is malformed", async () => {
    const standardPng = makePngDataUri(1, 1, 255, 0, 0);
    const base64Data = standardPng.split(",")[1] ?? "";
    const weirdUri = `data:image/pngp98kjasdnasd983/24kasdjasdbase64,${base64Data}`;
    const canvas = (await parsePixil(
      buildPixilJson(1, 1, [{ name: "Layer", opacity: 1, src: weirdUri }]),
    )) as HTMLCanvasElement;

    const pixel = readPixel(canvas);
    expect(pixel[0]).toBe(255);
    expect(pixel[1]).toBe(0);
    expect(pixel[2]).toBe(0);
    expect(pixel[3]).toBe(255);
  });

  it("throws when the file has no frames", async () => {
    const json = JSON.stringify({
      application: "pixil",
      type: ".pixil",
      version: "2.7.0",
      width: 10,
      height: 10,
      frames: [],
    });

    await expect(parsePixil(json)).rejects.toThrow("no frames");
  });
});
