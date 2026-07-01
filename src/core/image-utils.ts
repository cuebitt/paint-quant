import type { ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";

export function rgbString(color: RGB, alpha?: number): string {
  if (alpha !== undefined) {
    return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
  }
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

export function computeScale(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number,
  fitMode: ImageFitMode,
): number {
  if (fitMode === "width") return targetWidth / imageWidth;
  if (fitMode === "height") return targetHeight / imageHeight;
  return Math.min(targetWidth / imageWidth, targetHeight / imageHeight);
}

export interface ErrorResponse {
  type: "error";
  message: string;
}

export interface SerializedImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}
