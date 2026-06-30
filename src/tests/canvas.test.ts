import { describe, it, expect } from "vite-plus/test";
import { loadImage, createCanvas, getContext2D } from "../formats/canvas";

describe("createCanvas", () => {
  it("creates a canvas with correct dimensions", () => {
    const canvas = createCanvas(100, 200);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(200);
  });

  it("creates a canvas with zero dimensions", () => {
    const canvas = createCanvas(0, 0);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
});

describe("getContext2D", () => {
  it("returns a 2D context from a canvas", () => {
    const canvas = createCanvas(10, 10);
    const ctx = getContext2D(canvas);
    expect(ctx).toBeTruthy();
    expect(typeof ctx.fillRect).toBe("function");
    expect(typeof ctx.getImageData).toBe("function");
  });

  it("can draw on the returned context", () => {
    const canvas = createCanvas(10, 10);
    const ctx = getContext2D(canvas);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 10, 10);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    expect(data[0]).toBe(255);
    expect(data[1]).toBe(0);
    expect(data[2]).toBe(0);
    expect(data[3]).toBe(255);
  });
});

describe("loadImage", () => {
  it("loads a valid PNG data URI", async () => {
    const canvas = createCanvas(2, 2);
    const ctx = getContext2D(canvas);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 2, 2);
    const dataUri =
      (canvas as HTMLCanvasElement).toDataURL?.("image/png") ??
      `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8ClampedArray(ctx.getImageData(0, 0, 2, 2).data.buffer)))}`;

    const img = await loadImage(dataUri);
    expect(img).toBeTruthy();
    expect(img.width).toBe(2);
    expect(img.height).toBe(2);
  });

  it("rejects invalid data URI without comma", async () => {
    await expect(loadImage("not-a-data-uri")).rejects.toThrow("missing base64 separator");
  });
});
