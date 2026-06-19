// Image processing utilities for paint-quant application

/**
 * Calculate luminance of an RGB color value
 * Used for determining grid color contrast
 *
 * Formula: L = 0.299R + 0.587G + 0.114B
 *
 * @param r - Red channel value (0-255)
 * @param g - Green channel value (0-255)
 * @param b - Blue channel value (0-255)
 * @returns Luminance value between 0 and 1
 */
export const calculateLuminance = (r: number, g: number, b: number): number => {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/**
 * Determine optimal grid color based on image luminance
 * Chooses between black or white grid lines for contrast
 *
 * @param imageData - ImageData object containing pixel information
 * @returns CSS color string for grid lines
 */
export const chooseGridColor = (imageData: ImageData): string => {
  let r = 0;
  let g = 0;
  let b = 0;
  let pixelCount = 0;
  const { data } = imageData;

  // Calculate average RGB values across all pixels
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    pixelCount++;
  }

  if (pixelCount === 0) return "rgba(0, 0, 0, 0.5)";

  // Compute averages and determine luminance
  r = Math.floor(r / pixelCount);
  g = Math.floor(g / pixelCount);
  b = Math.floor(b / pixelCount);

  const luminance = calculateLuminance(r, g, b);

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)";
};

/**
 * Preprocess uploaded image to fit specified canvas dimensions
 * Resizes image while maintaining aspect ratio and adds white background
 *
 * @param image - HTMLImageElement to preprocess
 * @param canvasType - Target canvas dimensions and cell configuration
 * @returns ImageData object ready for quantization
 */
export const preprocessImageForCanvas = (
  image: HTMLImageElement,
  canvasType: CanvasType,
): ImageData => {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCanvas.width = canvasType.width;
  tempCanvas.height = canvasType.height;

  // Calculate scaling factor to fit image within canvas
  const scale = Math.min(canvasType.width / image.width, canvasType.height / image.height);
  const scaledWidth = Math.floor(image.width * scale);
  const scaledHeight = Math.floor(image.height * scale);
  const offsetX = (canvasType.width - scaledWidth) / 2;
  const offsetY = (canvasType.height - scaledHeight) / 2;

  // Fill with white background and center the image
  tempCtx.fillStyle = "white";
  tempCtx.fillRect(0, 0, canvasType.width, canvasType.height);
  tempCtx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

  return tempCtx.getImageData(0, 0, canvasType.width, canvasType.height);
};

// Export types used by these utilities
export interface CanvasType {
  name: string;
  width: number;
  height: number;
  cellsX: number;
  cellsY: number;
}

// Export CANVAS_TYPES for use in components
export const CANVAS_TYPES: CanvasType[] = [
  { name: "1×1 Canvas", width: 16, height: 16, cellsX: 1, cellsY: 1 },
  { name: "2×1 Long Canvas", width: 32, height: 16, cellsX: 2, cellsY: 1 },
  { name: "1×2 Tall Canvas", width: 16, height: 32, cellsX: 1, cellsY: 2 },
  { name: "2×2 Square", width: 32, height: 32, cellsX: 2, cellsY: 2 },
  { name: "3×3 Square", width: 48, height: 48, cellsX: 3, cellsY: 3 },
  { name: "4×4 Large Square", width: 64, height: 64, cellsX: 4, cellsY: 4 },
  { name: "3×2 Medium", width: 48, height: 32, cellsX: 3, cellsY: 2 },
  { name: "4×3 Wide", width: 64, height: 48, cellsX: 4, cellsY: 3 },
  { name: "2×3 Medium", width: 32, height: 48, cellsX: 2, cellsY: 3 },
  { name: "3×4 Tall", width: 48, height: 64, cellsX: 3, cellsY: 4 },
];
