import type { CanvasType, ImageFitMode } from "./types";
import type { RGB } from "./palette";

const DEFAULT_PADDING_COLOR: RGB = [255, 255, 255];

function rgbString(color: RGB): string {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

/**
 * Preprocess uploaded image to fit specified canvas dimensions
 */
export const preprocessImageForCanvas = (
  image: HTMLImageElement,
  canvasType: CanvasType,
  fitMode: ImageFitMode = "contain",
  paddingColor: RGB = DEFAULT_PADDING_COLOR,
): ImageData => {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) throw new Error("Failed to get 2D canvas context");
  tempCanvas.width = canvasType.width;
  tempCanvas.height = canvasType.height;

  let scale: number;
  if (fitMode === "width") {
    scale = canvasType.width / image.width;
  } else if (fitMode === "height") {
    scale = canvasType.height / image.height;
  } else {
    scale = Math.min(canvasType.width / image.width, canvasType.height / image.height);
  }

  const scaledWidth = Math.floor(image.width * scale);
  const scaledHeight = Math.floor(image.height * scale);
  const offsetX = (canvasType.width - scaledWidth) / 2;
  const offsetY = (canvasType.height - scaledHeight) / 2;

  tempCtx.imageSmoothingEnabled = false;
  tempCtx.fillStyle = rgbString(paddingColor);
  tempCtx.fillRect(0, 0, canvasType.width, canvasType.height);
  tempCtx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

  return tempCtx.getImageData(0, 0, canvasType.width, canvasType.height);
};

/**
 * Preprocess image for display at full resolution, padded to canvas aspect ratio
 */
export const preprocessForDisplay = (
  image: HTMLImageElement,
  canvasType: CanvasType,
  fitMode: ImageFitMode = "contain",
  paddingColor: RGB = DEFAULT_PADDING_COLOR,
): ImageData => {
  const targetRatio = canvasType.width / canvasType.height;
  const imageRatio = image.width / image.height;

  let canvasWidth: number;
  let canvasHeight: number;

  if (fitMode === "width") {
    canvasWidth = image.width;
    canvasHeight = Math.round(image.width / targetRatio);
  } else if (fitMode === "height") {
    canvasHeight = image.height;
    canvasWidth = Math.round(image.height * targetRatio);
  } else {
    if (imageRatio > targetRatio) {
      canvasWidth = image.width;
      canvasHeight = Math.round(image.width / targetRatio);
    } else {
      canvasHeight = image.height;
      canvasWidth = Math.round(image.height * targetRatio);
    }
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) throw new Error("Failed to get 2D canvas context");
  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;

  let scale: number;
  if (fitMode === "width") {
    scale = canvasWidth / image.width;
  } else if (fitMode === "height") {
    scale = canvasHeight / image.height;
  } else {
    scale = Math.min(canvasWidth / image.width, canvasHeight / image.height);
  }

  const scaledWidth = Math.round(image.width * scale);
  const scaledHeight = Math.round(image.height * scale);
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;

  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  tempCtx.fillStyle = rgbString(paddingColor);
  tempCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  tempCtx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

  return tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
};
