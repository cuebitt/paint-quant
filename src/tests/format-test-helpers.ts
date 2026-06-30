import { createCanvas } from "canvas";

export function makePngDataUri(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
): string {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL("image/png");
}

export function readPixel(canvas: HTMLCanvasElement | OffscreenCanvas): Uint8ClampedArray {
  const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;
  return ctx.getImageData(0, 0, 1, 1).data;
}
