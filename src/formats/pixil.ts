import { createCanvas, getContext2D, loadImage } from "@/formats/canvas";

interface PixilLayerOptions {
  blend: string;
  alpha_lock: boolean;
  locked: boolean;
  filter: Record<string, unknown>;
}

interface PixilLayer {
  id: number;
  src: string;
  name: string;
  opacity: number;
  active?: boolean;
  edit?: boolean;
  unqid?: string;
  options?: PixilLayerOptions;
}

interface PixilFrame {
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

  const images = await Promise.all(firstFrame.layers.map((layer) => loadImage(layer.src)));
  for (let i = 0; i < firstFrame.layers.length; i++) {
    ctx.globalAlpha = firstFrame.layers[i]!.opacity;
    ctx.drawImage(images[i]!, 0, 0);
  }
  ctx.globalAlpha = 1;

  return canvas;
}
