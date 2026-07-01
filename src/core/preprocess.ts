import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";
import { computeScale, rgbString } from "@/core/image-utils";

export const DEFAULT_PADDING_COLOR: RGB = [255, 255, 255];

export type ResizeFilter = "nearest" | "box" | "hamming" | "lanczos2" | "lanczos3" | "mks2013";

export interface ResizeOptions {
  filter: ResizeFilter;
  unsharpAmount: number;
}

let picaPromise: Promise<typeof import("pica")> | null = null;

async function getPica() {
  if (!picaPromise) {
    picaPromise = import("pica");
  }
  const mod = await picaPromise;
  return mod.default();
}

const pooledCanvases: HTMLCanvasElement[] = [];

function acquireCanvas(w: number, h: number): HTMLCanvasElement {
  let canvas = pooledCanvases.pop();
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  if (pooledCanvases.length < 4) pooledCanvases.push(canvas);
}

export const preprocessImageForCanvas = async (
  image: HTMLImageElement,
  canvasType: CanvasType,
  fitMode: ImageFitMode = "contain",
  paddingColor: RGB = DEFAULT_PADDING_COLOR,
  resizeOptions: ResizeOptions = { filter: "nearest", unsharpAmount: 0 },
  paddingAlpha?: number,
): Promise<ImageData> => {
  const scale = computeScale(
    image.width,
    image.height,
    canvasType.width,
    canvasType.height,
    fitMode,
  );

  const scaledWidth = Math.floor(image.width * scale);
  const scaledHeight = Math.floor(image.height * scale);
  const offsetX = (canvasType.width - scaledWidth) / 2;
  const offsetY = (canvasType.height - scaledHeight) / 2;

  if (resizeOptions.filter === "nearest") {
    const tempCanvas = acquireCanvas(canvasType.width, canvasType.height);
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      releaseCanvas(tempCanvas);
      throw new Error("Could not get 2D context for nearest-neighbor canvas");
    }

    tempCtx.imageSmoothingEnabled = false;
    tempCtx.fillStyle = rgbString(paddingColor, paddingAlpha);
    tempCtx.fillRect(0, 0, canvasType.width, canvasType.height);
    tempCtx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

    const result = tempCtx.getImageData(0, 0, canvasType.width, canvasType.height);
    releaseCanvas(tempCanvas);
    return result;
  }

  const picaInstance = await getPica();

  const sourceCanvas = acquireCanvas(image.width, image.height);
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    releaseCanvas(sourceCanvas);
    throw new Error("Could not get 2D context for source canvas");
  }
  sourceCtx.drawImage(image, 0, 0);

  const scaledCanvas = acquireCanvas(scaledWidth, scaledHeight);

  await picaInstance.resize(sourceCanvas, scaledCanvas, {
    filter: resizeOptions.filter,
    unsharpAmount: resizeOptions.unsharpAmount,
    unsharpRadius: 0.6,
    unsharpThreshold: 1,
  });

  releaseCanvas(sourceCanvas);

  const finalCanvas = acquireCanvas(canvasType.width, canvasType.height);
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) {
    releaseCanvas(scaledCanvas);
    releaseCanvas(finalCanvas);
    throw new Error("Could not get 2D context for scaled output canvas");
  }

  finalCtx.fillStyle = rgbString(paddingColor, paddingAlpha);
  finalCtx.fillRect(0, 0, canvasType.width, canvasType.height);
  finalCtx.drawImage(scaledCanvas, offsetX, offsetY);

  releaseCanvas(scaledCanvas);

  const result = finalCtx.getImageData(0, 0, canvasType.width, canvasType.height);
  releaseCanvas(finalCanvas);
  return result;
};
