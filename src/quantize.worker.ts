import { quantize, type QuantMethod } from "./quantize";
import type { RGB } from "./palette";

interface QuantizeRequest {
  type: "quantize";
  imageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  method: QuantMethod;
}

interface QuantizeResponse {
  type: "result";
  quantized: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  adaptivePalette: readonly RGB[];
  combinedPalette: RGB[];
}

interface ErrorResponse {
  type: "error";
  message: string;
}

type WorkerMessage = QuantizeRequest;
type WorkerResponse = QuantizeResponse | ErrorResponse;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  try {
    const { imageData, method } = e.data;
    const input = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height,
    );

    const result = quantize(input, method);

    const response: WorkerResponse = {
      type: "result",
      quantized: {
        data: new Uint8ClampedArray(result.quantized.data),
        width: result.quantized.width,
        height: result.quantized.height,
      },
      adaptivePalette: result.adaptivePalette,
      combinedPalette: result.combinedPalette,
    };

    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      type: "error",
      message: err instanceof Error ? err.message : "Quantization failed",
    };
    self.postMessage(response);
  }
};
