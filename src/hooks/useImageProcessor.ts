import { useEffect, useRef } from "preact/hooks";
import type { Dispatch } from "preact/hooks";
import type { RefObject } from "preact";
import type { AppState, AppAction } from "@/app/app-state";
import type { QuantMethod, QuantizeOptions } from "@/core/quantize";
import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/core/palette";
import type { ResizeOptions } from "@/core/preprocess";
import { imageDataToBlob } from "@/lib/utils";

export interface ImageProcessorWorkers {
  workerRef: RefObject<Worker | null>;
  importWorkerRef: RefObject<Worker | null>;
  originalImageRef: RefObject<HTMLImageElement | null>;
  quantizedDataRef: RefObject<{
    quantized: ImageData;
    adaptivePalette: readonly RGB[];
  } | null>;
  pendingProcessRef: RefObject<{
    displayDataUrl: string;
    method: QuantMethod;
    quantEnabled: boolean;
    quantOptions: QuantizeOptions;
  } | null>;
  pendingResultRef: RefObject<{
    type: "preprocessed" | "quantized";
    processedData: ImageData;
    adaptivePalette?: readonly RGB[];
  } | null>;
  flushPendingResult: () => void;
}

export type ProcessImageFn = (
  img: HTMLImageElement,
  canvas: CanvasType,
  method: QuantMethod,
  mode: ImageFitMode,
  padding: RGB,
  quantEnabled: boolean,
  quantOptions: QuantizeOptions,
  resizeOptions: ResizeOptions,
) => Promise<void>;

export function useImageProcessor(
  dispatch: Dispatch<AppAction>,
  processImage: ProcessImageFn,
  stateRef: RefObject<AppState>,
): ImageProcessorWorkers {
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
  const pendingResultRef = useRef<{
    type: "preprocessed" | "quantized";
    processedData: ImageData;
    adaptivePalette?: readonly RGB[];
  } | null>(null);
  const displayDataUrlRef = useRef<string>("");
  const flushPendingResultRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../core/quantize.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const importWorker = new Worker(new URL("../formats/import.worker.ts", import.meta.url), {
      type: "module",
    });
    importWorkerRef.current = importWorker;

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
        img.onerror = () => {
          URL.revokeObjectURL(dataUrl);
          dispatch({ type: "SET_ERROR", error: "Failed to load parsed image" });
        };
        img.src = dataUrl;
      }
    };

    importWorker.onerror = () => {
      dispatch({ type: "SET_ERROR", error: "Import worker failed" });
    };

    async function flushPendingResult() {
      const pendingResult = pendingResultRef.current;
      const displayDataUrl = displayDataUrlRef.current;
      if (!pendingResult || !displayDataUrl) return;

      try {
        const blob = await imageDataToBlob(pendingResult.processedData);
        dispatch({
          type: "SET_RESULT",
          preprocessed: displayDataUrl,
          processed: URL.createObjectURL(blob),
          adaptive: pendingResult.adaptivePalette ?? [],
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to finalize image result",
        });
      }
      pendingResultRef.current = null;
      pendingProcessRef.current = null;
    }

    flushPendingResultRef.current = flushPendingResult;

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
          displayDataUrlRef.current = URL.createObjectURL(blob);
          if (pendingProcessRef.current) {
            pendingProcessRef.current.displayDataUrl = displayDataUrlRef.current;
          }
          void flushPendingResult();
        });
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

        pendingResultRef.current = {
          type: "quantized",
          processedData: quantized,
          adaptivePalette: msg.adaptivePalette,
        };
        void flushPendingResult();
      }
    };

    worker.onerror = () => {
      dispatch({ type: "SET_ERROR", error: "Image worker failed" });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      importWorker.terminate();
      importWorkerRef.current = null;
    };
  }, [processImage, stateRef, dispatch]);

  const flushPendingResult = () => flushPendingResultRef.current?.();

  return {
    workerRef,
    importWorkerRef,
    originalImageRef,
    quantizedDataRef,
    pendingProcessRef,
    pendingResultRef,
    flushPendingResult,
  };
}
