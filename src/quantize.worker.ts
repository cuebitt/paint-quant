import { quantize, type QuantMethod, type QuantizeOptions } from "@/quantize";
import type { RGB } from "@/palette";
import type { ImageFitMode } from "@/types";
import type { ResizeFilter } from "@/preprocess";

interface QuantizeRequest {
  type: "quantize";
  imageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  method: QuantMethod;
  options: QuantizeOptions;
}

interface PreprocessRequest {
  type: "preprocess";
  imageBitmap: ImageBitmap;
  canvasWidth: number;
  canvasHeight: number;
  fitMode: ImageFitMode;
  paddingColor: RGB;
  resizeFilter: ResizeFilter;
  unsharpAmount: number;
}

interface DisplayRequest {
  type: "display";
  imageBitmap: ImageBitmap;
  canvasWidth: number;
  canvasHeight: number;
  fitMode: ImageFitMode;
  paddingColor: RGB;
}

type WorkerRequest = QuantizeRequest | PreprocessRequest | DisplayRequest;

interface QuantizeResponse {
  type: "quantized";
  quantized: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  adaptivePalette: readonly RGB[];
}

interface PreprocessResponse {
  type: "preprocessed";
  imageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
}

interface DisplayResponse {
  type: "displayed";
  imageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
}

interface ErrorResponse {
  type: "error";
  message: string;
}

type WorkerResponse = QuantizeResponse | PreprocessResponse | DisplayResponse | ErrorResponse;

function computeScale(
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

function rgbString(color: RGB): string {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function handlePreprocess(msg: PreprocessRequest): PreprocessResponse {
  const { imageBitmap, canvasWidth, canvasHeight, fitMode, paddingColor, resizeFilter } = msg;

  const scale = computeScale(
    imageBitmap.width,
    imageBitmap.height,
    canvasWidth,
    canvasHeight,
    fitMode,
  );

  const scaledWidth = Math.floor(imageBitmap.width * scale);
  const scaledHeight = Math.floor(imageBitmap.height * scale);
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.fillStyle = rgbString(paddingColor);
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (resizeFilter === "nearest") {
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  ctx.drawImage(imageBitmap, offsetX, offsetY, scaledWidth, scaledHeight);
  imageBitmap.close();

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  return {
    type: "preprocessed",
    imageData: {
      data: new Uint8ClampedArray(imageData.data),
      width: imageData.width,
      height: imageData.height,
    },
  };
}

function handleDisplay(msg: DisplayRequest): DisplayResponse {
  const { imageBitmap, canvasWidth, canvasHeight, fitMode, paddingColor } = msg;

  const imgW = imageBitmap.width;
  const imgH = imageBitmap.height;
  const targetRatio = canvasWidth / canvasHeight;
  const imageRatio = imgW / imgH;

  let dw: number;
  let dh: number;

  if (fitMode === "width") {
    dw = imgW;
    dh = Math.round(imgW / targetRatio);
  } else if (fitMode === "height") {
    dh = imgH;
    dw = Math.round(imgH * targetRatio);
  } else {
    if (imageRatio > targetRatio) {
      dw = imgW;
      dh = Math.round(imgW / targetRatio);
    } else {
      dh = imgH;
      dw = Math.round(imgH * targetRatio);
    }
  }

  const scale = computeScale(imgW, imgH, dw, dh, fitMode);
  const scaledWidth = Math.round(imgW * scale);
  const scaledHeight = Math.round(imgH * scale);
  const offsetX = (dw - scaledWidth) / 2;
  const offsetY = (dh - scaledHeight) / 2;

  const canvas = new OffscreenCanvas(dw, dh);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = rgbString(paddingColor);
  ctx.fillRect(0, 0, dw, dh);
  ctx.drawImage(imageBitmap, offsetX, offsetY, scaledWidth, scaledHeight);
  imageBitmap.close();

  const imageData = ctx.getImageData(0, 0, dw, dh);

  return {
    type: "displayed",
    imageData: {
      data: new Uint8ClampedArray(imageData.data),
      width: imageData.width,
      height: imageData.height,
    },
  };
}

function handleQuantize(msg: QuantizeRequest): QuantizeResponse {
  const { imageData, method, options } = msg;
  const input = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  );

  const result = quantize(input, method, options);

  return {
    type: "quantized",
    quantized: {
      data: new Uint8ClampedArray(result.quantized.data),
      width: result.quantized.width,
      height: result.quantized.height,
    },
    adaptivePalette: result.adaptivePalette,
  };
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const msg = e.data;
    let response: WorkerResponse;

    switch (msg.type) {
      case "preprocess":
        response = handlePreprocess(msg);
        break;
      case "display":
        response = handleDisplay(msg);
        break;
      case "quantize":
        response = handleQuantize(msg);
        break;
      default:
        throw new Error(`Unknown message type: ${(msg as { type: string }).type}`);
    }

    self.postMessage(response);
  } catch (err) {
    const response: ErrorResponse = {
      type: "error",
      message: err instanceof Error ? err.message : "Processing failed",
    };
    self.postMessage(response);
  }
};
