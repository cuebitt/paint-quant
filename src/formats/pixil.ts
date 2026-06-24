import { createCanvas, getContext2D, loadImage } from "@/formats/canvas";

export interface PixilLayerOptions {
  blend: string;
  alpha_lock: boolean;
  locked: boolean;
  filter: Record<string, unknown>;
}

export interface PixilLayer {
  id: number;
  src: string;
  name: string;
  opacity: number;
  active?: boolean;
  edit?: boolean;
  unqid?: string;
  options?: PixilLayerOptions;
}

export interface PixilFrame {
  name: string;
  speed: number;
  layers: PixilLayer[];
  active?: boolean;
  selectedLayer?: number;
  unqid?: string;
  preview?: string;
  width?: number;
  height?: number;
}

export interface PixilFile {
  application: string;
  type: string;
  version: string;
  width: number;
  height: number;
  frames: PixilFrame[];
  currentFrame?: number;
  speed?: number;
  name?: string;
  preview?: string;
  colors?: Record<string, string[]>;
}

export async function parsePixil(json: string): Promise<HTMLCanvasElement | OffscreenCanvas> {
  const file: PixilFile = JSON.parse(json);
  const { width, height, frames } = file;

  if (frames.length === 0) {
    throw new Error("Pixil file contains no frames");
  }

  const firstFrame = frames[0];
  if (!firstFrame) {
    throw new Error("Pixil file contains no frames");
  }

  const canvas = createCanvas(width, height);
  const ctx = getContext2D(canvas);

  for (const layer of firstFrame.layers) {
    const img = await loadImage(layer.src);
    ctx.globalAlpha = layer.opacity;
    ctx.drawImage(img, 0, 0);
  }
  ctx.globalAlpha = 1;

  return canvas;
}
