import pica from "pica";
import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";
import { computeScale, rgbString } from "@/core/image-utils";

export const DEFAULT_PADDING_COLOR: RGB = [255, 255, 255];

export type ResizeFilter = "nearest" | "box" | "hamming" | "lanczos2" | "lanczos3" | "mks2013";

export interface ResizeOptions {
  filter: ResizeFilter;
  unsharpAmount: number;
}

const picaInstance = pica();

export const preprocessImageForCanvas = async (
  image: HTMLImageElement,
  canvasType: CanvasType,
  fitMode: ImageFitMode = "contain",
  paddingColor: RGB = DEFAULT_PADDING_COLOR,
  resizeOptions: ResizeOptions = { filter: "nearest", unsharpAmount: 0 },
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
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("Could not get 2D context for nearest-neighbor canvas");
    tempCanvas.width = canvasType.width;
    tempCanvas.height = canvasType.height;

    tempCtx.imageSmoothingEnabled = false;
    tempCtx.fillStyle = rgbString(paddingColor);
    tempCtx.fillRect(0, 0, canvasType.width, canvasType.height);
    tempCtx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

    return tempCtx.getImageData(0, 0, canvasType.width, canvasType.height);
  }

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) throw new Error("Could not get 2D context for source canvas");
  sourceCtx.drawImage(image, 0, 0);

  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;

  await picaInstance.resize(sourceCanvas, scaledCanvas, {
    filter: resizeOptions.filter,
    unsharpAmount: resizeOptions.unsharpAmount,
    unsharpRadius: 0.6,
    unsharpThreshold: 1,
  });

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasType.width;
  finalCanvas.height = canvasType.height;
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) throw new Error("Could not get 2D context for scaled output canvas");

  finalCtx.fillStyle = rgbString(paddingColor);
  finalCtx.fillRect(0, 0, canvasType.width, canvasType.height);
  finalCtx.drawImage(scaledCanvas, offsetX, offsetY);

  return finalCtx.getImageData(0, 0, canvasType.width, canvasType.height);
};
