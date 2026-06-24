import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}
