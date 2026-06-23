import { useEffect, useRef } from "preact/hooks";
import type { Dispatch } from "preact/hooks";
import type { QuantMethod, QuantizeOptions } from "@/quantize";
import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/palette";
import type { ResizeOptions } from "@/preprocess";

function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

export function useImageProcessor(
  dispatch: Dispatch<any>,
  processImage: (
    img: HTMLImageElement,
    canvas: CanvasType,
    method: QuantMethod,
    mode: ImageFitMode,
    padding: RGB,
    quantEnabled: boolean,
    quantOptions: QuantizeOptions,
    resizeOptions: ResizeOptions,
  ) => Promise<void>,
  stateRef: React.RefObject<{
    selectedCanvas: CanvasType;
    quantMethod: QuantMethod;
    fitMode: ImageFitMode;
    paddingColor: RGB;
    quantizationEnabled: boolean;
    adaptiveColorCount: number;
    includeFixedPalette: boolean;
    resizeFilter: any;
    unsharpAmount: number;
  }>,
) {
  const workerRef = useRef<Worker | null>(null);
  const importWorkerRef = useRef<Worker | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const quantizedDataRef = useRef<{
    quantized: ImageData;
    adaptivePalette: readonly RGB[];
  } | null>(null);
  const pendingProcessRef = useRef<{
    displayDataUrl: string;
    method: QuantMethod;
    quantEnabled: boolean;
    quantOptions: QuantizeOptions;
  } | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../quantize.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const importWorker = new Worker(new URL("../import.worker.ts", import.meta.url), {
      type: "module",
    });
    importWorkerRef.current = importWorker;

    let displayDataUrl = "";

    importWorker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "error") {
        dispatch({ type: "SET_ERROR", error: msg.message });
        return;
      }

      if (msg.type === "result") {
        const blob = new Blob([new Uint8ClampedArray(msg.imageData).buffer], { type: "image/png" });
        const dataUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          dispatch({ type: "SET_ORIGINAL", url: dataUrl });
          const s = stateRef.current;
          if (!s) return;
          void processImage(
            img,
            s.selectedCanvas,
            s.quantMethod,
            s.fitMode,
            s.paddingColor,
            s.quantizationEnabled,
            { colors: s.adaptiveColorCount, includeFixedPalette: s.includeFixedPalette },
            { filter: s.resizeFilter, unsharpAmount: s.unsharpAmount },
          );
        };
        img.src = dataUrl;
      }
    };

    importWorker.onerror = () => {
      dispatch({ type: "SET_ERROR", error: "Import worker error" });
    };

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "error") {
        dispatch({ type: "SET_ERROR", error: msg.message });
        return;
      }

      if (msg.type === "displayed") {
        const displayImageData = new ImageData(
          new Uint8ClampedArray(msg.imageData.data),
          msg.imageData.width,
          msg.imageData.height,
        );
        void imageDataToBlob(displayImageData).then((blob) => {
          displayDataUrl = URL.createObjectURL(blob);
          if (pendingProcessRef.current) {
            pendingProcessRef.current.displayDataUrl = displayDataUrl;
          }
        });
        return;
      }

      if (msg.type === "preprocessed") {
        const processedData = new ImageData(
          new Uint8ClampedArray(msg.imageData.data),
          msg.imageData.width,
          msg.imageData.height,
        );

        const pending = pendingProcessRef.current;
        if (!pending) return;

        if (!pending.quantEnabled) {
          quantizedDataRef.current = {
            quantized: processedData,
            adaptivePalette: [],
          };

          void imageDataToBlob(processedData).then((blob) => {
            dispatch({
              type: "SET_RESULT",
              preprocessed: displayDataUrl,
              processed: URL.createObjectURL(blob),
              adaptive: [],
            });
          });
          pendingProcessRef.current = null;
          return;
        }

        const buf = processedData.data.buffer.slice(0);
        workerRef.current?.postMessage(
          {
            type: "quantize",
            imageData: {
              data: new Uint8ClampedArray(buf),
              width: processedData.width,
              height: processedData.height,
            },
            method: pending.method,
            options: pending.quantOptions,
          },
          [buf],
        );
        return;
      }

      if (msg.type === "quantized") {
        const quantized = new ImageData(
          new Uint8ClampedArray(msg.quantized.data),
          msg.quantized.width,
          msg.quantized.height,
        );

        quantizedDataRef.current = {
          quantized,
          adaptivePalette: msg.adaptivePalette,
        };

        void imageDataToBlob(quantized).then((blob) => {
          dispatch({
            type: "SET_RESULT",
            preprocessed: displayDataUrl,
            processed: URL.createObjectURL(blob),
            adaptive: msg.adaptivePalette,
          });
          pendingProcessRef.current = null;
        });
      }
    };

    worker.onerror = () => {
      dispatch({ type: "SET_ERROR", error: "Worker error" });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      importWorker.terminate();
      importWorkerRef.current = null;
    };
  }, [processImage, stateRef, dispatch]);

  return { workerRef, importWorkerRef, originalImageRef, quantizedDataRef, pendingProcessRef };
}
